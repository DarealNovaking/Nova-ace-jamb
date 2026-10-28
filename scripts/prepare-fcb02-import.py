#!/usr/bin/env python3
"""Prepare review files only. This script has no database/network execution path."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import uuid

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'ENG-01-04': 'Approved English reading-text title is not identified by the source.'}
TABLES = {'versions': 'syllabus_versions', 'topics': 'topics', 'subtopics': 'subtopics'}
COLUMNS = {
    'versions': 'id,season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status,activated_at',
    'topics': 'id,subject_id,name,description,sort_order,active,syllabus_version_id',
    'subtopics': 'id,topic_id,name,description,sort_order,active,syllabus_version_id',
}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def sql_literal(value):
    return "'" + value.replace("'", "''") + "'"


def identifier(value):
    if not re.fullmatch(r'[a-z_][a-z_0-9]*', value):
        raise ValueError('Unexpected identifier in captured database contract')
    return '"' + value + '"'


def build_proposal(draft, target):
    snapshot = target['snapshot']
    seasons = [s for s in snapshot['seasons'] if s['exam_year'] == 2027]
    if len(seasons) != 1 or seasons[0]['status'] != 'draft':
        raise ValueError('Expected the captured single draft 2027 season')
    season = seasons[0]
    subjects = {s['code']: s for s in snapshot['subjects']}
    codes = [s['subject_code'] for s in draft['subjects']]
    if len(subjects) != 25 or len(codes) != 25 or set(codes) != set(subjects) or draft.get('publishable') is not False:
        raise ValueError('Subject mapping or draft boundary changed')
    existing = sorted([v for v in snapshot['versions'] if v['season_id'] == season['id']], key=lambda x: x['id'])
    if len(existing) != 25 or any(v['version'] != 1 or v['status'] != 'draft' or v['rights_status'] != 'pending' for v in existing):
        raise ValueError('Captured target versions changed; inspect before preparing again')
    if len({v['subject_id'] for v in existing}) != 25 or {v['subject_id'] for v in existing} != {s['id'] for s in subjects.values()}:
        raise ValueError('Captured subject/version binding incomplete')
    proposal = {'format_version': 1, 'generator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'project_id': target['project_id'], 'target_season': season,
                'draft_content_sha256': digest(draft), 'existing_versions': existing,
                'subjects': sorted(snapshot['subjects'], key=lambda s: s['id']),
                'incoming_foreign_keys': snapshot['incoming_foreign_keys'],
                'versions': [], 'topics': [], 'subtopics': [], 'bindings': [], 'exclusions': []}
    seen = set()
    for source in draft['subjects']:
        code = source['subject_code']
        subject = subjects[code]
        if not subject['active'] or source['publication_allowed'] is not False or source['rights_status'] != 'unverified' or source['editorial_review_complete'] is not False:
            raise ValueError('Only inactive unapproved source-review drafts may be proposed')
        old = next(v for v in existing if v['subject_id'] == subject['id'])
        def row_id(review_id):
            return str(uuid.uuid5(uuid.NAMESPACE_URL, f"nova-ace-jamb/fcb02/{proposal['draft_content_sha256']}/{season['id']}/{code}/{review_id}"))
        version_id = row_id('version-2')
        proposal['bindings'].append({'subject_code': code, 'subject_id': subject['id'], 'preserved_version_id': old['id'], 'new_version_id': version_id})
        proposal['versions'].append({
            'id': version_id, 'season_id': season['id'], 'subject_id': subject['id'], 'version': 2,
            'title': f"IBASS source review draft — {subject['name']} (2027 candidate)",
            'source_url': source['source_url'], 'source_title': f"Current IBASS PDF — {source['source_subject_label']}; applicability review required",
            'rights_status': 'pending', 'status': 'draft', 'activated_at': None,
            'provenance': {'package': 'fcb-02-draft-import', 'draft_content_sha256': proposal['draft_content_sha256'],
                           'subject_code': code, 'source_sha256': source['source_sha256'],
                           'source_pdf_pages': source['source_pdf_pages'], 'source_2027_applicability': source['source_2027_applicability'],
                           'year_specific_evidence': source.get('year_specific_evidence', []),
                           'publication_approved': False, 'independent_academic_approval': False,
                           'limits': ['No final 2027 exam configuration approval.', 'No English novel selected.',
                                      'No Arabic modern-period date selected.', 'PHE heading exceptions remain disclosed.',
                                      'No book text, questions, lesson content, audio or AI material.']}})
        for node in source['nodes']:
            topic_id = row_id(node['review_id'])
            for child, parent in [(node, None)] + [(c, topic_id) for c in node['children']]:
                review_id = child['review_id']
                if review_id in seen or not re.fullmatch(r'[A-Z]{3}-\d{2}(?:-\d{2})?', review_id):
                    raise ValueError('Duplicate or invalid review identity')
                seen.add(review_id)
                if review_id in EXCLUDED:
                    proposal['exclusions'].append({'review_id': review_id, 'reason': EXCLUDED[review_id]})
                    continue
                loc = child['source_locator']
                if not loc['anchor_verified'] or not 1 <= loc['pdf_page'] <= source['source_pdf_pages'] or not isinstance(child['label'], str) or not child['label'].strip():
                    raise ValueError('Unverified source locator or empty name')
                row = {'id': row_id(review_id), 'syllabus_version_id': version_id, 'name': child['label'],
                       'description': f"EDITORIAL REVIEW DRAFT {review_id}. Source PDF page {loc['pdf_page']}; anchor: {loc['anchor']}. Source SHA-256: {source['source_sha256']}. " +
                                      (f"Parent mapping: {child['parent_locator_check']}. " if parent else '') +
                                      'Not academically or rights approved; do not publish automatically.',
                       'sort_order': child['order'] * 10, 'active': False}
                row['topic_id' if parent else 'subject_id'] = parent or subject['id']
                proposal['subtopics' if parent else 'topics'].append(row)
    if len(seen) != 1169 or len(proposal['topics']) != 214 or len(proposal['subtopics']) != 954:
        raise ValueError('Reviewed coverage changed; revise exclusions and acceptance evidence')
    for key in TABLES:
        proposal[key].sort(key=lambda row: row['id'])
    for fk in proposal['incoming_foreign_keys']:
        for value in [fk['schema'], fk['table'], fk['target']] + fk['columns'] + fk['target_columns']:
            identifier(value)
    proposal['review_digest'] = digest(proposal)
    return proposal


FK_QUERY = """select coalesce(jsonb_agg(jsonb_build_object('schema',ns.nspname,'table',rel.relname,'constraint',c.conname,'target',target.relname,'columns',(select jsonb_agg(a.attname order by k.ord) from unnest(c.conkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum),'target_columns',(select jsonb_agg(a.attname order by k.ord) from unnest(c.confkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.attnum),'definition',pg_get_constraintdef(c.oid)) order by ns.nspname,rel.relname,c.conname),'[]'::jsonb) from pg_constraint c join pg_class rel on rel.oid=c.conrelid join pg_namespace ns on ns.oid=rel.relnamespace join pg_class target on target.oid=c.confrelid where c.contype='f' and c.confrelid in ('ace.syllabus_versions'::regclass,'ace.topics'::regclass,'ace.subtopics'::regclass)"""


def preflight_sql(p):
    existing_keys = sorted(p['existing_versions'][0])
    existing_expr = ','.join(sql_literal(k) + ',v.' + identifier(k) for k in existing_keys)
    version_ids = "select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x"
    return f""" -- Season/subject values are read-only preflight checks, not an approval or mutation.
 -- The authenticated role deliberately has no direct season UPDATE privilege.
 select jsonb_build_object('id',id,'exam_year',exam_year,'name',name,'status',status) into actual
 from ace.exam_seasons where id=(p->'target_season'->>'id')::uuid;
 if actual is distinct from p->'target_season' then raise exception 'Target season drift'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'active',active) order by id) into actual
 from ace.subjects where id in (select (s->>'id')::uuid from jsonb_array_elements(p->'subjects') s);
 if actual is distinct from p->'subjects' then raise exception 'Subject binding drift'; end if;
 select jsonb_agg(jsonb_build_object({existing_expr}) order by v.id) into actual
 from ace.syllabus_versions v where season_id=(p->'target_season'->>'id')::uuid and id not in ({version_ids});
 if actual is distinct from p->'existing_versions' then raise exception 'Preserved version drift'; end if;
 select ({FK_QUERY}) into actual;
 if actual is distinct from p->'incoming_foreign_keys' then raise exception 'Foreign-key contract drift; inspect rollback safety'; end if;
 select count(*) into new_count from ace.syllabus_versions where id in ({version_ids});
"""


def render_body(p, rollback=False):
    content = canonical({k:v for k,v in p.items() if k != 'review_digest'})
    payload = sql_literal(base64.b64encode(content.encode()).decode())
    existing_keys = sorted(p['existing_versions'][0])
    existing_expr = ','.join(sql_literal(k) + ',v.' + identifier(k) for k in existing_keys)
    version_ids = "select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x"
    statements = [f"""do $fcb02$
declare payload_text text := convert_from(decode({payload},'base64'),'UTF8');
 p jsonb := payload_text::jsonb; actual jsonb; new_count integer;
 reviewed_digest text := {sql_literal(p['review_digest'])};
begin
 if encode(sha256(convert_to(payload_text,'UTF8')),'hex') is distinct from reviewed_digest then raise exception 'Payload digest mismatch' using errcode='22023'; end if;
 if current_setting('ace.fcb02_review_digest',true) is distinct from reviewed_digest then
  raise exception 'Explicit reviewed package digest required' using errcode='42501';
 end if;
 if auth.uid() is null or not ace.is_admin() then
  raise exception 'Authenticated administrator context required; never forge claims in this script' using errcode='42501';
 end if;
 -- Serialize both applying and removing this package against ordinary taxonomy writes.
 lock table ace.syllabus_versions, ace.topics, ace.subtopics in share row exclusive mode;
{preflight_sql(p)}
"""]
    if rollback:
        statements.append(" if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Rollback requires trusted database owner context to inspect all references' using errcode='42501'; end if;\n")
    if not rollback:
        statements.append(' if new_count=0 then\n')
        for key, table in TABLES.items():
            cols = COLUMNS[key]
            statements.append(f" insert into ace.{table}({cols}) select {cols} from jsonb_populate_recordset(null::ace.{table},p->{sql_literal(key)});\n")
        statements.append(' end if;\n')
    else:
        statements.append(" if new_count=0 then return; end if;\n")
        for table in TABLES.values():
            predicate = f'id in ({version_ids})' if table == 'syllabus_versions' else f'syllabus_version_id in ({version_ids})'
            statements.append(f' perform 1 from ace.{table} where {predicate} for update;\n')
    for key, table in TABLES.items():
        removed = " - 'created_at'" + (" - 'updated_at'" if key == 'versions' else '')
        predicate = f"id in ({version_ids})" if key == 'versions' else f"syllabus_version_id in ({version_ids})"
        statements.append(f" select coalesce(jsonb_agg(to_jsonb(t){removed} order by t.id),'[]'::jsonb) into actual from ace.{table} t where {predicate};\n if actual is distinct from p->{sql_literal(key)} then raise exception 'Package row drift in {table}; no overwrite or deletion permitted'; end if;\n")
    if rollback:
        for fk in p['incoming_foreign_keys']:
            if fk['schema'] == 'ace' and fk['table'] in TABLES.values():
                continue
            target_key = next(k for k, v in TABLES.items() if v == fk['target'])
            predicates = []
            for col, target_col in zip(fk['columns'], fk['target_columns']):
                predicates.append(f"{identifier(col)} in (select (x->>{sql_literal(target_col)})::uuid from jsonb_array_elements(p->{sql_literal(target_key)}) x)")
            statements.append(f" if exists(select 1 from {identifier(fk['schema'])}.{identifier(fk['table'])} where {' or '.join(predicates)}) then raise exception 'Referenced draft content: {fk['table']}; rollback refused'; end if;\n")
        statements.append(f" delete from ace.subtopics where syllabus_version_id in ({version_ids});\n delete from ace.topics where syllabus_version_id in ({version_ids});\n delete from ace.syllabus_versions where id in ({version_ids});\n")
    statements.append('end\n$fcb02$;\n')
    return ''.join(statements)


def render_sql(p, mode='preview'):
    if mode not in {'preview','apply','rollback'}:
        raise ValueError('Unknown review mode')
    sql = '-- UNAPPLIED FCB-02 review proposal. No claims/roles are set here.\n'
    sql += "begin;\nset local standard_conforming_strings=on;\nset local lock_timeout='3s';\nset local statement_timeout='30s';\n"
    sql += render_body(p, rollback=mode == 'rollback')
    return sql + ('rollback;\n' if mode == 'preview' else 'commit;\n')


def payload_text(p):
    return canonical({k:v for k,v in p.items() if k != 'review_digest'})


def executor_body(p):
    version_ids = "select (x->>'id')::uuid from jsonb_array_elements(p->'versions') x"
    sql = f"""declare
 p jsonb; actual jsonb; new_count integer; changed boolean := false; referenced boolean := false;
 reviewed_digest constant text := {sql_literal(p['review_digest'])};
begin
 if auth.uid() is null or not ace.is_admin() then raise exception 'Authenticated administrator context required' using errcode='42501'; end if;
 if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Trusted executor owner required' using errcode='42501'; end if;
 -- Hold authorization until this transaction ends, including concurrent demotion.
 perform 1 from ace.roles where user_id=auth.uid() and role='admin' for share;
 if not found then raise exception 'Authenticated administrator context required' using errcode='42501'; end if;
 if p_action is null or p_action not in ('preview','stage','undo') then raise exception 'Invalid package action' using errcode='22023'; end if;
 if p_review_digest is distinct from reviewed_digest or octet_length(p_package) is distinct from {len(payload_text(p).encode())}
 or encode(sha256(convert_to(p_package,'UTF8')),'hex') is distinct from reviewed_digest then raise exception 'Reviewed package mismatch' using errcode='22023'; end if;
 p := p_package::jsonb;
 lock table ace.syllabus_versions, ace.topics, ace.subtopics in share row exclusive mode;
{preflight_sql(p)}
 if new_count=0 and p_action='stage' then
"""
    for key, table in TABLES.items():
        cols = COLUMNS[key]
        sql += f" insert into ace.{table}({cols}) select {cols} from jsonb_populate_recordset(null::ace.{table},p->{sql_literal(key)});\n"
    sql += " changed := true; new_count := 25;\n end if;\n if new_count>0 then\n"
    # Strong row locks prevent new FK references from racing guarded removal.
    for key, table in TABLES.items():
        predicate = f'id in ({version_ids})' if key == 'versions' else f'syllabus_version_id in ({version_ids})'
        removed = " - 'created_at'" + (" - 'updated_at'" if key == 'versions' else '')
        sql += f" perform 1 from ace.{table} where {predicate} for update;\n"
        sql += f" select coalesce(jsonb_agg(to_jsonb(t){removed} order by t.id),'[]'::jsonb) into actual from ace.{table} t where {predicate};\n if actual is distinct from p->{sql_literal(key)} then raise exception 'Package row drift in {table}; no overwrite or deletion permitted'; end if;\n"
    for fk in p['incoming_foreign_keys']:
        if fk['schema'] == 'ace' and fk['table'] in TABLES.values(): continue
        key = next(k for k,v in TABLES.items() if v == fk['target'])
        predicates = [f"{identifier(col)} in (select (x->>{sql_literal(target_col)})::uuid from jsonb_array_elements(p->{sql_literal(key)}) x)" for col,target_col in zip(fk['columns'],fk['target_columns'])]
        sql += f" referenced := referenced or exists(select 1 from {identifier(fk['schema'])}.{identifier(fk['table'])} where {' or '.join(predicates)});\n"
    sql += """ if p_action='undo' then
 if referenced then raise exception 'Referenced draft content; removal refused'; end if;
"""
    for table in ('subtopics','topics','syllabus_versions'):
        predicate = f'id in ({version_ids})' if table == 'syllabus_versions' else f'syllabus_version_id in ({version_ids})'
        sql += f' delete from ace.{table} where {predicate};\n'
    sql += """ changed := true; new_count := 0;
 end if;
 end if;
 if changed then
 insert into ace.audit_events(actor_user_id,event_type,entity_type,metadata)
 values(auth.uid(),case when p_action='stage' then 'syllabus_review_package_staged' else 'syllabus_review_package_removed' end,'syllabus_review_package',jsonb_build_object('review_digest',reviewed_digest,'publication_allowed',false));
 end if;
 return jsonb_build_object('state',case when new_count=0 then 'not_staged' else 'staged' end,
 'can_stage',new_count=0,'can_undo',new_count=25 and not referenced,'changed',changed,
 'versions',case when new_count=0 then 0 else 25 end,'topics',case when new_count=0 then 0 else 214 end,
 'subtopics',case when new_count=0 then 0 else 954 end,'target_year',2027,'publication_allowed',false,'rights_status','pending');
end
"""
    return sql


def render_executor(p):
    return """-- UNAPPLIED installer: creates one fixed-package administrator RPC; stages no content.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
create function ace.manage_fcb02_draft(p_action text, p_review_digest text, p_package text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog
set lock_timeout = '3s'
as $executor$
""" + executor_body(p) + """$executor$;
alter function ace.manage_fcb02_draft(text,text,text) owner to postgres;
revoke all on function ace.manage_fcb02_draft(text,text,text) from public, anon;
grant execute on function ace.manage_fcb02_draft(text,text,text) to authenticated;
notify pgrst, 'reload schema';
commit;
"""


def render_uninstall(p):
    body_hash = hashlib.sha256(('\n'+executor_body(p)).encode()).hexdigest()
    return f"""-- UNAPPLIED uninstall: remove only the unchanged helper, never staged content.
begin;
set local lock_timeout='3s';
do $uninstall$
declare f record;
begin
 select prosrc,prosecdef,proconfig,pg_get_userbyid(proowner) owner_name into f from pg_proc where oid=to_regprocedure('ace.manage_fcb02_draft(text,text,text)');
 if not found then return; end if;
 if encode(sha256(convert_to(f.prosrc,'UTF8')),'hex')<>{sql_literal(body_hash)} or not f.prosecdef or f.owner_name<>'postgres'
 or f.proconfig is distinct from array['search_path=pg_catalog','lock_timeout=3s']::text[] then raise exception 'Executor definition drift; uninstall refused'; end if;
 drop function ace.manage_fcb02_draft(text,text,text);
end
$uninstall$;
notify pgrst, 'reload schema';
commit;
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    draft_path = ROOT/'docs/content-review/fcb-02-taxonomy-draft-2026-10-28.json'
    validation = json.loads((ROOT/'docs/content-review/fcb-02-validation-2026-10-28.json').read_text())
    if hashlib.sha256(draft_path.read_bytes()).hexdigest() != validation['draft_sha256']:
        raise ValueError('Draft file changed after source review; verify it before generating')
    p = build_proposal(json.loads(draft_path.read_text()), json.loads((ROOT/'docs/content-review/fcb-02-import-target-snapshot-2026-10-28.json').read_text()))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir/'proposal.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    for mode in ('preview','apply','rollback'):
        (args.output_dir/f'{mode}.sql').write_text(render_sql(p,mode))
    (args.output_dir/'install-executor.sql').write_text(render_executor(p))
    (args.output_dir/'uninstall-executor.sql').write_text(render_uninstall(p))
    (args.output_dir/'fcb02ReviewPayload.json').write_text(json.dumps({'digest':p['review_digest'],'payload':payload_text(p)},ensure_ascii=False)+'\n')
    review = {k:p[k] for k in ('format_version','project_id','target_season','draft_content_sha256','generator_sha256','review_digest','bindings','exclusions')}
    review['counts'] = {k:len(p[k]) for k in TABLES}
    review['publication_allowed'] = False
    review['generated_files'] = {f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(args.output_dir.iterdir()) if f.name in {'proposal.json','preview.sql','apply.sql','rollback.sql','install-executor.sql','uninstall-executor.sql','fcb02ReviewPayload.json'}}
    (args.output_dir/'review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'versions':len(p['versions']),'topics':len(p['topics']),'subtopics':len(p['subtopics']),'review_digest':p['review_digest'],'database_changes':False}))

if __name__ == '__main__': main()

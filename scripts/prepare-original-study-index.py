"""Generate a private, independently organized ACE concept-index candidate."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import uuid

ROOT = Path(__file__).resolve().parents[1]

def build(groups):
    wrapper = json.loads((ROOT / 'src/data/fcb02ReviewPayload.json').read_text())
    if hashlib.sha256(wrapper['payload'].encode()).hexdigest() != wrapper['digest']:
        raise ValueError('Frozen source digest changed')
    source = json.loads(wrapper['payload'])
    children = {row['id']: dict(row) for row in source['subtopics']}
    overlay = json.loads((ROOT / 'docs/content-review/fcb-02-editorial-corrections-2026-10-28.json').read_text())
    actual_added = {'Derivatives': 'b8cc0f71-4227-4e61-9bd7-fec50ab3130f', 'Conditional sentences': '2f6c5f55-2982-4efd-acd5-ff753402f262'}
    for op in overlay['operations']:
        if op['operation'] == 'rename_subtopic':
            old = op['expected_row']
            if children.get(old['id']) != old:
                raise ValueError('Correction preimage changed')
            children[old['id']].update(op['changes'])
        elif op['operation'] == 'add_subtopic':
            row = dict(op['row'])
            row['id'] = actual_added[row['name']]
            children[row['id']] = row
        else:
            raise ValueError('Unknown correction')
    def fingerprint(rows, keys):
        parts = []
        for row in sorted(rows, key=lambda r: r['id']):
            raw = json.dumps([row[k] for k in keys], ensure_ascii=False, separators=(', ', ': '))
            parts.append(row['id'] + ':' + hashlib.md5(raw.encode()).hexdigest())
        return hashlib.md5(','.join(parts).encode()).hexdigest()
    fingerprints = {
        'topics': fingerprint(source['topics'], ['id','subject_id','name','description','sort_order','active','syllabus_version_id']),
        'subtopics': fingerprint(children.values(), ['id','topic_id','name','description','sort_order','active','syllabus_version_id'])}
    if fingerprints != {'topics':'2012de2bfc6beeebcc1e31a232037c54','subtopics':'86806e7337523a601427debd19e26888'}:
        raise ValueError('Corrected source does not match verified live snapshot')
    subjects = {s['code']: s for s in source['subjects']}
    roots = {t['id']: t for t in source['topics']}
    versions = {v['subject_id']: v for v in source['versions']}
    child_groups = {}
    for row in children.values():
        child_groups.setdefault(row['topic_id'], []).append(row)
    if len(groups['subjects']) != 25 or {s['subject_code'] for s in groups['subjects']} != set(subjects):
        raise ValueError('Subject coverage mismatch')
    result = {'format_version':1, 'prepared_on':'2026-10-29', 'scope':'ACE original study index; concept names and independent arrangement only; not an official JAMB publication or complete lesson', 'source_fingerprints':fingerprints, 'versions':[], 'topics':[], 'subtopics':[], 'lineage':[]}
    seen = set()
    def uid(key):
        return str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://nova-ace-jamb/study-index/2026-10-29/' + key))
    def label(name):
        return re.sub(r'^Section\s+[A-Z]\s*:\s*', '', name).strip()
    for subject in sorted(groups['subjects'], key=lambda s: s['subject_code']):
        code = subject['subject_code']
        sid = subjects[code]['id']
        old = versions[sid]
        vid = uid(code)
        result['versions'].append({'id':vid, 'season_id':old['season_id'], 'subject_id':sid, 'version':3, 'title':'ACE study index — ' + subjects[code]['name'], 'source_title':'IBASS coverage reference — ' + subjects[code]['name'], 'source_url':old['source_url'], 'rights_status':'pending', 'status':'draft', 'activated_at':None, 'provenance':{'package':'fcb-02-original-study-index', 'source_review_version_id':old['id'], 'source_sha256':old['provenance']['source_sha256'], 'official_jamb_publication':False, 'reading_texts_confirmed':False, 'publication_approved':False, 'scope':'Factual concept names and ACE arrangement only; no source prose, books, questions, images or audio.'}})
        keys, names = set(), set()
        for order, group in enumerate(sorted(subject['study_groups'], key=lambda g:g['name'].casefold()), 1):
            if not group['name'].strip() or group['name'] != group['name'].strip() or not group['source_topic_ids'] or not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*', group['key']) or group['key'] in keys or group['name'].casefold() in names:
                raise ValueError('Invalid or duplicate study group')
            keys.add(group['key']); names.add(group['name'].casefold())
            tid = uid(code + '/' + group['key'])
            result['topics'].append({'id':tid,'subject_id':sid,'syllabus_version_id':vid,'name':group['name'],'description':None,'sort_order':order*10,'active':False})
            terms = {}
            for rid in group['source_topic_ids']:
                if rid in seen or rid not in roots or roots[rid]['subject_id'] != sid:
                    raise ValueError('Duplicate, missing or cross-subject root')
                seen.add(rid)
                root = roots[rid]
                # Keep parent context for repeated terms across different source domains.
                for row in [root] + child_groups.get(rid, []):
                    key = (rid, label(row['name']).casefold())
                    terms.setdefault(key, {'name':label(row['name']), 'context':label(root['name']), 'ids':[]})['ids'].append(row['id'])
            counts = {}
            for term in terms.values(): counts[term['name'].casefold()] = counts.get(term['name'].casefold(), 0) + 1
            for term in terms.values():
                if counts[term['name'].casefold()] > 1:
                    term['name'] += ' (' + term['context'] + ')'
            for pos, (key, term) in enumerate(sorted(terms.items(), key=lambda item:(item[1]['name'].casefold(), item[0])), 1):
                cid = uid(code + '/' + group['key'] + '/' + key[0] + '/' + key[1])
                result['subtopics'].append({'id':cid,'topic_id':tid,'syllabus_version_id':vid,'name':term['name'],'description':None,'sort_order':pos*10,'active':False})
                result['lineage'].append({'concept_id':cid,'source_ids':sorted(term['ids'])})
    if seen != set(roots): raise ValueError('Missing source roots')
    raw = json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    result['candidate_sha256'] = hashlib.sha256(raw.encode()).hexdigest()
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = build(json.loads((ROOT / 'docs/content-review/fcb-02-original-study-groups-2026-10-29.json').read_text()))
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')

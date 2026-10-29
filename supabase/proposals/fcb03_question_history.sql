-- UNAPPLIED: proposal only; no production content or history is changed here.
begin;
create function ace.question_history(p_id uuid,p_before integer default null)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor_role text; q ace.questions%rowtype; rows jsonb; result_rows jsonb; more boolean;
begin
 if auth.uid()is null then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if current_setting('transaction_isolation')<>'read committed'then raise exception 'Read committed transaction required'using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=auth.uid()and role in('admin','editor')for share;
 if not found then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if p_id is null or(p_before is not null and p_before<1)then raise exception 'Invalid history cursor'using errcode='22023';end if;
 -- A concurrent save cannot make the current revision disagree with the page.
 select *into q from ace.questions where id=p_id for share;
 if not found then raise exception 'Question not found'using errcode='P0002';end if;
 if p_before is not null and p_before::bigint>q.content_version::bigint+1 then raise exception 'Invalid history cursor'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(x)order by x.version desc),'[]'::jsonb)into rows from(
  select version,snapshot,created_by,created_at from ace.question_versions
  where question_id=p_id and(p_before is null or version<p_before)order by version desc limit 11)x;
 more:=jsonb_array_length(rows)>10;
 select coalesce(jsonb_agg(value order by ord),'[]'::jsonb)into result_rows
 from jsonb_array_elements(rows)with ordinality x(value,ord)where ord<=10;
 return jsonb_build_object('question_id',p_id,'current_version',q.content_version,'versions',result_rows,
  'has_next',more,'next_before',case when more then(result_rows->9->>'version')::integer else null end);
end;$$;

create function ace.restore_question(p_id uuid,p_expected_version integer,p_source_version integer,p_reason text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid();actor_role text;q ace.questions%rowtype;snapshot jsonb;data jsonb;result jsonb;reason text;
begin
 if actor is null then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if current_setting('transaction_isolation')<>'read committed'then raise exception 'Read committed transaction required'using errcode='25001';end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and(rolsuper or rolbypassrls))then raise exception 'Trusted executor owner required'using errcode='42501';end if;
 select role into actor_role from ace.roles where user_id=actor and role in('admin','editor')for share;
 if not found then raise exception 'Question authoring permission required'using errcode='42501';end if;
 if p_id is null or p_expected_version is null or p_expected_version<2 or p_expected_version>=2147483647
 or p_source_version is null or p_source_version<1 or p_source_version>=p_expected_version then raise exception 'Invalid restoration request'using errcode='22023';end if;
 reason:=ace.question_trim(p_reason);
 if reason is null or length(reason)not between 1 and 2000 then raise exception 'Restoration reason required'using errcode='22023';end if;
 -- Same lock order as manage_question, including attachment checks before save.
 perform pg_advisory_xact_lock(hashtextextended('ace.question.workflow',0));
 select *into q from ace.questions where id=p_id for update;
 if not found then raise exception 'Question not found'using errcode='P0002';end if;
 if q.content_version<>p_expected_version then raise exception 'Question revision changed; reload before retrying'using errcode='40001';end if;
 if q.created_by<>actor and actor_role<>'admin'then raise exception 'Only the author or administrator may edit this question'using errcode='42501';end if;
 if q.active then raise exception 'Withdraw published question before editing'using errcode='23514';end if;
 select v.snapshot into snapshot from ace.question_versions v where v.question_id=p_id and v.version=p_source_version;
 if not found then raise exception 'Historical revision not found'using errcode='P0002';end if;
 if snapshot->>'id'is distinct from p_id::text or(snapshot->>'content_version')::integer is distinct from p_source_version then raise exception 'Historical snapshot could not be confirmed'using errcode='23514';end if;
 if snapshot->'media'is distinct from'[]'::jsonb or q.media is distinct from'[]'::jsonb or exists(select 1 from ace.question_media where question_id=p_id)then raise exception 'Historical media requires the reviewed media workflow'using errcode='23514';end if;
 data:=jsonb_build_object('subject_id',snapshot->'subject_id','topic_id',snapshot->'topic_id','subtopic_id',snapshot->'subtopic_id',
  'stem',snapshot->'stem','options',snapshot->'options','correct_option_key',snapshot->'correct_option_key','explanation',snapshot->'explanation',
  'difficulty',snapshot->'difficulty','exam',snapshot->'exam','exam_year',snapshot->'exam_year','provenance',(snapshot->'provenance')-'last_content_editor');
 -- The current workflow validates all content/ancestry/duplicates and deliberately
 -- discards historical rights/review/publication flags while appending a revision.
 result:=ace.manage_question('save',p_id,p_expected_version,data);
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(actor,'question_restored','question',p_id,jsonb_build_object('source_revision',p_source_version,'previous_revision',p_expected_version,'revision',p_expected_version+1,'reason',reason));
 return result;
end;$$;
revoke all on function ace.question_history(uuid,integer),ace.restore_question(uuid,integer,integer,text)from public,anon,authenticated;
grant execute on function ace.question_history(uuid,integer),ace.restore_question(uuid,integer,integer,text)to authenticated;
commit;

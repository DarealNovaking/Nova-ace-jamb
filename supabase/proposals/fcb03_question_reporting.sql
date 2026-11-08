-- SOURCE-ONLY student reporting and administrator moderation workflow.
-- Reports are bound to the exact question revision in the reporter's own paper.
-- No direct client table access; reports never auto-withdraw or alter a question.
begin;

create table ace.question_reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id),
 attempt_id uuid not null references ace.attempts(id),
 question_id uuid not null references ace.questions(id),
 question_version integer not null check(question_version>0),
 request_id uuid not null,
 reason text not null check(reason in('incorrect_answer','ambiguous','formatting','diagram','other')),
 details text not null check(length(details) between 8 and 1000),
 status text not null default 'open' check(status in('open','triaged','resolved','dismissed')),
 handled_by uuid references auth.users(id),
 resolution_note text,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 resolved_at timestamptz,
 constraint question_reports_request_unique unique(reporter_id,request_id),
 constraint question_reports_resolution_state check(
  (status='open' and handled_by is null and resolution_note is null and resolved_at is null)
  or (status='triaged' and handled_by is not null and resolution_note is not null and resolved_at is null)
  or (status in('resolved','dismissed') and handled_by is not null
   and resolution_note is not null and resolved_at is not null)
 )
);
create index question_reports_status_created on ace.question_reports(status,created_at desc);
create index question_reports_question_revision on ace.question_reports(question_id,question_version,created_at desc);
alter table ace.question_reports enable row level security;
revoke all on ace.question_reports from public,anon,authenticated;

create function ace.submit_question_report(
 p_attempt uuid,p_question uuid,p_reason text,p_details text,p_request uuid
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp set lock_timeout='3s' as $$
declare
 actor uuid:=auth.uid();
 actor_role text;
 a ace.attempts%rowtype;
 frozen jsonb;
 version_number integer;
 existing ace.question_reports%rowtype;
 report ace.question_reports%rowtype;
 count_recent integer;
 reason text:=lower(ace.question_trim(p_reason));
 details text:=ace.question_trim(p_details);
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 select role into actor_role from ace.roles where user_id=actor and role='student' for share;
 if not found then raise exception 'Student report permission required' using errcode='42501';end if;
 if p_attempt is null or p_question is null or p_request is null
  or reason is null or reason not in('incorrect_answer','ambiguous','formatting','diagram','other')
  or details is null or length(details) not between 8 and 1000 then
  raise exception 'Invalid question report' using errcode='22023';end if;

 perform pg_advisory_xact_lock(hashtextextended('ace.question.report.'||actor::text,0));
 select * into existing from ace.question_reports
  where reporter_id=actor and request_id=p_request for update;
 if found then
  if existing.attempt_id<>p_attempt or existing.question_id<>p_question
   or existing.reason<>reason or existing.details<>details then
   raise exception 'Report request ID already used' using errcode='23505';end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'created_at',existing.created_at);
 end if;

 select * into a from ace.attempts
  where id=p_attempt and user_id=actor and status in('active','completed') for share;
 if not found then raise exception 'Question report attempt unavailable' using errcode='42501';end if;
 if jsonb_typeof(a.question_order) is distinct from 'array'
  or jsonb_typeof(a.question_snapshot) is distinct from 'array'
  or not exists(select 1 from jsonb_array_elements_text(a.question_order) item
   where item=p_question::text) then
  raise exception 'Question was not in this attempt' using errcode='42501';end if;
 if (select count(*) from jsonb_array_elements(a.question_snapshot) item
  where item->>'id'=p_question::text)<>1 then
  raise exception 'Question report attempt unavailable' using errcode='42501';end if;
 select item into frozen from jsonb_array_elements(a.question_snapshot) item
  where item->>'id'=p_question::text;
 if coalesce(frozen->>'content_version','') !~ '^[1-9][0-9]{0,8}$' then
  raise exception 'Question report revision unavailable' using errcode='42501';end if;
 version_number:=(frozen->>'content_version')::integer;
 if not exists(select 1 from ace.question_versions v
  where v.question_id=p_question and v.version=version_number
   and v.snapshot->>'id'=p_question::text
   and v.snapshot->>'content_version'=version_number::text
   and v.snapshot->>'review_status'='published'
   and v.snapshot->>'active'='true') then
  raise exception 'Question report revision unavailable' using errcode='42501';end if;

 select count(*) into count_recent from ace.question_reports
  where reporter_id=actor and created_at>=clock_timestamp()-interval '24 hours';
 if count_recent>=5 then
  raise exception 'Question report rate limit reached' using errcode='P0001';end if;

 insert into ace.question_reports(
  reporter_id,attempt_id,question_id,question_version,request_id,reason,details
 ) values(actor,p_attempt,p_question,version_number,p_request,reason,details)
 returning * into report;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(actor,'question_report_submitted','question_report',report.id,
  jsonb_build_object('question_id',p_question,'question_version',version_number,'attempt_id',p_attempt,'reason',reason));
 return jsonb_build_object('id',report.id,'status',report.status,'created_at',report.created_at);
end;
$$;

create function ace.list_question_reports(p_status text default 'open',p_limit integer default 50)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid(); actor_role text; result jsonb;
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 select role into actor_role from ace.roles where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator report access required' using errcode='42501';end if;
 if p_status is not null and p_status not in('open','triaged','resolved','dismissed')
  or p_limit is null or p_limit not between 1 and 100 then
  raise exception 'Invalid report filter' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',r.id,'question_id',r.question_id,'question_version',r.question_version,
  'attempt_id',r.attempt_id,'reporter_id',r.reporter_id,'reason',r.reason,
  'details',r.details,'status',r.status,'created_at',r.created_at,
  'handled_by',r.handled_by,'resolution_note',r.resolution_note,'resolved_at',r.resolved_at
 ) order by r.created_at desc,r.id), '[]'::jsonb)
 into result from (
  select * from ace.question_reports
  where p_status is null or status=p_status
  order by created_at desc,id limit p_limit
 ) r;
 return result;
end;
$$;

create function ace.manage_question_report(p_report uuid,p_action text,p_note text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,ace,pg_temp set lock_timeout='3s' as $$
declare actor uuid:=auth.uid(); actor_role text; report ace.question_reports%rowtype; previous_status text;
 action text:=lower(ace.question_trim(p_action)); note text:=ace.question_trim(p_note);
 next_status text;
begin
 if actor is null then raise exception 'Authentication required' using errcode='28000';end if;
 select role into actor_role from ace.roles where user_id=actor and role='admin' for share;
 if not found then raise exception 'Administrator report management required' using errcode='42501';end if;
 if p_report is null or action is null or action not in('triage','resolve','dismiss')
  or note is null or length(note) not between 8 and 1000 then
  raise exception 'Invalid report decision' using errcode='22023';end if;
 select * into report from ace.question_reports where id=p_report for update;
 if not found then raise exception 'Question report unavailable' using errcode='P0002';end if;
 next_status:=case action when 'triage' then 'triaged' when 'resolve' then 'resolved' else 'dismissed' end;
 previous_status:=report.status;
 if report.status=next_status then
  if report.handled_by=actor and report.resolution_note=note then
   return jsonb_build_object('id',report.id,'status',report.status,'question_id',report.question_id);
  end if;
  raise exception 'Question report already handled' using errcode='23514';
 end if;
 if report.status not in('open','triaged') or (action='triage' and report.status<>'open') then
  raise exception 'Invalid question report transition' using errcode='23514';end if;
 update ace.question_reports set status=next_status,handled_by=actor,
  resolution_note=note,updated_at=clock_timestamp(),
  resolved_at=case when next_status in('resolved','dismissed') then clock_timestamp() else null end
 where id=p_report returning * into report;
 insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
 values(actor,'question_report_'||action,'question_report',report.id,
  jsonb_build_object('question_id',report.question_id,'question_version',report.question_version,
   'previous_status',previous_status,
   'status',report.status));
 return jsonb_build_object('id',report.id,'status',report.status,'question_id',report.question_id);
end;
$$;

revoke all on function ace.submit_question_report(uuid,uuid,text,text,uuid) from public,anon,authenticated;
revoke all on function ace.list_question_reports(text,integer) from public,anon,authenticated;
revoke all on function ace.manage_question_report(uuid,text,text) from public,anon,authenticated;
grant execute on function ace.submit_question_report(uuid,uuid,text,text,uuid) to authenticated;
grant execute on function ace.list_question_reports(text,integer) to authenticated;
grant execute on function ace.manage_question_report(uuid,text,text) to authenticated;
commit;

-- Synthetic disposable database only; no production-derived snapshot needed.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table ace.attempts(id uuid primary key,user_id uuid,status text,started_at timestamptz,duration_seconds integer,question_order jsonb);
create table ace.questions(id uuid primary key,stem text,options jsonb,subject_id uuid,topic_id uuid,difficulty text,active boolean,review_status text,rights_status text,correct_option_key text,explanation text);
alter table ace.attempts enable row level security;
alter table ace.questions enable row level security;
grant usage on schema ace,auth to authenticated,anon;
-- Even accidentally permissive RLS must not make direct answer-key reads possible.
create policy synthetic_questions_read on ace.questions for select to authenticated using(true);
insert into ace.questions values
 ('10000000-0000-4000-8000-000000000001','Synthetic Q1','[{"key":"A","text":"First","is_correct":true,"explanation":"secret"},{"key":"B","label":"Second"}]',null,null,'medium',true,'published','owned','A','secret'),
 ('10000000-0000-4000-8000-000000000002','Synthetic Q2','[{"key":"A","text":"Other"}]',null,null,'easy',true,'published','licensed','A','secret');
insert into ace.attempts values
 ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','active',now(),600,'["10000000-0000-4000-8000-000000000002","10000000-0000-4000-8000-000000000001"]');
\i supabase/proposals/fcb_01_attempt_question_delivery.sql
-- RED before implementation: endpoint must exist, have narrow ACLs and no direct grants.
do $$ begin
 if to_regprocedure('ace.get_attempt_questions(uuid)') is null then raise exception 'safe attempt question delivery endpoint missing'; end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
do $$ declare payload jsonb; begin
 payload:=ace.get_attempt_questions('20000000-0000-4000-8000-000000000001');
 if jsonb_array_length(payload)<>2 or payload->0->>'question_text'<>'Synthetic Q2' then raise exception 'attempt order not preserved'; end if;
 if payload->1->'options' <> '[{"key":"A","text":"First"},{"key":"B","text":"Second"}]'::jsonb then raise exception 'option whitelist violated'; end if;
 if payload::text ~ 'secret|is_correct|correct_option_key|explanation' then raise exception 'answer key leaked'; end if;
 if has_table_privilege('authenticated','ace.questions','SELECT') or has_table_privilege('authenticated','ace.attempts','UPDATE') then raise exception 'unsafe table grant'; end if;
 begin perform ace.get_attempt_questions(null); raise exception 'NULL accepted'; exception when sqlstate '22023' then null; end;
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
do $$ begin
 begin perform ace.get_attempt_questions('20000000-0000-4000-8000-000000000001'); raise exception 'other student gained access'; exception when sqlstate 'P0002' then null; end;
 begin perform ace.get_attempt_questions('20000000-0000-4000-8000-000000000099'); raise exception 'missing attempt accepted'; exception when sqlstate 'P0002' then null; end;
end $$;
select set_config('request.jwt.claim.sub','',false);
do $$ begin
 begin perform ace.get_attempt_questions('20000000-0000-4000-8000-000000000001'); raise exception 'missing identity accepted'; exception when sqlstate '28000' then null; end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','ace.get_attempt_questions(uuid)','EXECUTE') then raise exception 'anon execute'; end if;
end $$;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
-- Test each withdrawal gate against the same owner: no partial delivery allowed.
do $$ declare gate text; begin
 foreach gate in array array['draft','inactive','rights','missing','expired','completed','duplicates'] loop
  begin
   case gate
    when 'draft' then update ace.questions set review_status='draft' where stem='Synthetic Q1';
    when 'inactive' then update ace.questions set active=false where stem='Synthetic Q1';
    when 'rights' then update ace.questions set rights_status='unknown' where stem='Synthetic Q1';
    when 'missing' then delete from ace.questions where stem='Synthetic Q1';
    when 'expired' then update ace.attempts set started_at=now()-interval '1 hour';
    when 'completed' then update ace.attempts set status='completed';
    when 'duplicates' then update ace.attempts set question_order='["10000000-0000-4000-8000-000000000001","10000000-0000-4000-8000-000000000001"]';
   end case;
   set local role authenticated;
   begin
    perform ace.get_attempt_questions('20000000-0000-4000-8000-000000000001');
    raise exception 'gate % failed',gate;
   exception when sqlstate 'P0002' then null;
   end;
   reset role;
   -- Roll back just this gate's fixture mutation to test the next independently.
   raise exception using errcode='Z0001',message='restore synthetic fixture';
  exception when sqlstate 'Z0001' then null;
  end;
 end loop;
end $$;
select 'FCB-01 safe attempt question delivery tests passed' result;

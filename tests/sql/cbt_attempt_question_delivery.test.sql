-- Disposable PostgreSQL regression test for attempt-scoped question delivery.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;

do $roles$
begin
  create role anon;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role authenticated;
exception when duplicate_object then null;
end
$roles$;

create function auth.uid() returns uuid
language sql stable
as $fn$ select nullif(current_setting('test.user_id', true), '')::uuid $fn$;

create table ace.attempts (
  id uuid primary key,
  user_id uuid not null,
  status text not null,
  question_order jsonb not null
);
create table ace.questions (
  id uuid primary key,
  stem text not null,
  options jsonb not null,
  subject_id uuid,
  topic_id uuid,
  difficulty text,
  correct_option_key text not null,
  explanation text,
  rights_status text not null,
  active boolean not null,
  review_status text not null
);

insert into ace.attempts(id,user_id,status,question_order) values
 ('10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active',
  '["20000000-0000-4000-8000-000000000002","20000000-0000-4000-8000-000000000001","20000000-0000-4000-8000-000000000004"]'),
 ('10000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','active',
  '["20000000-0000-4000-8000-000000000001"]');
insert into ace.questions(id,stem,options,correct_option_key,explanation,rights_status,active,review_status) values
 ('20000000-0000-4000-8000-000000000001','Question one',
  '[{"key":"A","text":"Alpha","internal_note":"must not leak"},{"key":"B","label":"Beta"}]','B','Secret explanation one','owned',true,'published'),
 ('20000000-0000-4000-8000-000000000002','Question two',
  '[{"key":"C","text":"Gamma"},{"key":"D","text":"Delta"}]','D','Secret explanation two','licensed',true,'published'),
 ('20000000-0000-4000-8000-000000000003','Draft question',
  '[{"key":"X","text":"Hidden"}]','X','Draft explanation','owned',true,'draft'),
 ('20000000-0000-4000-8000-000000000004','Restricted question',
  '[{"key":"Y","text":"Not licensed"}]','Y','Restricted explanation','restricted',true,'published');

\i supabase/migrations/20261027180000_cbt_attempt_question_delivery.sql

do $privileges$
declare
  v_proc oid := to_regprocedure('ace.get_attempt_questions(uuid)');
begin
  if not has_function_privilege('authenticated', v_proc, 'EXECUTE') then
    raise exception 'authenticated must be able to execute question delivery';
  end if;
  if has_function_privilege('anon', v_proc, 'EXECUTE') then
    raise exception 'anon must not be able to execute question delivery';
  end if;
  if exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = v_proc
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC must not have EXECUTE on question delivery';
  end if;
end
$privileges$;

grant usage on schema ace, auth to authenticated;
grant usage on schema ace to anon;
grant execute on function auth.uid() to authenticated;
set role authenticated;
select set_config('test.user_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
do $assert$
declare
  v jsonb;
begin
  v := ace.get_attempt_questions('10000000-0000-4000-8000-000000000001');
  if jsonb_array_length(v) <> 2 then raise exception 'Expected two questions'; end if;
  if v->0->>'id' <> '20000000-0000-4000-8000-000000000002' then raise exception 'Attempt question order was not preserved'; end if;
  if v->1->>'question_text' <> 'Question one' then raise exception 'Live stem column was not mapped to question_text contract'; end if;
  if v::text like '%correct_option_key%' or v::text like '%Secret explanation%' or v::text like '%internal_note%' then
    raise exception 'Question response exposed a private answer/explanation/option field';
  end if;
  if v->1->'options'->1->>'text' <> 'Beta' then raise exception 'Option label fallback failed'; end if;
end
$assert$;
do $owner$
begin
  begin
    perform ace.get_attempt_questions('10000000-0000-4000-8000-000000000002');
    raise exception 'Cross-user attempt access unexpectedly succeeded';
  exception when sqlstate 'P0002' then
    null;
  end;
end
$owner$;
reset role;

set role anon;
do $anon$
begin
  begin
    perform ace.get_attempt_questions('10000000-0000-4000-8000-000000000001');
    raise exception 'anon unexpectedly executed protected RPC';
  exception when insufficient_privilege then
    null;
  end;
end
$anon$;
reset role;

select 'CBT attempt question delivery tests passed' as result;

-- Disposable PostgreSQL integration test for the UTME subject-choice migration.
-- This script destroys/recreates only the isolated CI test schemas.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;

do $roles$
begin
  create role authenticated;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role anon;
exception when duplicate_object then null;
end
$roles$;

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table ace.institutions (
  id uuid primary key,
  name text not null,
  status text not null
);
create table ace.programs (
  id uuid primary key,
  institution_id uuid not null references ace.institutions(id),
  name text not null,
  status text not null
);
create table ace.exam_seasons (
  id uuid primary key,
  status text not null,
  exam_year integer not null
);
create table ace.subjects (
  id uuid primary key,
  code text not null unique,
  active boolean not null,
  sort_order integer not null
);
create table ace.program_utme_rules (
  id uuid primary key,
  season_id uuid not null references ace.exam_seasons(id),
  program_id uuid not null references ace.programs(id),
  required_subject_ids uuid[] not null,
  alternative_groups jsonb not null default '[]'::jsonb,
  minimum_optional_subjects smallint not null default 0,
  status text not null,
  version integer not null
);
create table ace.exam_configs (
  id uuid primary key,
  season_id uuid not null references ace.exam_seasons(id),
  active boolean not null
);
create table ace.profiles (
  id uuid primary key,
  display_name text,
  target_score smallint,
  institution text,
  course text,
  institution_id uuid,
  program_id uuid
);
create table ace.student_preferences (
  user_id uuid primary key,
  daily_minutes integer not null,
  updated_at timestamptz not null default now()
);
create table ace.student_subjects (
  user_id uuid not null,
  subject_id uuid not null references ace.subjects(id),
  is_primary boolean not null,
  sort_order integer not null,
  primary key (user_id, subject_id)
);

insert into ace.institutions values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Federal University of Technology, Akure', 'active');
insert into ace.programs values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Microbiology', 'active');
insert into ace.exam_seasons values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'active', 2027);
insert into ace.subjects values
  ('00000000-0000-4000-8000-000000000001', 'BIO', true, 4),
  ('00000000-0000-4000-8000-000000000002', 'CHE', true, 5),
  ('00000000-0000-4000-8000-000000000003', 'ENG', true, 23),
  ('00000000-0000-4000-8000-000000000004', 'MAT', true, 19),
  ('00000000-0000-4000-8000-000000000005', 'PHY', true, 21),
  ('00000000-0000-4000-8000-000000000006', 'GEO', true, 11),
  ('00000000-0000-4000-8000-000000000007', 'AGR', false, 1);
insert into ace.program_utme_rules values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  array[
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000002'::uuid,
    '00000000-0000-4000-8000-000000000003'::uuid
  ],
  '[{"subject_codes":["MAT","PHY"],"minimum_required":1}]'::jsonb,
  1,
  'active',
  1
);
insert into ace.exam_configs values
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
insert into ace.profiles (id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

-- Apply the actual repository migration.
\i supabase/migrations/20261018150000_batch_2_utme_subject_choice.sql

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false);

-- Valid Microbiology selection: all required subjects plus Mathematics.
select ace.save_student_foundation_catalog_with_subjects(
  'Test Student', 300::smallint,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  60,
  array[
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000002'::uuid,
    '00000000-0000-4000-8000-000000000003'::uuid,
    '00000000-0000-4000-8000-000000000004'::uuid
  ]
);

do $assert$
declare
  v_count integer;
  v_primary_code text;
begin
  select count(*) into v_count from ace.student_subjects where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_count <> 4 then raise exception 'valid selection should save exactly four subjects; got %', v_count; end if;
  select s.code into v_primary_code
  from ace.student_subjects ss join ace.subjects s on s.id=ss.subject_id
  where ss.user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and ss.is_primary;
  if v_primary_code <> 'ENG' then raise exception 'English Language must be primary; got %', v_primary_code; end if;
end
$assert$;

-- Missing a required subject must fail.
do $assert$
declare v_message text;
begin
  begin
    perform ace.save_student_foundation_catalog_with_subjects(
      'Test Student', 300::smallint,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      60,
      array[
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        '00000000-0000-4000-8000-000000000004'::uuid,
        '00000000-0000-4000-8000-000000000005'::uuid
      ]
    );
    raise exception 'expected_missing_required_rejection';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = 'expected_missing_required_rejection' or v_message not like '%missing one or more required%' then raise; end if;
  end;
end
$assert$;

-- A subject outside the official alternative group must fail.
do $assert$
declare v_message text;
begin
  begin
    perform ace.save_student_foundation_catalog_with_subjects(
      'Test Student', 300::smallint,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      60,
      array[
        '00000000-0000-4000-8000-000000000001'::uuid,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        '00000000-0000-4000-8000-000000000006'::uuid
      ]
    );
    raise exception 'expected_invalid_option_rejection';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = 'expected_invalid_option_rejection' or v_message not like '%alternative-subject group%' then raise; end if;
  end;
end
$assert$;

-- Duplicate subject IDs must fail.
do $assert$
declare v_message text;
begin
  begin
    perform ace.save_student_foundation_catalog_with_subjects(
      'Test Student', 300::smallint,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      60,
      array[
        '00000000-0000-4000-8000-000000000001'::uuid,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid
      ]
    );
    raise exception 'expected_duplicate_rejection';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = 'expected_duplicate_rejection' or v_message not like '%four distinct UTME subjects%' then raise; end if;
  end;
end
$assert$;

-- Inactive subjects must fail even if they share a known subject code.
do $assert$
declare v_message text;
begin
  begin
    perform ace.save_student_foundation_catalog_with_subjects(
      'Test Student', 300::smallint,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      60,
      array[
        '00000000-0000-4000-8000-000000000001'::uuid,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        '00000000-0000-4000-8000-000000000007'::uuid
      ]
    );
    raise exception 'expected_inactive_subject_rejection';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = 'expected_inactive_subject_rejection' or v_message not like '%selected UTME subjects are invalid%' then raise; end if;
  end;
end
$assert$;

select 'UTME subject-choice migration tests passed' as result;

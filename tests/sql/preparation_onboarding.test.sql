-- Integration coverage for catalogue-independent preparation onboarding.
-- Run after the existing isolated UTME subject-choice test setup.
\i supabase/migrations/20261019120000_preparation_onboarding_without_catalogue.sql

select ace.save_student_preparation_foundation(
  'Prep Student', 280::smallint, '', '', 45,
  array[
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000002'::uuid,
    '00000000-0000-4000-8000-000000000003'::uuid,
    '00000000-0000-4000-8000-000000000004'::uuid
  ]
);

do $assert$
declare
  v_profile ace.profiles%rowtype;
  v_count integer;
  v_minutes integer;
begin
  select * into v_profile from ace.profiles where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_profile.display_name <> 'Prep Student' or v_profile.institution is not null or v_profile.course is not null then
    raise exception 'preparation-only onboarding must save profile and leave unresolved goals null';
  end if;
  if v_profile.institution_id is not null or v_profile.program_id is not null then
    raise exception 'unverified goals must not retain structured catalogue IDs';
  end if;
  select count(*) into v_count from ace.student_subjects where user_id=v_profile.id;
  if v_count <> 4 then raise exception 'preparation onboarding must save exactly four subjects'; end if;
  select daily_minutes into v_minutes from ace.student_preferences where user_id=v_profile.id;
  if v_minutes <> 45 then raise exception 'daily study preference was not saved'; end if;
end
$assert$;

-- Unauthenticated calls must be rejected.
select set_config('request.jwt.claim.sub', '', false);
do $assert$
declare v_message text;
begin
  begin
    perform ace.save_student_preparation_foundation(
      'No User', 200::smallint, '', '', 30,
      array[
        '00000000-0000-4000-8000-000000000001'::uuid,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        '00000000-0000-4000-8000-000000000004'::uuid
      ]
    );
    raise exception 'expected_auth_rejection';
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message = 'expected_auth_rejection' or v_message not like '%Authentication required%' then raise; end if;
  end;
end
$assert$;

select 'preparation onboarding tests passed' as result;

create table if not exists ace.exam_config_subjects (
  exam_config_id uuid not null references ace.exam_configs(id) on delete cascade,
  subject_id uuid not null references ace.subjects(id) on delete restrict,
  required boolean not null default false,
  question_count smallint not null check (question_count > 0),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  primary key (exam_config_id, subject_id)
);

create table if not exists ace.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references ace.exam_seasons(id) on delete restrict,
  subject_id uuid not null references ace.subjects(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  title text not null,
  source_url text,
  source_title text,
  rights_status text not null default 'pending' check (rights_status in ('pending','approved','restricted','rejected')),
  provenance jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, subject_id, version)
);

alter table ace.topics add column if not exists syllabus_version_id uuid references ace.syllabus_versions(id) on delete restrict;
alter table ace.subtopics add column if not exists syllabus_version_id uuid references ace.syllabus_versions(id) on delete restrict;

create table if not exists ace.institutions (
  id uuid primary key default gen_random_uuid(),
  jamb_code text unique,
  name text not null,
  institution_type text not null check (institution_type in ('university','polytechnic','college_of_education','other')),
  ownership text check (ownership in ('federal','state','private','other')),
  state text,
  status text not null default 'active' check (status in ('draft','active','suspended','archived')),
  source_url text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ace.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references ace.institutions(id) on delete restrict,
  jamb_code text,
  name text not null,
  award_level text not null default 'degree',
  duration_years smallint,
  status text not null default 'active' check (status in ('draft','active','suspended','archived')),
  source_url text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists ace.program_utme_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references ace.exam_seasons(id) on delete restrict,
  program_id uuid not null references ace.programs(id) on delete cascade,
  required_subject_ids uuid[] not null default '{}'::uuid[],
  alternative_groups jsonb not null default '[]'::jsonb,
  minimum_optional_subjects smallint not null default 0 check (minimum_optional_subjects >= 0),
  notes text,
  source_url text,
  provenance jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, program_id, version)
);

create index if not exists idx_exam_config_subjects_subject on ace.exam_config_subjects(subject_id);
create index if not exists idx_syllabus_versions_season_subject on ace.syllabus_versions(season_id, subject_id);
create index if not exists idx_syllabus_versions_active on ace.syllabus_versions(season_id, status);
create index if not exists idx_topics_syllabus_version on ace.topics(syllabus_version_id, sort_order);
create index if not exists idx_subtopics_syllabus_version on ace.subtopics(syllabus_version_id, sort_order);
create index if not exists idx_institutions_active_name on ace.institutions(status, name);
create index if not exists idx_programs_institution_active_name on ace.programs(institution_id, status, name);
create index if not exists idx_program_rules_season_program on ace.program_utme_rules(season_id, program_id, status);

alter table ace.exam_config_subjects enable row level security;
alter table ace.syllabus_versions enable row level security;
alter table ace.institutions enable row level security;
alter table ace.programs enable row level security;
alter table ace.program_utme_rules enable row level security;

create policy exam_config_subjects_read_authenticated on ace.exam_config_subjects for select to authenticated using (
  exists (select 1 from ace.exam_configs c join ace.exam_seasons s on s.id = c.season_id where c.id = exam_config_id and s.status in ('active','closed'))
  or ace.is_admin_or_editor()
);
create policy exam_config_subjects_manage_editor on ace.exam_config_subjects for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

create policy syllabus_versions_read_authenticated on ace.syllabus_versions for select to authenticated using (status = 'active' or ace.is_admin_or_editor());
create policy syllabus_versions_manage_editor on ace.syllabus_versions for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

create policy institutions_read_authenticated on ace.institutions for select to authenticated using (status = 'active' or ace.is_admin_or_editor());
create policy institutions_manage_editor on ace.institutions for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

create policy programs_read_authenticated on ace.programs for select to authenticated using (status = 'active' or ace.is_admin_or_editor());
create policy programs_manage_editor on ace.programs for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

create policy program_utme_rules_read_authenticated on ace.program_utme_rules for select to authenticated using (status = 'active' or ace.is_admin_or_editor());
create policy program_utme_rules_manage_editor on ace.program_utme_rules for all to authenticated using (ace.is_admin_or_editor()) with check (ace.is_admin_or_editor());

create policy exam_seasons_read_authenticated_v2 on ace.exam_seasons for select to authenticated using (status in ('draft','active','closed') or ace.is_admin_or_editor());
create policy exam_configs_read_authenticated_v2 on ace.exam_configs for select to authenticated using (active or ace.is_admin_or_editor());

revoke all on ace.exam_config_subjects, ace.syllabus_versions, ace.institutions, ace.programs, ace.program_utme_rules from anon, public;
grant select, insert, update, delete on ace.exam_config_subjects, ace.syllabus_versions, ace.institutions, ace.programs, ace.program_utme_rules to authenticated;

do $$
declare
  season_2026 uuid;
  config_2026 uuid;
  subject_rows record;
begin
  insert into ace.exam_seasons (code,name,exam_year,status,metadata)
  values ('jamb-2026','JAMB UTME 2026',2026,'closed',jsonb_build_object('official_source','https://www.jamb.gov.ng/PDFs/2026/2026%20TRAINING%20MANUAL%20%20final.pdf','verified_on','2026-09-14','note','Historical official configuration retained for reproducibility.'))
  on conflict (code) do update set name=excluded.name, exam_year=excluded.exam_year, status=excluded.status, metadata=excluded.metadata, updated_at=now()
  returning id into season_2026;

  insert into ace.exam_configs (season_id,name,duration_seconds,total_questions,option_count,composition,rules,version,active)
  values (season_2026,'2026 UTME official structure',7200,180,4,
    '{"required_subjects":[{"subject_code":"ENG","question_count":60}],"optional_subjects":{"count":3,"question_count_each":40,"selection":"candidate_choice"}}'::jsonb,
    '{"all_questions_required":true,"option_labels":["A","B","C","D"],"duration_source":"2026 JAMB Training Manual"}'::jsonb,
    1,false)
  on conflict do nothing
  returning id into config_2026;

  if config_2026 is null then
    select id into config_2026 from ace.exam_configs where season_id=season_2026 and version=1 order by created_at desc limit 1;
  end if;

  for subject_rows in select id, code from ace.subjects loop
    insert into ace.exam_config_subjects(exam_config_id,subject_id,required,question_count,sort_order,metadata)
    values (config_2026,subject_rows.id,subject_rows.code='ENG',case when subject_rows.code='ENG' then 60 else 40 end,case when subject_rows.code='ENG' then 1 else 100 end,jsonb_build_object('official_2026',true,'selection',case when subject_rows.code='ENG' then 'required' else 'candidate_choice' end))
    on conflict (exam_config_id,subject_id) do update set required=excluded.required, question_count=excluded.question_count, metadata=excluded.metadata;
  end loop;

  insert into ace.exam_seasons(code,name,exam_year,status,metadata)
  values ('jamb-2027','JAMB UTME 2027',2027,'draft',jsonb_build_object('note','Future season scaffold. Do not invent dates, composition or programme requirements until JAMB publishes/updates authoritative information.','official_source','https://jamb.gov.ng/'))
  on conflict (code) do nothing;

  insert into ace.subjects(code,name,description,sort_order,active) values
    ('AGR','Agriculture','JAMB-approved UTME subject.',1,true),('ARA','Arabic','JAMB-approved UTME subject.',2,true),('ART','Art','JAMB-approved UTME subject.',3,true),('BIO','Biology','JAMB-approved UTME subject.',4,true),('CHE','Chemistry','JAMB-approved UTME subject.',5,true),('CRS','Christian Religious Studies','JAMB-approved UTME subject.',6,true),('COM','Commerce','JAMB-approved UTME subject.',7,true),('CST','Computer Studies','JAMB-approved UTME subject.',8,true),('ECO','Economics','JAMB-approved UTME subject.',9,true),('FRE','French','JAMB-approved UTME subject.',10,true),('GEO','Geography','JAMB-approved UTME subject.',11,true),('GOV','Government','JAMB-approved UTME subject.',12,true),('HAU','Hausa','JAMB-approved UTME subject.',13,true),('HIS','History','JAMB-approved UTME subject.',14,true),('HEC','Home Economics','JAMB-approved UTME subject.',15,true),('IGB','Igbo','JAMB-approved UTME subject.',16,true),('ISS','Islamic Studies','JAMB-approved UTME subject.',17,true),('LIT','Literature-in-English','JAMB-approved UTME subject.',18,true),('MAT','Mathematics','JAMB-approved UTME subject.',19,true),('MUS','Music','JAMB-approved UTME subject.',20,true),('PHY','Physics','JAMB-approved UTME subject.',21,true),('POA','Principles of Account','JAMB-approved UTME subject.',22,true),('ENG','Use of English','Compulsory UTME subject in the official 2026 structure.',23,true),('YOR','Yoruba','JAMB-approved UTME subject.',24,true),('PHE','Physical and Health Education','JAMB-approved UTME subject.',25,true)
  on conflict (code) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order, active=true;
end $$;

create or replace function ace.activate_exam_season(p_season_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, ace
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not ace.is_admin_or_editor() then raise exception 'Admin/editor access required'; end if;
  if not exists (select 1 from ace.exam_seasons where id=p_season_id) then raise exception 'Season not found'; end if;
  if not exists (select 1 from ace.exam_configs where season_id=p_season_id and active=true) then raise exception 'Season must have an active exam configuration'; end if;
  if not exists (select 1 from ace.syllabus_versions where season_id=p_season_id and status='active') then raise exception 'Season must have at least one active syllabus version'; end if;
  update ace.exam_seasons set status='archived', updated_at=now() where status='active' and id<>p_season_id;
  update ace.exam_seasons set status='active', updated_at=now() where id=p_season_id;
end;
$$;
revoke all on function ace.activate_exam_season(uuid) from public, anon;
grant execute on function ace.activate_exam_season(uuid) to authenticated;

create or replace function ace.get_active_exam_blueprint()
returns jsonb language sql stable security invoker set search_path = pg_catalog, ace
as $$
select coalesce((select jsonb_build_object('season',to_jsonb(s),'config',to_jsonb(c),'subjects',coalesce((select jsonb_agg(to_jsonb(cs) order by cs.sort_order,cs.subject_id) from ace.exam_config_subjects cs where cs.exam_config_id=c.id),'[]'::jsonb)) from ace.exam_seasons s join ace.exam_configs c on c.season_id=s.id and c.active=true where s.status='active' order by s.exam_year desc,c.version desc limit 1),'{}'::jsonb);
$$;
revoke all on function ace.get_active_exam_blueprint() from anon, public;
grant execute on function ace.get_active_exam_blueprint() to authenticated;

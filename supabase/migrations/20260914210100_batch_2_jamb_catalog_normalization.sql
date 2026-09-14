delete from ace.exam_config_subjects cs using ace.subjects s where cs.subject_id=s.id and s.code in ('MTH','CHM');
update ace.subjects set code='MAT', name='Mathematics', sort_order=19, description='JAMB-approved UTME subject.' where code='MTH' and not exists (select 1 from ace.subjects where code='MAT');
update ace.subjects set code='CHE', name='Chemistry', sort_order=5, description='JAMB-approved UTME subject.' where code='CHM' and not exists (select 1 from ace.subjects where code='CHE');
delete from ace.subjects s where s.code in ('MTH','CHM');

insert into ace.exam_config_subjects(exam_config_id,subject_id,required,question_count,sort_order,metadata)
select c.id, s.id, s.code='ENG', case when s.code='ENG' then 60 else 40 end,
       case when s.code='ENG' then 1 else 100 + s.sort_order end,
       jsonb_build_object('official_2026',true,'selection',case when s.code='ENG' then 'required' else 'candidate_choice' end)
from ace.exam_configs c
join ace.exam_seasons es on es.id=c.season_id and es.code='jamb-2026'
join ace.subjects s on s.active=true
where c.version=1
on conflict (exam_config_id,subject_id) do update set required=excluded.required, question_count=excluded.question_count, sort_order=excluded.sort_order, metadata=excluded.metadata;

create unique index if not exists ux_exam_seasons_single_active on ace.exam_seasons(status) where status='active';
create unique index if not exists ux_exam_configs_single_active_per_season on ace.exam_configs(season_id) where active=true;
create unique index if not exists ux_active_syllabus_per_season_subject on ace.syllabus_versions(season_id,subject_id) where status='active';

insert into ace.syllabus_versions(season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status)
select es.id,s.id,1,'2026 JAMB UTME syllabus — '||s.name,'https://ibass.jamb.gov.ng/','JAMB Integrated Brochure & Syllabus System (IBASS)','pending',jsonb_build_object('authority','JAMB','season','2026','verified_on','2026-09-14','source_note','IBASS is the authoritative syllabus/programme source; exact topic extraction requires source review.'),'draft'
from ace.exam_seasons es cross join ace.subjects s where es.code='jamb-2026'
on conflict (season_id,subject_id,version) do update set source_url=excluded.source_url,source_title=excluded.source_title,provenance=excluded.provenance;

insert into ace.syllabus_versions(season_id,subject_id,version,title,source_url,source_title,rights_status,provenance,status)
select es.id,s.id,1,'2027 JAMB UTME syllabus scaffold — '||s.name,'https://jamb.gov.ng/','JAMB official website — pending 2027 publication/update','pending',jsonb_build_object('authority','JAMB','season','2027','status','pending_official_publication'),'draft'
from ace.exam_seasons es cross join ace.subjects s where es.code='jamb-2027'
on conflict (season_id,subject_id,version) do nothing;

-- Synthetic approved mock content; disposable database only; transaction left open.
\i tests/sql/fixtures/fcb_01_exam_config.sql
-- A real publication still needs documented source/rights and owner approval.
insert into ace.syllabus_versions(season_id,subject_id,title,status,rights_status)
select '83000000-0000-4000-8000-000000000001',id,'Synthetic mock syllabus','active','approved' from ace.subjects;
insert into ace.topics(subject_id,syllabus_version_id,name)
select subject_id,id,'Synthetic mock topic' from ace.syllabus_versions;
insert into ace.subtopics(topic_id,syllabus_version_id,name)
select id,syllabus_version_id,'Synthetic mock subtopic' from ace.topics;
insert into ace.questions(subject_id,topic_id,subtopic_id,stem,options,correct_option_key,active,review_status,rights_status)
select t.subject_id,t.id,st.id,'Synthetic mock question',
 '[{"key":"A","text":"A"},{"key":"B","text":"B"},{"key":"C","text":"C"},{"key":"D","text":"D"}]'::jsonb,
 'A',true,'published','owned' from ace.topics t join ace.subtopics st on st.topic_id=t.id;
select ace.activate_exam_config('85000000-0000-4000-8000-000000000001');
select ace.activate_exam_season('83000000-0000-4000-8000-000000000001');

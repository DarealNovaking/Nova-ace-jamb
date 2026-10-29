-- Emergency metadata-only disable after installation. Requires specific production approval.
-- Preserve the existing get_attempt_questions endpoint and all production data.
BEGIN;
REVOKE ALL ON FUNCTION ace.published_topic_questions(uuid,uuid,uuid,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ace.student_question_topics(uuid[]) FROM PUBLIC, anon, authenticated;
COMMIT;

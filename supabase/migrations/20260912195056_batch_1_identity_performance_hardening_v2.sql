-- Batch 1 performance hardening: evaluate auth context once per statement and remove
-- the redundant learning_progress uniqueness constraint. Keep the primary key as the
-- canonical uniqueness/index structure.

DROP POLICY IF EXISTS devices_self ON ace.devices;
CREATE POLICY devices_self ON ace.devices
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS student_preferences_self ON ace.student_preferences;
CREATE POLICY student_preferences_self ON ace.student_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS student_subjects_self ON ace.student_subjects;
CREATE POLICY student_subjects_self ON ace.student_subjects
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER TABLE ace.learning_progress
  DROP CONSTRAINT IF EXISTS learning_progress_user_id_subject_id_topic_id_subtopic_id_key;

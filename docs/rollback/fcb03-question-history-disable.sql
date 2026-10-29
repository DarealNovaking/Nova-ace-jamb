-- UNAPPLIED: metadata-only emergency disable AFTER the two RPCs are installed.
-- Requires incident authorization. Preserves question/history/audit data.
begin;
revoke execute on function ace.question_history(uuid,integer),ace.restore_question(uuid,integer,integer,text)
from public,anon,authenticated;
commit;

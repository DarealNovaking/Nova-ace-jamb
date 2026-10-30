\set ON_ERROR_STOP on
-- Runs only after the isolated FCB-03 media-intents fixture installed the functions.
-- Never uses production credentials or enables any media upload service.
\ir ../../supabase/proposals/fcb03_media_preflight.sql
create role ace_media_executor nologin;
\ir ../../supabase/proposals/fcb03_media_executor_grants.sql
do $checks$
begin
 if not has_function_privilege('ace_media_executor',
  'ace.can_stage_question_media(uuid,integer)','execute')
 or not has_schema_privilege('ace_media_executor','ace','usage')
 or not has_function_privilege('ace_media_executor',
  'ace.reserve_question_media_intent(uuid,integer,uuid,text,text,text,integer,text)','execute')
 or not has_function_privilege('ace_media_executor',
  'ace.confirm_question_media_intent(uuid,text,integer,text)','execute')
 or not has_function_privilege('ace_media_executor',
  'ace.authorize_attempt_question_media(uuid,uuid,uuid)','execute') then
  raise exception 'Dedicated media executor is missing required narrow function grants';
 end if;
 if has_function_privilege('anon','ace.can_stage_question_media(uuid,integer)','execute')
 or has_function_privilege('authenticated','ace.can_stage_question_media(uuid,integer)','execute')
 or has_table_privilege('ace_media_executor','ace.questions','select')
 or has_table_privilege('ace_media_executor','ace.question_media_intents','select')
 or has_table_privilege('ace_media_executor','ace.question_media_intents','insert')
 or has_table_privilege('ace_media_executor','ace.question_media','insert')
 or has_function_privilege('anon','ace.confirm_question_media_intent(uuid,text,integer,text)','execute')
 or has_function_privilege('authenticated','ace.reserve_question_media_intent(uuid,integer,uuid,text,text,text,integer,text)','execute')
 or has_function_privilege('anon','ace.authorize_attempt_question_media(uuid,uuid,uuid)','execute')
 or has_function_privilege('authenticated','ace.authorize_attempt_question_media(uuid,uuid,uuid)','execute')
 or has_table_privilege('anon','ace.question_media_reviews','select')
 or has_table_privilege('anon','ace.question_media_reviews','insert')
 or has_table_privilege('anon','ace.question_media_reviews','update')
 or has_table_privilege('anon','ace.question_media_reviews','delete')
 or has_table_privilege('authenticated','ace.question_media_reviews','select')
 or has_table_privilege('authenticated','ace.question_media_reviews','insert')
 or has_table_privilege('authenticated','ace.question_media_reviews','update')
 or has_table_privilege('authenticated','ace.question_media_reviews','delete')
 or has_table_privilege('ace_media_executor','ace.question_media_reviews','select')
 or has_table_privilege('ace_media_executor','ace.question_media_reviews','insert')
 or has_table_privilege('ace_media_executor','ace.question_media_reviews','update')
 or has_table_privilege('ace_media_executor','ace.question_media_reviews','delete')
 or has_function_privilege('anon','ace.review_question_media_intent(uuid,integer,uuid,text,text,text)','execute')
 or has_function_privilege('ace_media_executor','ace.review_question_media_intent(uuid,integer,uuid,text,text,text)','execute')
 or not has_function_privilege('authenticated','ace.review_question_media_intent(uuid,integer,uuid,text,text,text)','execute') then
  raise exception 'Private media executor or public function privileges leaked';
 end if;
 raise notice 'FCB03 executor PASS: narrow private function grants, no direct table CRUD';
end
$checks$;
-- Disposable PostgreSQL fixture only.

-- Execute as the least-privileged caller, not only inspect ACL metadata.
-- The private SECURITY DEFINER boundary must be callable by this role but
-- must still demand a verified editor identity before any question mutation.
set role ace_media_executor;
select ace.can_stage_question_media(null,null) as should_be_false;
do $executor_refusal$
declare refused boolean := false;
begin
 begin
  perform ace.reserve_question_media_intent(
    null,null,null,null,null,null,null,null
  );
 exception when others then
  if position('Editorial authentication required' in sqlerrm) = 0 then
   raise exception 'Executor failed before the authentication guard: %',sqlerrm;
  end if;
  refused := true;
 end;
 if not refused then raise exception 'Private executor accepted an anonymous request';end if;
end
$executor_refusal$;
reset role;

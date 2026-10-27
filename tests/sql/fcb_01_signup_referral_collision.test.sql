-- Disposable recovered schema only. Both IDs deliberately share first eight hex characters.
\i supabase/migrations/20261027220044_fcb_01_signup_referral_collision.sql
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('91000000-0000-4000-8000-000000000001','collision-one@example.invalid','{"role":"admin"}'),
 ('91000000-0000-4000-8000-000000000002','collision-two@example.invalid','{"role":"admin"}');
do $$ begin
 if (select count(distinct code) from ace.referral_codes where user_id in ('91000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002'))<>2 then
  raise exception 'signup referral collision not resolved';
 end if;
 if exists(select 1 from ace.referral_codes where user_id='91000000-0000-4000-8000-000000000002' and code like '%'||upper(replace(user_id::text,'-',''))||'%') then
  raise exception 'referral fallback exposed full auth identifier';
 end if;
 if (select count(*) from ace.roles where user_id in ('91000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002') and role='student')<>2 then
  raise exception 'signup metadata conferred privileges';
 end if;
end $$;
rollback;
select 'FCB-01 signup referral collision tests passed' result;

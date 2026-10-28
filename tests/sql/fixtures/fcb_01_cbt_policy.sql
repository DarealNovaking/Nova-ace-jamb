-- Synthetic test configuration only. These are NOT business limits or defaults.
insert into ace.cbt_runtime_policy(singleton,enabled,window_seconds,max_starts,max_active,cooldown_seconds)
values(true,true,3600,100000,1000,0)
on conflict(singleton) do update set enabled=true,window_seconds=3600,max_starts=100000,max_active=1000,cooldown_seconds=0;
insert into ace.cbt_mode_access(mode,enabled,entitlement_product_code,max_questions,max_duration_seconds)
select mode,true,null,500,86400 from unnest(array['practice','cbt','mock','learning','revision','ai_practice']) mode
on conflict(mode) do update set enabled=true,entitlement_product_code=null,max_questions=500,max_duration_seconds=86400;

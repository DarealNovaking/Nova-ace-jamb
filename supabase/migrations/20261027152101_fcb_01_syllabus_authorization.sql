-- Preserve editor draft authoring while making approval and publication an
-- administrator boundary, including writes issued by SECURITY DEFINER RPCs.
-- No existing content, rights decisions or publication states are changed.
begin;

create or replace function ace.guard_syllabus_authoring()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,ace
as $$
declare
  v_user uuid := auth.uid();
  v_admin boolean := v_user is not null and ace.is_admin();
  v_version_id uuid;
  v_old_version_id uuid;
  v_version ace.syllabus_versions%rowtype;
  v_topic ace.topics%rowtype;
begin
  if v_user is null or not ace.is_admin_or_editor() then
    raise exception 'Academic authoring permission required' using errcode='42501';
  end if;

  if tg_table_name='syllabus_versions' then
    if not v_admin then
      if tg_op<>'INSERT' then
        if old.status<>'draft' or old.rights_status<>'pending' then
          raise exception 'Only administrators may change reviewed syllabus versions' using errcode='42501';
        end if;
      end if;
      if tg_op<>'DELETE' then
        if new.status<>'draft' or new.rights_status<>'pending' or new.activated_at is not null then
          raise exception 'Syllabus rights and publication require administrator review' using errcode='42501';
        end if;
        if tg_op='UPDATE' and (
          new.id is distinct from old.id
          or new.season_id is distinct from old.season_id
          or new.subject_id is distinct from old.subject_id
          or new.version is distinct from old.version
          or new.created_at is distinct from old.created_at
        ) then
          raise exception 'Syllabus version identity cannot be changed by editors' using errcode='42501';
        end if;
      end if;
    end if;

    if tg_op='INSERT' then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_version_created','syllabus_version',new.id,
        jsonb_build_object('status',new.status,'rights_status',new.rights_status));
    end if;

        if tg_op='UPDATE' and (
      new.status is distinct from old.status
      or new.rights_status is distinct from old.rights_status
      or new.activated_at is distinct from old.activated_at
    ) then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_authorization_changed','syllabus_version',new.id,
        jsonb_build_object('previous_status',old.status,'status',new.status,
          'previous_rights_status',old.rights_status,'rights_status',new.rights_status));
    elsif tg_op='DELETE' then
      insert into ace.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
      values(v_user,'syllabus_version_deleted','syllabus_version',old.id,
        jsonb_build_object('status',old.status,'rights_status',old.rights_status));
    end if;
  elsif tg_table_name in ('topics','subtopics') and not v_admin then
    if tg_op<>'INSERT' then v_old_version_id:=old.syllabus_version_id; end if;
    if tg_op<>'DELETE' then v_version_id:=new.syllabus_version_id; else v_version_id:=v_old_version_id; end if;

    if tg_op='UPDATE' and v_version_id is distinct from v_old_version_id then
      raise exception 'Editors cannot move content between syllabus versions' using errcode='42501';
    end if;

    -- Lock the publication boundary so an editor write cannot race activation.
    select * into v_version from ace.syllabus_versions where id=v_version_id for share;
    if not found or v_version.status<>'draft' or v_version.rights_status<>'pending' then
      raise exception 'Editors may author only pending draft syllabus content' using errcode='42501';
    end if;

    if tg_op<>'DELETE' then
      if tg_table_name='topics' then
        if new.subject_id is distinct from v_version.subject_id then
          raise exception 'Topic subject must match its syllabus version' using errcode='42501';
        end if;
      elsif tg_table_name='subtopics' then
        select * into v_topic from ace.topics where id=new.topic_id for share;
        if not found or v_topic.syllabus_version_id is distinct from v_version_id then
          raise exception 'Subtopic parent must belong to its syllabus version' using errcode='42501';
        end if;
      end if;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function ace.guard_syllabus_authoring() from public,anon,authenticated;
drop trigger if exists guard_syllabus_authoring on ace.syllabus_versions;
create trigger guard_syllabus_authoring before insert or update or delete on ace.syllabus_versions
for each row execute function ace.guard_syllabus_authoring();
drop trigger if exists guard_syllabus_authoring on ace.topics;
create trigger guard_syllabus_authoring before insert or update or delete on ace.topics
for each row execute function ace.guard_syllabus_authoring();
drop trigger if exists guard_syllabus_authoring on ace.subtopics;
create trigger guard_syllabus_authoring before insert or update or delete on ace.subtopics
for each row execute function ace.guard_syllabus_authoring();

commit;

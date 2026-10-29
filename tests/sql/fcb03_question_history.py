"""Additional cases: synthetic identities in the guarded disposable workflow fixture."""
from fcb03_question_workflow import AUTHOR,REVIEWER,STUDENT,Q,TOPIC,context,call,payload,literal

def restore(expected=2,source=1,reason='Correct an editorial regression'):
    return "select ace.restore_question('%s',%s,%s,%s);"%(Q,expected,source,"'"+reason.replace("'","''")+"'")

def history_cases(fixture):
    cases=[]
    create=context(AUTHOR)+call('save',0,payload())
    edited=create+call('save',1,payload(stem='Edited question'))
    approved=create+call('submit',1)+context(REVIEWER)+call('approve',2)
    published=approved+call('publish',3)
    def add(name,sql,error=None,isolation='read committed'):
        cases.append(dict(name=name,sql='begin isolation level '+isolation+';'+fixture+sql+'rollback;',error=error))
    def check(body):return 'reset role;do $$begin '+body+'end$$;'
    add('history-is-private-coherent-and-complete',edited+"do $$declare r jsonb;begin r:=ace.question_history('"+Q+"',null);if r->>'question_id'is distinct from'"+Q+"'or(r->>'current_version')::int is distinct from 2 or jsonb_array_length(r->'versions')is distinct from 2 or(r->>'has_next')::boolean is distinct from false or(r->'versions'->0->>'version')::int is distinct from 2 then raise exception 'History readback failed';end if;end$$;")
    add('restore-creates-new-private-audited-revision',edited+restore()+check("if not exists(select 1 from ace.questions where id='"+Q+"'and content_version=3 and review_status='draft'and not active and rights_status='unknown'and reviewed_by is null and stem='What is 3 + 4?'and created_by='"+AUTHOR+"')or(select count(*)from ace.question_versions)<>3 or(select snapshot->>'stem'from ace.question_versions where version=2)<>'Edited question'or not exists(select 1 from ace.audit_events where event_type='question_restored'and(metadata->>'source_revision')::int=1 and(metadata->>'revision')::int=3)then raise exception 'Restore did not preserve history/reset review/audit';end if;"))
    add('restore-old-publication-does-not-republish',published+call('withdraw',4,{'reason':'Prepare correction'})+restore(5,4)+check("if not exists(select 1 from ace.questions where content_version=6 and review_status='draft'and not active and reviewed_by is null and rights_status='unknown'and provenance->>'last_content_editor'='"+REVIEWER+"')then raise exception 'Historical publication flags survived restoration';end if;"))
    for actor,name in [(STUDENT,'student'),('','identity-free')]:
        add(name+'-history-denied',context(actor)+"select ace.question_history('"+Q+"',null);",'Question authoring permission required')
        add(name+'-restore-denied',context(actor)+restore(),'Question authoring permission required')
    for fn in ["ace.question_history('"+Q+"',null)","ace.restore_question('"+Q+"',2,1,'Reason')"]:
        add('anon-'+('history'if'history'in fn else'restore')+'-denied','set local role anon;select '+fn+';','permission denied')
    add('other-editor-cannot-restore',edited+"reset role;update ace.roles set role='editor'where user_id='"+STUDENT+"';"+context(STUDENT)+restore(),'Only the author or administrator may edit')
    add('published-restore-requires-withdrawal',published+restore(4,1),'Withdraw published question before editing')
    add('stale-restore-refused',edited+call('save',2,payload(stem='Latest edit'))+restore(2,1),'Question revision changed')
    for source in [0,2,3]:add('invalid-source-'+str(source),edited+restore(2,source),'Invalid restoration request')
    for reason in ['', '\t\n','x'*2001]:add('invalid-restore-reason-'+str(len(reason)),edited+restore(reason=reason),'Restoration reason required')
    add('history-invalid-cursor',edited+"select ace.question_history('"+Q+"',-1);",'Invalid history cursor')
    add('history-missing-question',context(AUTHOR)+"select ace.question_history('"+Q+"',null);",'Question not found')
    add('restore-inactive-taxonomy-refused',edited+"reset role;select set_config('request.jwt.claim.sub','"+REVIEWER+"',true);update ace.topics set active=false;"+context(AUTHOR)+restore(),'Invalid question taxonomy')
    add('restore-unsupported-historical-media-refused',edited+"reset role;alter table ace.question_versions disable trigger question_history_immutable;update ace.question_versions set snapshot=jsonb_set(snapshot,'{media}','[{\"url\":\"https://example.invalid\"}]')where version=1;alter table ace.question_versions enable trigger question_history_immutable;"+context(AUTHOR)+restore(),'Historical media requires the reviewed media workflow')
    add('restore-audit-failure-is-atomic',edited+"reset role;alter table ace.audit_events add constraint reject_restore_audit check(event_type<>'question_restored')not valid;"+context(AUTHOR)+"do $$begin begin perform ace.restore_question('"+Q+"',2,1,'Reason');raise exception 'Expected audit failure';exception when check_violation then null;end;end$$;"+check("if(select content_version from ace.questions where id='"+Q+"')<>2 or(select count(*)from ace.question_versions)<>2 then raise exception 'Partial restoration survived audit failure';end if;"))
    add('restorer-cannot-self-approve',published+call('withdraw',4,{'reason':'Correction'})+restore(5,1)+call('submit',6)+call('approve',7),'Independent reviewer required')
    edits=''.join(call('save',i,payload(stem='Revision '+str(i+1)))for i in range(1,12))
    add('history-ten-row-cursor-pagination',create+edits+"do $$declare a jsonb;b jsonb;begin a:=ace.question_history('"+Q+"',null);b:=ace.question_history('"+Q+"',(a->>'next_before')::int);if jsonb_array_length(a->'versions')is distinct from 10 or(a->>'has_next')::boolean is distinct from true or(a->>'next_before')::int is distinct from 3 or jsonb_array_length(b->'versions')is distinct from 2 or(b->>'has_next')::boolean is distinct from false or(b->'versions'->0->>'version')::int is distinct from 2 then raise exception 'History cursor pagination failed';end if;end$$;")
    add('history-untrusted-owner-refused',"alter function ace.question_history(uuid,integer)owner to authenticated;"+context(AUTHOR)+"select ace.question_history('"+Q+"',null);",'Trusted executor owner required')
    add('restore-untrusted-owner-refused',"alter function ace.restore_question(uuid,integer,integer,text)owner to authenticated;"+edited+restore(),'Trusted executor owner required')
    add('history-repeatable-read-refused',edited+"select ace.question_history('"+Q+"',null);",'Read committed transaction required','repeatable read')
    return cases

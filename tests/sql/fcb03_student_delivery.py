from fcb03_question_workflow import AUTHOR, REVIEWER, STUDENT, Q, SUBJECT, TOPIC, SUBTOPIC, VERSION, context, call, payload, literal

def delivery_cases(fixture):
    cases=[]
    published=context(AUTHOR)+call('save',0,payload())+call('submit',1)+context(REVIEWER)+call('approve',2)+call('publish',3)
    ids="select ace.published_topic_questions('%s','%s',null,20);"%(SUBJECT,TOPIC)
    mappings="select ace.student_question_topics(array['%s']::uuid[]);"%Q
    stats="reset role;insert into ace.student_question_stats(user_id,question_id,attempts,correct_count,incorrect_count)values('%s','%s',2,1,1);"%(STUDENT,Q)
    def add(name,sql,error=None,isolation='read committed'):
        cases.append(dict(name='delivery-'+name,sql='begin isolation level '+isolation+';'+fixture+sql+'rollback;',error=error))
    def check(body):return 'do $$declare r jsonb;begin '+body+'end$$;'
    add('metadata-positive',published+stats+context(STUDENT)+check("r:=ace.published_topic_questions('%s','%s','%s',1);if r<>%s then raise exception 'Published identifiers missing';end if;r:=ace.student_question_topics(array['%s']::uuid[]);if r<>%s then raise exception 'Tracked topic evidence missing';end if;"%(SUBJECT,TOPIC,SUBTOPIC,literal([Q]),Q,literal([dict(id=Q,subject_id=SUBJECT,topic_id=TOPIC,subtopic_id=SUBTOPIC)]))))
    add('evidence-self-only',published+stats+context(AUTHOR)+check("if ace.student_question_topics(array['%s']::uuid[])<>'[]'then raise exception 'Other student evidence leaked';end if;"%Q))
    add('no-tracked-evidence',published+context(STUDENT)+check("if ace.student_question_topics(array['%s']::uuid[])<>'[]'then raise exception 'Untracked evidence returned';end if;"%Q))
    for mutation,name in [("rights_status='unknown'",'rights'),("active=false",'withdrawn'),("review_status='draft'",'draft')]:
        add(name+'-hidden',published+stats+"update ace.questions set "+mutation+" where id='"+Q+"';"+context(STUDENT)+check("if ace.published_topic_questions('%s','%s',null,20)<>'[]'or ace.student_question_topics(array['%s']::uuid[])<>'[]'then raise exception 'Private metadata leaked';end if;"%(SUBJECT,TOPIC,Q)))
    add('wrong-taxonomy-empty',published+context(STUDENT)+check("if ace.published_topic_questions('%s','%s',null,20)<>'[]'or ace.published_topic_questions('%s','%s','%s',20)<>'[]'then raise exception 'Taxonomy filter failed';end if;"%(Q,TOPIC,SUBJECT,TOPIC,Q)))
    add('inactive-taxonomy-empty',published+stats+"reset role;update ace.topics set active=false where id='"+TOPIC+"';"+context(STUDENT)+check("if ace.published_topic_questions('%s','%s',null,20)<>'[]'or ace.student_question_topics(array['%s']::uuid[])<>'[]'then raise exception 'Inactive taxonomy leaked';end if;"%(SUBJECT,TOPIC,Q)))
    for sql,name in [(ids,'ids'),(mappings,'mappings')]:
        add('identity-free-'+name,context('')+sql,'Authentication required')
        add('anonymous-'+name,'set local role anon;'+sql,'permission denied')
    for limit in ['null','0','21','-1']:
        add('limit-'+limit,context(STUDENT)+"select ace.published_topic_questions('%s','%s',null,%s);"%(SUBJECT,TOPIC,limit),'Invalid metadata request')
    for array,name in [('null','null'),("'{}'::uuid[]",'empty'),("array['%s',null]::uuid[]"%Q,'null-member'),("array['%s','%s']::uuid[]"%(Q,Q),'duplicate'),("array_fill('%s'::uuid,array[81])"%Q,'oversized')]:
        add('array-'+name,context(STUDENT)+'select ace.student_question_topics('+array+');','Invalid metadata request')
    add('read-committed-only',context(STUDENT)+ids,'Read committed transaction required','repeatable read')
    add('no-direct-grants',context(STUDENT)+check("if has_table_privilege('authenticated','ace.questions','SELECT')or has_any_column_privilege('authenticated','ace.questions','SELECT')then raise exception 'Question table grant widened';end if;"))
    add('untrusted-owner',"create role metadata_untrusted;grant usage on schema ace,auth to metadata_untrusted;alter function ace.published_topic_questions(uuid,uuid,uuid,integer)owner to metadata_untrusted;"+context(STUDENT)+ids,'Trusted executor owner required')
    return cases

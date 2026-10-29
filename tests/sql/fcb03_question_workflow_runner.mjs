// Local real PostgreSQL engine via the preinstalled scratch-only PGlite runtime.
// Production has no dependency on this tool. Native CI runs the same cases with psql.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const runtime = process.env.ACE_PGLITE_RUNTIME
if (!runtime) throw Error('Set ACE_PGLITE_RUNTIME to the existing test runtime directory')
const { PGlite } = await import(pathToFileURL(resolve(runtime,'node_modules/@electric-sql/pglite/dist/index.js')))
const { vector } = await import(pathToFileURL(resolve(runtime,'node_modules/@electric-sql/pglite-pgvector/dist/index.js')))
const plan = JSON.parse(execFileSync('python3',['tests/sql/fcb03_question_workflow.py','--emit',...(process.argv[3]?['--history']:[]),...(process.argv[4]?['--delivery']:[])],{encoding:'utf8',maxBuffer:4e6}))
const db = new PGlite({extensions:{vector}})
const expand = path => readFileSync(path,'utf8').replace(/^\\i\s+(.+)$/gm,(_,file)=>expand(file.trim()))
try {
  await db.exec(expand('tests/sql/fcb_01_schema_baseline.test.sql'))
  const installer = process.argv[2]
  await db.exec(installer ? readFileSync(installer,'utf8') : "create function ace.manage_question(text,uuid,integer,jsonb)returns jsonb language sql as $$select '{}'::jsonb$$;create function ace.review_questions(text,integer)returns jsonb language sql as $$select '{}'::jsonb$$;")
  if(process.argv[3])await db.exec(readFileSync(process.argv[3],'utf8'))
  if(process.argv[4])await db.exec(readFileSync(process.argv[4],'utf8'))
  for (const c of plan.cases) {
    let failure
    try { await db.exec(c.sql) } catch (e) { failure=e; await db.exec('rollback;reset role;') }
    if(c.error ? !failure?.message.includes(c.error) : failure) throw Error(c.name+': '+(failure?.message??'Expected refusal did not occur'))
    console.log('PASS '+c.name)
  }
  console.log(`${plan.cases.length} question workflow cases PASS`)
} catch(e) { console.error(e.message);process.exitCode=1 } finally { await db.close() }

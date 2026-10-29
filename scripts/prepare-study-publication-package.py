"""Bind the reviewed concept index and saved baseline for a fixed admin RPC."""
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
index = json.loads((ROOT / 'docs/content-review/fcb-02-original-study-index-candidate-2026-10-29.json').read_text())
baseline = json.loads((ROOT / 'docs/content-review/fcb-02-2026-baseline-proposal-2026-10-29.json').read_text())
source = json.loads(json.loads((ROOT / 'src/data/fcb02ReviewPayload.json').read_text())['payload'])
package = {'index':index, 'config':baseline['config'], 'composition':[{k:v for k,v in row.items() if k != 'subject_code'} for row in baseline['subjects']], 'subjects':source['subjects'], 'use_basis':{'kind':'factual_concepts_and_original_arrangement','authority':'Nigerian Copyright Act 2022, sections 2(5) and 3(a)','authority_url':'https://www.copyright.gov.ng/wp-content/uploads/2023/04/CopyrightAct2023FinalPublication1.pdf','scope':'Concept names and ACE arrangement only; excludes source prose, PDFs, books, questions, images and audio.','external_jamb_licence':False,'decision_date':'2026-10-29'}}
payload = json.dumps(package, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
wrapper = {'digest':hashlib.sha256(payload.encode()).hexdigest(), 'payload':payload}
(ROOT / 'src/data/fcb02StudyPublication.json').write_text(json.dumps(wrapper,ensure_ascii=False) + '\n')
template = (ROOT / 'supabase/proposals/fcb02_study_publication.template.sql').read_text()
(ROOT / 'supabase/proposals/fcb02_study_publication.sql').write_text(template.replace('__DIGEST__',wrapper['digest']).replace('__BYTES__',str(len(payload.encode()))))
print(wrapper['digest'], len(payload.encode()))

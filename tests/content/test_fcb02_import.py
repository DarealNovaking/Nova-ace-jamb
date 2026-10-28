"""Guard the actual content payload: no publication, overwrite or cross-version links."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('fcb02_import', ROOT / 'scripts/prepare-fcb02-import.py')
module = importlib.util.module_from_spec(SPEC) if SPEC else None
if SPEC and SPEC.loader and (ROOT / 'scripts/prepare-fcb02-import.py').exists():
    SPEC.loader.exec_module(module)

class ProposalTests(unittest.TestCase):
    def setUp(self):
        self.draft = json.loads((ROOT / 'docs/content-review/fcb-02-taxonomy-draft-2026-10-28.json').read_text())
        self.target = json.loads((ROOT / 'docs/content-review/fcb-02-import-target-snapshot-2026-10-28.json').read_text())

    def build(self):
        self.assertTrue(hasattr(module, 'build_proposal'), 'Missing draft-only import builder')
        return module.build_proposal(self.draft, self.target)

    def test_new_pending_versions_preserve_existing_scaffolds(self):
        p = self.build()
        self.assertEqual((len(p['versions']), len(p['topics']), len(p['subtopics'])), (25, 214, 954))
        existing = {v['id'] for v in self.target['snapshot']['versions']}
        for v in p['versions']:
            self.assertNotIn(v['id'], existing)
            self.assertEqual((v['version'], v['status'], v['rights_status'], v['activated_at']), (2, 'draft', 'pending', None))
            self.assertIn('source_sha256', v['provenance'])
        self.assertTrue(all(t['active'] is False for t in p['topics'] + p['subtopics']))

    def test_children_bind_to_their_exact_new_parent_version(self):
        p = self.build()
        versions = {v['id']: v for v in p['versions']}
        topics = {t['id']: t for t in p['topics']}
        for t in topics.values():
            self.assertEqual(t['subject_id'], versions[t['syllabus_version_id']]['subject_id'])
        for c in p['subtopics']:
            self.assertEqual(c['syllabus_version_id'], topics[c['topic_id']]['syllabus_version_id'])
        self.assertEqual(len({r['id'] for key in ('versions','topics','subtopics') for r in p[key]}), 1193)

    def test_unknown_english_text_is_excluded_without_dropping_the_subject(self):
        p = self.build()
        self.assertEqual([x['review_id'] for x in p['exclusions']], ['ENG-01-04'])
        self.assertFalse(any('title awaiting confirmation' in t['name'] for t in p['subtopics']))
        english = next(v for v in p['versions'] if v['provenance']['subject_code'] == 'ENG')
        self.assertTrue(any(t['syllabus_version_id'] == english['id'] for t in p['topics']))

    def test_deterministic_payload_and_sql_round_trip_special_text(self):
        p = self.build()
        self.assertEqual(p, self.build())
        text = "O'Brien \\ test'); drop table ace.subjects; --"
        self.assertEqual(module.sql_literal(text), "'O''Brien \\ test''); drop table ace.subjects; --'")

    def test_executor_is_fixed_package_admin_only_and_installer_has_no_content(self):
        p = self.build()
        sql = module.render_executor(p)
        self.assertIn('security definer', sql.lower())
        self.assertIn('for share', sql.lower())
        self.assertIn("p_action not in ('preview','stage','undo')", sql)
        self.assertIn(p['review_digest'], sql)
        self.assertIn('octet_length(p_package)', sql)
        self.assertNotIn('set_config(', sql)
        self.assertNotIn('create or replace function', sql.lower())
        self.assertLess(len(sql), 30000)
        self.assertIn('set search_path = pg_catalog, pg_temp', sql)
        uninstall = module.render_uninstall(p)
        self.assertIn('prosrc', uninstall)
        self.assertNotIn('delete from', uninstall.lower())

    def test_rejects_subject_mapping_drift(self):
        self.target['snapshot']['subjects'][0]['code'] = 'ZZZ'
        with self.assertRaises(ValueError): self.build()

    def test_rejects_changed_target_season_or_version(self):
        next(s for s in self.target['snapshot']['seasons'] if s['exam_year'] == 2027)['status'] = 'active'
        with self.assertRaises(ValueError): self.build()
        self.setUp()
        next(v for v in self.target['snapshot']['versions'] if v['season_id'] == '23fc8eb7-2d2e-474f-b4db-c0a69f22cd62')['version'] = 2
        with self.assertRaises(ValueError): self.build()

    def test_rejects_approved_or_publishable_input(self):
        self.draft['subjects'][0]['publication_allowed'] = True
        with self.assertRaises(ValueError): self.build()
        self.setUp()
        self.draft['subjects'][0]['rights_status'] = 'approved'
        with self.assertRaises(ValueError): self.build()

    def test_rejects_duplicate_review_ids(self):
        self.draft['subjects'][0]['nodes'][0]['children'][0]['review_id'] = self.draft['subjects'][0]['nodes'][0]['review_id']
        with self.assertRaises(ValueError): self.build()

if __name__ == '__main__': unittest.main()

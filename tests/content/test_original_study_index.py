import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('index', ROOT / 'scripts/prepare-original-study-index.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class OriginalStudyIndex(unittest.TestCase):
    def setUp(self):
        self.groups = json.loads((ROOT / 'docs/content-review/fcb-02-original-study-groups-2026-10-29.json').read_text())

    def test_complete_corrected_coverage_and_private_candidate(self):
        result = m.build(self.groups)
        self.assertEqual(len(result['versions']), 25)
        self.assertEqual(len(result['topics']), 108)
        source_ids = [i for row in result['lineage'] for i in row['source_ids']]
        self.assertEqual(len(source_ids), 1170)
        self.assertEqual(len(set(source_ids)), 1170)
        self.assertEqual(result['source_fingerprints']['subtopics'], '86806e7337523a601427debd19e26888')
        self.assertTrue(all(not r['active'] and r['description'] is None for r in result['topics'] + result['subtopics']))
        self.assertTrue(all(r['status'] == 'draft' and r['rights_status'] == 'pending' for r in result['versions']))
        self.assertEqual(result, m.build(self.groups))

    def test_duplicate_or_missing_source_is_rejected(self):
        group = self.groups['subjects'][0]['study_groups'][0]
        group['source_topic_ids'].append(group['source_topic_ids'][0])
        with self.assertRaises(ValueError): m.build(self.groups)
        group['source_topic_ids'] = []
        with self.assertRaises(ValueError): m.build(self.groups)

    def test_cross_subject_mapping_is_rejected(self):
        a, b = self.groups['subjects'][:2]
        a['study_groups'][0]['source_topic_ids'][0] = b['study_groups'][0]['source_topic_ids'][0]
        with self.assertRaises(ValueError): m.build(self.groups)

    def test_blank_and_padded_group_names_are_rejected(self):
        group = self.groups['subjects'][0]['study_groups'][0]
        for bad in ['', '  ', ' Padded group ']:
            group['name'] = bad
            with self.assertRaises(ValueError): m.build(self.groups)

    def test_names_are_not_silently_lost_when_context_repeats(self):
        result = m.build(self.groups)
        self.assertTrue(any('Conditional sentences' == r['name'] for r in result['subtopics']))
        self.assertTrue(any('Transition to the Fourth Republic' == r['name'] for r in result['subtopics']))
        self.assertEqual(len({r['id'] for r in result['versions'] + result['topics'] + result['subtopics']}), len(result['versions'] + result['topics'] + result['subtopics']))

if __name__ == '__main__': unittest.main()

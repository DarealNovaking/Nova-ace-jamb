#!/usr/bin/env python3
"""Compare disposable replay catalog to the live metadata snapshot; no live writes."""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]

def privileges(acl, is_function=False):
    # NULL means built-in owner defaults plus PUBLIC EXECUTE for functions.
    if acl is None:
        return {'PUBLIC': 'X'} if is_function else {}
    result = {}
    for entry in acl.strip('{}').split(','):
        role, rest = entry.split('=')
        if role == 'postgres':
            continue  # PG17 adds owner MAINTAIN, absent on PG16.
        result[role or 'PUBLIC'] = ''.join(sorted(rest.split('/')[0]))
    return result

def compare(actual):
    expected = json.loads((ROOT / 'supabase/schema/ace-2026-10-27.catalog.json').read_text())
    for key in ['columns','constraints','indexes','functions','policies','triggers','tables']:
        left, right = expected[key], actual[key]
        if key in ('tables','functions'):
            left, right = [dict(x) for x in left], [dict(x) for x in right]
            for row in left + right:
                row['acl'] = privileges(row['acl'], key == 'functions')
        if left != right:
            for i in range(max(len(left),len(right))):
                a = left[i] if i < len(left) else None
                b = right[i] if i < len(right) else None
                if a != b:
                    raise AssertionError(f'{key} mismatch at {i}: expected {a!r}, got {b!r}')
        print(f'PASS {key}: {len(left)} exact catalog entries')
    assert privileges(expected['schema_acl']) == privileges(actual['schema_acl'])
    print('PASS schema API privileges')

if __name__ == '__main__':
    if len(sys.argv) == 2:
        compare(json.loads(Path(sys.argv[1]).read_text()))
    else:
        # Refuse remote/default targets; only an explicitly configured disposable service.
        assert os.environ.get('PGHOST') in ('127.0.0.1','localhost'), 'local disposable PGHOST required'
        result = subprocess.run(['psql','-X','-qAt','-v','ON_ERROR_STOP=1','-f',str(ROOT/'tests/sql/fcb_01_schema_catalog.sql')],check=True,capture_output=True,text=True)
        compare(json.loads(result.stdout))

#!/usr/bin/env python3
"""Render the reviewed metadata snapshot; never connects to a database."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'supabase/schema/ace-2026-10-27.catalog.json'
TARGET = ROOT / 'supabase/schema/ace-2026-10-27.sql'

def ident(value):
    return '"' + value.replace('"', '""') + '"'

def render(c):
    # These unsupported features must be reviewed rather than silently omitted.
    assert not c['sequences'] and not c['default_acl']
    assert not any(c['extra'][k] for k in ['column_acl', 'relation_options', 'custom_types', 'inheritance', 'unvalidated_constraints'])
    assert all(t['owner'] == 'postgres' for t in c['tables'])
    assert all(f['owner'] == 'postgres' for f in c['functions'])
    assert c['schema_acl'] == '{postgres=UC/postgres,authenticated=U/postgres}'
    out = ['-- Catalog-derived recovery baseline, 2026-10-27. NOT a migration or production script.',
           '-- Empty disposable database only; requires postgres owner, Supabase auth/roles and vector.',
           '-- Contains no data, secrets or migration-ledger SQL. See README.md in this directory.',
           'BEGIN;', 'CREATE SCHEMA ace AUTHORIZATION postgres;',
           'SET LOCAL search_path = pg_catalog, public, extensions;',
           'SET LOCAL check_function_bodies = false;']
    for t in c['tables']:
        cols = []
        for a in c['columns']:
            if a['table_name'] != t['name']:
                continue
            assert not a['identity'] and not a['generated']
            cols.append('  ' + ident(a['name']) + ' ' + a['type']
                        + (' DEFAULT ' + a['default_expr'] if a['default_expr'] else '')
                        + (' NOT NULL' if a['not_null'] else ''))
        out.append('CREATE TABLE ace.' + ident(t['name']) + ' (\n' + ',\n'.join(cols) + '\n);')
    out.extend(f['definition'].rstrip().rstrip(';') + ';' for f in c['functions'])
    # Keys/checks before references, including references to later alphabetical tables.
    for k in sorted(c['constraints'], key=lambda k: k['type'] == 'f'):
        out.append('ALTER TABLE ace.' + ident(k['table_name']) + ' ADD CONSTRAINT '
                   + ident(k['name']) + ' ' + k['definition'] + ';')
    out.extend(i['indexdef'].rstrip(';') + ';' for i in c['indexes'])
    for t in c['tables']:
        if t['rls']:
            out.append('ALTER TABLE ace.' + ident(t['name']) + ' ENABLE ROW LEVEL SECURITY;')
        if t['force_rls']:
            out.append('ALTER TABLE ace.' + ident(t['name']) + ' FORCE ROW LEVEL SECURITY;')
    for p in c['policies']:
        out.append('CREATE POLICY ' + ident(p['policyname']) + ' ON ace.' + ident(p['tablename'])
                   + ' AS ' + p['permissive'] + ' FOR ' + p['cmd'] + ' TO '
                   + ', '.join('PUBLIC' if r == 'public' else ident(r) for r in p['roles'])
                   + (' USING (' + p['qual'] + ')' if p['qual'] else '')
                   + (' WITH CHECK (' + p['with_check'] + ')' if p['with_check'] else '') + ';')
    for t in c['triggers']:
        assert t['enabled'] == 'O'
        out.append(t['definition'].rstrip(';') + ';')
    # Explicitly reset inherited API defaults, then reproduce the observed API ACLs.
    out.extend(['REVOKE ALL ON SCHEMA ace FROM PUBLIC, anon, authenticated;',
                'GRANT USAGE ON SCHEMA ace TO authenticated;',
                'REVOKE ALL ON ALL TABLES IN SCHEMA ace FROM PUBLIC, anon, authenticated;',
                'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ace FROM PUBLIC, anon, authenticated;'])
    perms = {'a': 'INSERT', 'r': 'SELECT', 'w': 'UPDATE', 'd': 'DELETE'}
    for t in c['tables']:
        if t['acl'] is None:
            continue
        for acl in t['acl'].strip('{}').split(','):
            grantee, priv = acl.split('=')
            priv = priv.split('/')[0]
            if grantee == 'postgres':
                continue
            assert grantee == 'authenticated' and set(priv) <= set(perms)
            out.append('GRANT ' + ', '.join(perms[v] for v in priv)
                       + ' ON ace.' + ident(t['name']) + ' TO authenticated;')
    for f in c['functions']:
        obj = 'ace.' + ident(f['name']) + '(' + f['identity'] + ')'
        if f['acl'] is None:
            out.append('GRANT EXECUTE ON FUNCTION ' + obj + ' TO PUBLIC;')
            continue
        for acl in f['acl'].strip('{}').split(','):
            grantee, priv = acl.split('=')
            assert priv == 'X/postgres'
            if grantee != 'postgres':
                assert grantee in ('anon', 'authenticated')
                out.append('GRANT EXECUTE ON FUNCTION ' + obj + ' TO ' + grantee + ';')
    out.append('COMMIT;')
    return '\n\n'.join(out) + '\n'

if __name__ == '__main__':
    TARGET.write_text(render(json.loads(SOURCE.read_text())))

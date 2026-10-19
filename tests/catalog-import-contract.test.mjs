import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../supabase/functions/catalog-import/index.ts", import.meta.url), "utf8");

test("catalog importer supports browser preflight and bounded POST requests", () => {
  assert.match(source, /req\.method === "OPTIONS"/);
  assert.match(source, /Access-Control-Allow-Methods.*POST, OPTIONS/);
  assert.match(source, /MAX_BODY_BYTES = 4_000_000/);
  assert.match(source, /MAX_ROWS = 5000/);
});

test("catalog importer authorizes the caller and delegates staging atomically", () => {
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /rpc\("can_manage_catalog"\)/);
  assert.match(source, /rpc\("stage_catalog_import"/);
  assert.match(source, /p_source_id: body\.source_id/);
  assert.match(source, /p_snapshot_hash: snapshotHash/);
  assert.doesNotMatch(source, /\.from\("catalog_import_batches"\)\s*\.insert/);
  assert.doesNotMatch(source, /\.from\("catalog_import_rows"\)\s*\.insert/);
});

test("catalog importer validates row payloads and keeps database errors private", () => {
  assert.match(source, /ENTITY_TYPES\.has\(row\.entity_type\)/);
  assert.match(source, /Array\.isArray\(row\.payload\)/);
  assert.match(source, /Unable to stage catalog import/);
  assert.doesNotMatch(source, /detail:\s*stageError/);
});

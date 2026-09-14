import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const MAX_ROWS = 5000;
const MAX_BODY_BYTES = 4_000_000;
const ENTITY_TYPES = new Set([
  "institution",
  "program",
  "program_utme_rule",
  "syllabus_topic",
  "syllabus_subtopic",
]);
const DATASET_TYPES = new Set(["institutions", "programs", "utme_rules", "syllabus"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "Request body too large" }, 413);
  }

  let body: {
    source_id?: string;
    season_id?: string;
    dataset_type?: string;
    rows?: Array<{
      row_number?: number;
      entity_type?: string;
      external_key?: string | null;
      payload?: Record<string, unknown>;
    }>;
    metadata?: Record<string, unknown>;
  };

  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.source_id || !body.dataset_type || !Array.isArray(body.rows)) {
    return json({ error: "source_id, dataset_type and rows are required" }, 400);
  }
  if (!DATASET_TYPES.has(body.dataset_type)) return json({ error: "Invalid dataset_type" }, 400);
  if (body.rows.length < 1 || body.rows.length > MAX_ROWS) {
    return json({ error: `rows must contain 1-${MAX_ROWS} items` }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration unavailable" }, 500);

  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid authentication" }, 401);

  const { data: role, error: roleError } = await adminClient
    .schema("ace")
    .from("roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleError) return json({ error: "Unable to verify permissions" }, 500);
  if (!role || !["admin", "editor"].includes(role.role)) {
    return json({ error: "Admin/editor access required" }, 403);
  }

  const { data: source, error: sourceError } = await adminClient
    .schema("ace")
    .from("catalog_sources")
    .select("id,title,status,source_type")
    .eq("id", body.source_id)
    .maybeSingle();
  if (sourceError) return json({ error: "Unable to load catalog source" }, 500);
  if (!source) return json({ error: "Catalog source not found" }, 404);
  if (!["reviewed", "approved"].includes(source.status)) {
    return json({ error: "Catalog source must be reviewed or approved before import" }, 409);
  }

  if (body.season_id) {
    const { data: season, error: seasonError } = await adminClient
      .schema("ace")
      .from("exam_seasons")
      .select("id,status")
      .eq("id", body.season_id)
      .maybeSingle();
    if (seasonError) return json({ error: "Unable to load season" }, 500);
    if (!season) return json({ error: "Season not found" }, 404);
    if (season.status === "archived") {
      return json({ error: "Cannot import into an archived season" }, 409);
    }
  }

  const normalizedRows = body.rows.map((row, index) => ({
    row_number: Number.isInteger(row.row_number) && (row.row_number as number) > 0
      ? row.row_number
      : index + 1,
    entity_type: row.entity_type,
    external_key: row.external_key ?? null,
    payload: row.payload,
  }));

  const invalid = normalizedRows.find((row) =>
    !row.entity_type ||
    !ENTITY_TYPES.has(row.entity_type) ||
    !row.payload ||
    typeof row.payload !== "object",
  );
  if (invalid) return json({ error: `Invalid catalog row at row ${invalid.row_number}` }, 400);

  const { data: batch, error: batchError } = await adminClient
    .schema("ace")
    .from("catalog_import_batches")
    .insert({
      source_id: body.source_id,
      season_id: body.season_id ?? null,
      dataset_type: body.dataset_type,
      status: "staged",
      row_count: normalizedRows.length,
      metadata: {
        ...(body.metadata ?? {}),
        source_title: source.title,
        imported_by: userData.user.id,
      },
    })
    .select("id")
    .single();
  if (batchError || !batch) return json({ error: "Unable to create import batch" }, 500);

  const rows = normalizedRows.map((row) => ({
    ...row,
    batch_id: batch.id,
    validation_status: "pending",
    validation_errors: [],
  }));
  const { error: rowsError } = await adminClient
    .schema("ace")
    .from("catalog_import_rows")
    .insert(rows);

  if (rowsError) {
    await adminClient.schema("ace").from("catalog_import_batches").delete().eq("id", batch.id);
    return json({ error: "Unable to stage catalog rows" }, 500);
  }

  return json({
    batch_id: batch.id,
    status: "staged",
    row_count: rows.length,
    source: source.title,
    imported_by: userData.user.id,
  }, 201);
});

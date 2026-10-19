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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid authentication" }, 401);

  // Authorization is evaluated from the caller JWT. The staging RPC repeats this
  // check inside the transaction boundary before touching catalogue tables.
  const { data: canManageCatalog, error: permissionError } = await userClient
    .schema("ace")
    .rpc("can_manage_catalog");
  if (permissionError) {
    return json({ error: "Unable to verify permissions" }, 500);
  }
  if (canManageCatalog !== true) return json({ error: "Admin/editor access required" }, 403);

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
    typeof row.payload !== "object" ||
    Array.isArray(row.payload),
  );
  if (invalid) return json({ error: `Invalid catalog row at row ${invalid.row_number}` }, 400);

  const snapshotHash = await sha256Hex(raw);
  const { data: staged, error: stageError } = await userClient
    .schema("ace")
    .rpc("stage_catalog_import", {
      p_source_id: body.source_id,
      p_season_id: body.season_id ?? null,
      p_dataset_type: body.dataset_type,
      p_snapshot_hash: snapshotHash,
      p_metadata: body.metadata ?? {},
      p_rows: normalizedRows,
    });

  if (stageError || !staged) {
    // Do not leak raw database errors or internal schema details to clients.
    return json({ error: "Unable to stage catalog import" }, 500);
  }

  return json(staged, staged.idempotent ? 200 : 201);
});

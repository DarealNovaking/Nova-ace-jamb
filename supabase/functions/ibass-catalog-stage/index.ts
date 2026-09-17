import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import {
  buildIbassBrochureUrl,
  fetchIbassInstitutions,
  fetchIbassProgrammes,
  normalizeProgrammeTitle,
  parseIbassBrochureProgrammes,
} from "../_shared/ibass.ts";

const MAX_INSTITUTIONS = 25;
const IBASS_PROGRAM_SOURCE_ID = "16388e42-7bed-4541-89ff-8ffb0e648425";
const IBASS_BROCHURE_SOURCE_ID = "0b337599-1ca5-4d20-ba83-5ea4e8ab016";

const SUBJECT_ALIASES: Record<string, string[]> = {
  AGR: ["agriculture"],
  ARA: ["arabic"],
  ART: ["art", "fine art"],
  BIO: ["biology"],
  CHE: ["chemistry"],
  CRS: ["christian religious studies", "christian religion"],
  COM: ["commerce"],
  CST: ["computer studies", "computer science"],
  ECO: ["economics"],
  FRE: ["french"],
  GEO: ["geography"],
  GOV: ["government"],
  HAU: ["hausa"],
  HIS: ["history"],
  HEC: ["home economics"],
  IGB: ["igbo"],
  ISS: ["islamic studies", "islamic religion"],
  LIT: ["literature in english", "literature-in-english", "literature"],
  MAT: ["mathematics", "maths"],
  MUS: ["music"],
  PHY: ["physics"],
  POA: ["principles of account", "principles of accounts", "accounting"],
  ENG: ["english language", "use of english", "english"],
  YOR: ["yoruba"],
  PHE: ["physical and health education", "physical education"],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

const subjectPattern = (alias: string) =>
  new RegExp(`(^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")}([^a-z]|$)`, "i");

const extractUtmeSubjects = (requirement: string) => {
  const text = clean(requirement).toLowerCase();
  if (!text) return { codes: [], ambiguous: true, reason: "Empty Subject Requirements" };

  // Alternatives must never be flattened into a single guessed combination.
  if (/\b(either|or|any|one of|choose)\b/i.test(text)) {
    return { codes: [], ambiguous: true, reason: "Alternative/choice language requires explicit group review" };
  }

  const codes = Object.entries(SUBJECT_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => subjectPattern(alias).test(text)))
    .map(([code]) => code);

  if (codes.length === 0) {
    return { codes: [], ambiguous: true, reason: "No authoritative subject code could be matched" };
  }

  return { codes: [...new Set(codes)], ambiguous: false, reason: null };
};

const postCatalogImport = async (
  supabaseUrl: string,
  authHeader: string,
  body: Record<string, unknown>,
) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/catalog-import`, {
    method: "POST",
    headers: {
      authorization: authHeader,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ error: "Invalid catalog-import response" }));
  if (!response.ok) throw new Error(String((payload as Record<string, unknown>).error ?? "catalog-import failed"));
  return payload as Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration unavailable" }, 500);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, serviceRoleKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid authentication" }, 401);

  const { data: role, error: roleError } = await adminClient
    .schema("ace")
    .from("roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleError) return json({ error: "Unable to verify permissions" }, 500);
  if (!role || !["admin", "editor"].includes(role.role)) return json({ error: "Admin/editor access required" }, 403);

  let body: { institution_ids?: string[]; season_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const institutionIds = [...new Set((body.institution_ids ?? []).map(String).map(clean).filter(Boolean))];
  if (institutionIds.length < 1 || institutionIds.length > MAX_INSTITUTIONS) {
    return json({ error: `institution_ids must contain 1-${MAX_INSTITUTIONS} items` }, 400);
  }
  if (!body.season_id) return json({ error: "season_id is required" }, 400);

  const institutions = await fetchIbassInstitutions();
  const selected = institutionIds.map((id) => institutions.find((institution) => institution.id === id));
  const missingInstitutions = institutionIds.filter((id, index) => !selected[index]);
  if (missingInstitutions.length) return json({ error: "Unknown IBASS institution ids", missing_institution_ids: missingInstitutions }, 404);

  const programRows: Array<Record<string, unknown>> = [];
  const ruleRows: Array<Record<string, unknown>> = [];
  const unresolved: Array<Record<string, unknown>> = [];

  for (const institution of selected as NonNullable<(typeof selected)[number]>[]) {
    const programmes = await fetchIbassProgrammes(institution.id);
    const brochureUrl = buildIbassBrochureUrl(institution.id, institution.name);
    const brochureResponse = await fetch(brochureUrl, { headers: { accept: "text/html" } });
    if (!brochureResponse.ok) {
      unresolved.push({ institution_id: institution.id, institution_name: institution.name, reason: `Brochure HTTP ${brochureResponse.status}` });
      continue;
    }

    const brochureHtml = await brochureResponse.text();
    const details = parseIbassBrochureProgrammes(brochureHtml, institution.id, brochureUrl);
    const detailByTitle = new Map<string, typeof details[number]>();
    const duplicateTitles = new Set<string>();
    for (const detail of details) {
      const key = normalizeProgrammeTitle(detail.programme_title);
      if (detailByTitle.has(key)) duplicateTitles.add(key);
      else detailByTitle.set(key, detail);
    }

    for (const programme of programmes) {
      const titleKey = normalizeProgrammeTitle(programme.title);
      const detail = detailByTitle.get(titleKey);
      const externalKey = `ibass:${institution.id}:program:${programme.id}`;
      const institutionExternalKey = `ibass:${institution.id}`;

      if (!detail || duplicateTitles.has(titleKey)) {
        unresolved.push({
          institution_id: institution.id,
          institution_name: institution.name,
          programme_id: programme.id,
          programme_title: programme.title,
          reason: !detail ? "Programme title not reconciled to brochure" : "Duplicate brochure programme title",
        });
      }

      programRows.push({
        entity_type: "program",
        external_key: externalKey,
        payload: {
          name: programme.title,
          institution_external_key: institutionExternalKey,
          award_level: "degree",
          source_url: detail?.source_url ?? brochureUrl,
          provenance: {
            authority: "JAMB/IBASS",
            ibass_institution_id: institution.id,
            ibass_programme_id: programme.id,
            brochure_url: brochureUrl,
          },
        },
      });

      if (!detail?.utme_subject_requirements) continue;
      const parsed = extractUtmeSubjects(detail.utme_subject_requirements);
      if (parsed.ambiguous) {
        unresolved.push({
          institution_id: institution.id,
          programme_id: programme.id,
          programme_title: programme.title,
          reason: parsed.reason,
          utme_subject_requirements: detail.utme_subject_requirements,
        });
        continue;
      }

      ruleRows.push({
        entity_type: "program_utme_rule",
        external_key: `ibass:${institution.id}:program:${programme.id}:utme:v1`,
        payload: {
          program_external_key: externalKey,
          required_subject_codes: parsed.codes,
          alternative_subject_groups: [],
          minimum_optional_subjects: 0,
          notes: detail.utme_subject_requirements,
          source_url: detail.source_url,
          provenance: {
            authority: "JAMB/IBASS",
            ibass_institution_id: institution.id,
            ibass_programme_id: programme.id,
            brochure_url: brochureUrl,
            raw_subject_requirements: detail.utme_subject_requirements,
          },
        },
      });
    }
  }

  const results: Record<string, unknown> = {
    institutions_requested: institutionIds.length,
    programmes_discovered: programRows.length,
    utme_rules_safe_to_stage: ruleRows.length,
    unresolved_count: unresolved.length,
    unresolved,
  };

  if (programRows.length) {
    results.program_import = await postCatalogImport(supabaseUrl, authHeader, {
      source_id: IBASS_PROGRAM_SOURCE_ID,
      season_id: body.season_id,
      dataset_type: "programs",
      rows: programRows,
      metadata: {
        authority: "JAMB/IBASS",
        acquisition: "IBASS institution/programme endpoints + official brochure reconciliation",
        staged_by: userData.user.id,
      },
    });
  }

  if (ruleRows.length) {
    results.utme_rule_import = await postCatalogImport(supabaseUrl, authHeader, {
      source_id: IBASS_BROCHURE_SOURCE_ID,
      season_id: body.season_id,
      dataset_type: "utme_rules",
      rows: ruleRows,
      metadata: {
        authority: "JAMB/IBASS",
        acquisition: "Official IBASS brochure programme-detail Subject Requirements",
        staged_by: userData.user.id,
        alternatives_policy: "ambiguous alternatives are withheld for review rather than flattened",
      },
    });
  }

  return json(results, 201);
});

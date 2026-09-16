const IBASS_BASE = "https://ibass.jamb.gov.ng";
const ELIGIBILITY_BASE = "https://eligibility.jamb.gov.ng";

export type IbassInstitution = {
  id: string;
  name: string;
  category: string | null;
};

export type IbassProgramme = {
  id: string;
  title: string;
};

export type IbassProgrammeRequirements = {
  programme_title: string;
  direct_entry_requirements: string | null;
  olevel_requirements: string | null;
  utme_subject_requirements: string | null;
};

export type IbassCatalogueProgramme = IbassProgrammeRequirements & {
  institution_id: string;
  programme_id: string;
  source_url: string;
};

const requireOk = async (response: Response, label: string) => {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response;
};

export const fetchIbassInstitutions = async (): Promise<IbassInstitution[]> => {
  const response = await requireOk(
    await fetch(`${ELIGIBILITY_BASE}/institution_data.json?v=1`, {
      headers: { accept: "application/json" },
    }),
    "IBASS institution catalogue",
  );
  const data = await response.json();
  const institutions: IbassInstitution[] = [];

  for (const schoolType of Object.values(data ?? {})) {
    for (const category of Object.values((schoolType as Record<string, unknown>) ?? {})) {
      for (const institution of Object.values((category as Record<string, unknown>) ?? {})) {
        const row = institution as Record<string, unknown>;
        const id = String(row.id ?? "").trim();
        const name = String(row.name ?? "").trim();
        if (!id || !name) continue;
        institutions.push({
          id,
          name,
          category: row.category == null ? null : String(row.category),
        });
      }
    }
  }

  const unique = new Map<string, IbassInstitution>();
  for (const institution of institutions) unique.set(institution.id, institution);
  return [...unique.values()];
};

export const fetchIbassProgrammes = async (institutionId: string): Promise<IbassProgramme[]> => {
  if (!/^\d+$/.test(institutionId)) throw new Error("Invalid IBASS institution id");
  const response = await requireOk(
    await fetch(`${ELIGIBILITY_BASE}/load_programs.php?school=${encodeURIComponent(institutionId)}`, {
      headers: { accept: "application/json" },
    }),
    "IBASS programme catalogue",
  );
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("IBASS programme catalogue returned an invalid payload");

  return data
    .map((row) => ({
      id: String((row as Record<string, unknown>).id ?? "").trim(),
      title: String((row as Record<string, unknown>).title ?? "").trim(),
    }))
    .filter((row) => row.id && row.title);
};

const clean = (value: string | null | undefined) => {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  return normalized || null;
};

/**
 * Parses the static programme-detail modals embedded in an IBASS brochure page.
 * The official page exposes each programme as a four-column table:
 * Institutions | Direct Entry Requirements | O'Level Requirements | Subject Requirements.
 */
export const parseIbassBrochureProgrammes = (
  html: string,
  institutionId: string,
  sourceUrl: string,
): IbassCatalogueProgramme[] => {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Unable to parse IBASS brochure HTML");

  const results: IbassCatalogueProgramme[] = [];
  const modals = [...document.querySelectorAll("div.modal-dialog")];

  for (const modal of modals) {
    const title = clean(modal.querySelector("h2")?.textContent);
    const table = modal.querySelector("table.table-bordered.table-striped");
    if (!title || !table) continue;

    const headers = [...table.querySelectorAll("thead th")].map((node) => clean(node.textContent)?.toLowerCase() ?? "");
    const cells = [...table.querySelectorAll("tbody tr:first-child td")].map((node) => clean(node.textContent));
    if (headers.length < 4 || cells.length < 4) continue;

    const subjectIndex = headers.findIndex((header) => header.includes("subject requirements"));
    const directIndex = headers.findIndex((header) => header.includes("direct entry requirements"));
    const olevelIndex = headers.findIndex((header) => header.includes("o'level requirements"));
    if (subjectIndex < 0 || directIndex < 0 || olevelIndex < 0) continue;

    // The modal itself does not expose a stable programme ID. The programme
    // list endpoint is the authoritative ID source; callers must reconcile by
    // normalized title before staging rows.
    results.push({
      institution_id: institutionId,
      programme_id: "",
      programme_title: title,
      direct_entry_requirements: cells[directIndex] ?? null,
      olevel_requirements: cells[olevelIndex] ?? null,
      utme_subject_requirements: cells[subjectIndex] ?? null,
      source_url: sourceUrl,
    });
  }

  return results;
};

export const buildIbassBrochureUrl = (institutionId: string, institutionName: string) => {
  if (!/^\d+$/.test(institutionId)) throw new Error("Invalid IBASS institution id");
  return `${IBASS_BASE}/brochure-courses?id=${encodeURIComponent(institutionId)}&school=${encodeURIComponent(institutionName)}`;
};

export const normalizeProgrammeTitle = (title: string) =>
  title
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

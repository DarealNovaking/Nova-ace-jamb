const SUBJECT_ALIASES = {
  AGR: ["agriculture", "agricultural science"],
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
  LIT: ["literature in english", "literature-in-english"],
  MAT: ["mathematics", "maths"],
  MUS: ["music"],
  PHY: ["physics"],
  POA: ["principles of account", "principles of accounts", "accounting"],
  ENG: ["english language", "use of english", "english"],
  YOR: ["yoruba"],
  PHE: ["physical and health education", "physical education"],
};

const normalize = (value) => String(value ?? "")
  .normalize("NFKC")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();

const SUBJECT_LOOKUP = new Map(
  Object.entries(SUBJECT_ALIASES).flatMap(([code, names]) =>
    names.map((name) => [normalize(name), code])
  ),
);

function parseSubjectList(raw) {
  const names = String(raw ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  if (!names.length) return { ok: false, reason: "source subject list is empty" };

  const codes = [];
  for (const name of names) {
    const code = SUBJECT_LOOKUP.get(normalize(name));
    if (!code) {
      return { ok: false, reason: "unrecognized subject label: " + name };
    }
    if (!codes.includes(code)) codes.push(code);
  }
  return { ok: true, codes };
}

function inferMinimumRequired(title, sourceCount, optionCount) {
  const count = Number(sourceCount);
  if (Number.isInteger(count) && count > 0 && count <= optionCount) return count;

  const text = normalize(title);
  const numeric = text.match(/\bany\s+(one|two|three|four|five|\d+)\s*(?:\(\s*\d+\s*\))?\s+of\b/);
  if (numeric) {
    const words = { one: 1, two: 2, three: 3, four: 4, five: 5 };
    const inferred = words[numeric[1]] ?? Number(numeric[1]);
    if (Number.isInteger(inferred) && inferred > 0 && inferred <= optionCount) return inferred;
    return null;
  }
  if (/\bany\s+of\b/.test(text) || (/\beither\b/.test(text) && /\bor\b/.test(text))) {
    return optionCount >= 2 ? 1 : null;
  }
  if (optionCount === 1) return 1;
  return null;
}

/**
 * Converts the official IBASS UTME subject configuration into the import contract.
 * Unclear combinations are returned as unresolved; they are never guessed.
 */
export function parseIbassUtmeRule(source) {
  if (!source || typeof source !== "object") {
    return { ok: false, reason: "IBASS UTME subject configuration is missing" };
  }

  const required = parseSubjectList(source.required_subjects);
  if (!required.ok) return { ok: false, reason: "required subjects: " + required.reason };
  if (!required.codes.includes("ENG")) {
    return { ok: false, reason: "official required-subject list does not include English Language" };
  }

  const optionalRaw = String(source.optional_subjects ?? "").replace(/^,+|,+$/g, "");
  const secondGroupRaw = String(source.optional_subjects_by_group2 ?? "").replace(/^,+|,+$/g, "");
  if (secondGroupRaw.trim()) {
    return { ok: false, reason: "IBASS secondary optional-subject group needs a separately verified selection rule" };
  }

  const alternativeGroups = [];
  let minimumOptionalSubjects = 0;
  if (optionalRaw.trim()) {
    const options = parseSubjectList(optionalRaw);
    if (!options.ok) return { ok: false, reason: "optional subjects: " + options.reason };
    const minimumRequired = inferMinimumRequired(source.title, source.subject_count, options.codes.length);
    if (minimumRequired === null) {
      return { ok: false, reason: "cannot determine how many optional subjects are required from the official configuration" };
    }
    alternativeGroups.push({
      subject_codes: options.codes,
      minimum_required: minimumRequired,
    });
    minimumOptionalSubjects = minimumRequired;
  }

  return {
    ok: true,
    requiredSubjectCodes: required.codes,
    alternativeGroups,
    minimumOptionalSubjects,
  };
}

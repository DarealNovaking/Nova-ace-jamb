import test from "node:test";
import assert from "node:assert/strict";
import { parseIbassUtmeRule } from "../supabase/functions/ibass-catalog-stage/parser.js";

test("parses official Microbiology configuration with one-of Mathematics or Physics", () => {
  const result = parseIbassUtmeRule({
    title: "Biology,Chemistry,English Language and any  of Mathematics or Physics",
    required_subjects: ",Biology,Chemistry,English Language,",
    optional_subjects: ",Mathematics,Physics,",
    subject_count: 0,
    optional_subjects_by_group2: "",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.requiredSubjectCodes, ["BIO", "CHE", "ENG"]);
  assert.deepEqual(result.alternativeGroups, [
    { subject_codes: ["MAT", "PHY"], minimum_required: 1 },
  ]);
  assert.equal(result.minimumOptionalSubjects, 1);
});

test("uses IBASS subject_count when it explicitly defines the number to choose", () => {
  const result = parseIbassUtmeRule({
    title: "Biology,Chemistry,English Language and any One (1) of Mathematics or Physics",
    required_subjects: ",Biology,Chemistry,English Language,",
    optional_subjects: ",Mathematics,Physics,",
    subject_count: 1,
    optional_subjects_by_group2: "",
  });

  assert.equal(result.ok, true);
  assert.equal(result.alternativeGroups[0].minimum_required, 1);
});

test("accepts a complete fixed combination without optional groups", () => {
  const result = parseIbassUtmeRule({
    title: "Chemistry,English Language,Mathematics and Physics and other relevant subject(s)",
    required_subjects: ",Chemistry,English Language,Mathematics,Physics,",
    optional_subjects: "",
    subject_count: 0,
    optional_subjects_by_group2: "",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.requiredSubjectCodes, ["CHE", "ENG", "MAT", "PHY"]);
  assert.deepEqual(result.alternativeGroups, []);
  assert.equal(result.minimumOptionalSubjects, 0);
});

test("does not guess when a secondary optional group is present", () => {
  const result = parseIbassUtmeRule({
    title: "English Language and optional subjects",
    required_subjects: ",English Language,Biology,Chemistry,",
    optional_subjects: ",Mathematics,Physics,",
    subject_count: 1,
    optional_subjects_by_group2: ",Agriculture,Geography,",
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /secondary optional-subject group/);
});

test("does not map compound subject labels as a single subject", () => {
  const result = parseIbassUtmeRule({
    title: "English Language and other subjects",
    required_subjects: ",English Language,Biology/chemistry/physics,",
    optional_subjects: "",
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /unrecognized subject label/);
});

test("requires English Language to be explicit in the official required list", () => {
  const result = parseIbassUtmeRule({
    title: "Biology and Chemistry",
    required_subjects: ",Biology,Chemistry,",
    optional_subjects: "",
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /does not include English Language/);
});

test("parses an official five-option group with one required choice", () => {
  const result = parseIbassUtmeRule({
    title: "English Language,Mathematics,Physics and any One (1) of Agricultural Science,Biology,Chemistry,Economics or Geography",
    required_subjects: ",English Language,Mathematics,Physics,",
    optional_subjects: ",Agricultural Science,Biology,Chemistry,Economics,Geography,",
    subject_count: 1,
    optional_subjects_by_group2: "",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.requiredSubjectCodes, ["ENG", "MAT", "PHY"]);
  assert.deepEqual(result.alternativeGroups, [
    { subject_codes: ["AGR", "BIO", "CHE", "ECO", "GEO"], minimum_required: 1 },
  ]);
  assert.equal(result.minimumOptionalSubjects, 1);
});


test("accepts exact subject labels returned by the official JAMB eligibility subject endpoint", () => {
  const officialLabels = [
    "Agriculture", "Arabic", "Art", "Biology", "Chemistry",
    "Christian Religious Studies", "Commerce", "Economics", "French",
    "Geography", "Government", "Hausa Language", "History",
    "Home Economics", "Igbo Language", "Islamic Religious Studies",
    "Literature in English", "Mathematics", "Music", "Physics",
    "Principles of Accounts", "Yoruba Language",
  ];

  for (const label of officialLabels) {
    const result = parseIbassUtmeRule({
      title: "English Language and any one of " + label,
      required_subjects: ",English Language,",
      optional_subjects: "," + label + ",",
      subject_count: 1,
      optional_subjects_by_group2: "",
    });
    assert.equal(result.ok, true, label + " should map from the official source label");
  }
});

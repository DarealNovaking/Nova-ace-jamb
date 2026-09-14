# ÑØVÃ ACE JAMB — Authoritative Catalog Import Contract

## Purpose

This contract defines the only supported shape for importing JAMB/IBASS-derived catalogue data into ACE. Raw source material must be transformed into this staged shape before publication. Staging is not publication.

## Dataset types

- `institutions`
- `programs`
- `utme_rules`
- `syllabus`

## Common row envelope

```json
{
  "row_number": 1,
  "entity_type": "institution|program|program_utme_rule|syllabus_topic|syllabus_subtopic",
  "external_key": "stable-source-key",
  "payload": {}
}
```

Every import request must identify an approved/reviewed `source_id`, and may identify a non-archived `season_id`. The server assigns the authenticated importer and creates a staged batch.

## Institution payload

```json
{
  "jamb_code": "000000",
  "name": "Official institution name",
  "institution_type": "university|polytechnic|college|other",
  "ownership": "federal|state|private",
  "state": "State"
}
```

`jamb_code` should be used whenever the authoritative source provides one. Names must be normalized without inventing abbreviations or alternate identities.

## Programme payload

```json
{
  "institution_external_key": "institution-source-key-or-jamb-code",
  "jamb_code": "programme-source-code-if-provided",
  "name": "Official programme name",
  "award_level": "degree",
  "duration_years": 4
}
```

A programme cannot be published unless its institution resolves to a published/draft institution record.

## UTME-rule payload

```json
{
  "program_external_key": "programme-source-key-or-jamb-code",
  "required_subject_codes": ["Use of English", "MAT", "PHY", "CHE"],
  "alternative_groups": [],
  "minimum_optional_subjects": 0,
  "notes": ""
}
```

Subject codes must resolve to the normalized active ACE subject catalogue. Do not invent combinations. Preserve source wording/notes where useful and retain provenance.

## Syllabus payloads

Topic:

```json
{
  "syllabus_version_id": "uuid",
  "name": "Official topic name",
  "description": "Source-derived description where permitted",
  "sort_order": 1
}
```

Subtopic:

```json
{
  "syllabus_version_id": "uuid",
  "topic_external_key": "topic-source-key",
  "name": "Official subtopic name",
  "description": "Source-derived description where permitted",
  "sort_order": 1
}
```

Syllabus rows remain inactive until the syllabus-version activation gate is passed.

## Required lifecycle

`source registered → source approved → import staged → validation → row approval → batch approval → publication → activation`

No client-side operation may skip these boundaries. Imported data must never be treated as authoritative merely because it was successfully staged.

## Quality rules

- Never fabricate missing institutions, programmes, combinations, dates, topics or subtopics.
- Preserve source URL, retrieval metadata and stable external identifiers.
- Do not silently merge conflicting authoritative records.
- Duplicate source keys within a batch are validation failures.
- Dataset/entity mismatches are validation failures.
- Invalid subject references are validation failures.
- Archived seasons cannot receive imports.
- Rights/provenance status must be reviewable before publication.
- Programme-specific UTME combinations must come from the authoritative source; generic guesses are prohibited.

## Operational limits

The catalog-import Edge Function currently limits requests to 5,000 rows and 4 MB. Large source datasets should be split into deterministic batches with source metadata sufficient for replay and audit.

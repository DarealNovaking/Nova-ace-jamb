-- Batch 2: register the public JAMB IBASS eligibility datasets used for
-- institution -> programme -> UTME requirement ingestion.
-- Source discovery was verified against the public IBASS Eligibility Checker.

insert into ace.catalog_sources
  (source_type, title, source_url, retrieved_at, metadata, status)
values
  (
    'ibass',
    'JAMB IBASS institution hierarchy JSON',
    'https://eligibility.jamb.gov.ng/institution_data.json?v=1',
    now(),
    jsonb_build_object(
      'layer', 'catalog',
      'purpose', 'authoritative JAMB institution hierarchy for IBASS eligibility flow',
      'authority', 'JAMB IBASS',
      'format', 'json',
      'retrieval_method', 'public_http_get',
      'verified_on', '2026-09-16'
    ),
    'approved'
  ),
  (
    'ibass',
    'JAMB IBASS UTME subject catalogue JSON',
    'https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1',
    now(),
    jsonb_build_object(
      'layer', 'catalog',
      'purpose', 'authoritative JAMB IBASS UTME subject identifiers used by eligibility checks',
      'authority', 'JAMB IBASS',
      'format', 'json',
      'retrieval_method', 'public_http_get',
      'verified_on', '2026-09-16'
    ),
    'approved'
  ),
  (
    'ibass',
    'JAMB IBASS programme endpoint',
    'https://eligibility.jamb.gov.ng/load_programs.php?school={institution_id}',
    now(),
    jsonb_build_object(
      'layer', 'catalog',
      'purpose', 'authoritative JAMB IBASS programme list for an institution',
      'authority', 'JAMB IBASS',
      'format', 'json',
      'retrieval_method', 'public_http_get',
      'parameter', 'institution_id',
      'verified_on', '2026-09-16'
    ),
    'approved'
  )
where not exists (
  select 1
  from ace.catalog_sources s
  where s.source_url in (
    'https://eligibility.jamb.gov.ng/institution_data.json?v=1',
    'https://eligibility.jamb.gov.ng/subjects_jamb.json?v=1',
    'https://eligibility.jamb.gov.ng/load_programs.php?school={institution_id}'
  )
);

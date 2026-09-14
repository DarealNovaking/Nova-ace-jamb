insert into ace.catalog_sources (source_type,title,source_url,status,metadata)
values
  ('jamb','2026 JAMB Training Manual','https://www.jamb.gov.ng/PDFs/2026/2026%20TRAINING%20MANUAL%20%20final.pdf','approved',jsonb_build_object('authority','JAMB','scope','2026 UTME structure and IBASS guidance')),
  ('ibass','JAMB IBASS Eligibility Checker','https://eligibility.jamb.gov.ng/','approved',jsonb_build_object('authority','JAMB/IBASS','scope','institution, programme and UTME subject eligibility workflow')),
  ('ibass','JAMB IBASS Degree Brochure','https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-engineering.pdf','reviewed',jsonb_build_object('authority','JAMB/IBASS','scope','degree programme requirements and UTME subject combinations')),
  ('ibass','JAMB IBASS Education Brochure','https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-education.pdf','reviewed',jsonb_build_object('authority','JAMB/IBASS','scope','education programme requirements and UTME subject combinations'))
on conflict do nothing;

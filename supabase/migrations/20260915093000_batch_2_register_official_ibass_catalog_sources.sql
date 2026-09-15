insert into ace.catalog_sources (source_type,title,source_url,status,metadata)
select v.source_type,v.title,v.source_url,'reviewed',v.metadata
from (values
  ('ibass','JAMB IBASS Degree List of Schools','https://ibass.jamb.gov.ng/assets/uploads/degree-list-of-schools.pdf','{"purpose":"institution directory and catchment reference","authority":"JAMB IBASS"}'::jsonb),
  ('ibass','JAMB IBASS Engineering Degree Brochure','https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-engineering.pdf','{"purpose":"programme and UTME requirement source","authority":"JAMB IBASS"}'::jsonb),
  ('ibass','JAMB IBASS Education Degree Brochure','https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-education.pdf','{"purpose":"programme and UTME requirement source","authority":"JAMB IBASS"}'::jsonb),
  ('ibass','JAMB IBASS Sciences Degree Brochure','https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-sciences.pdf','{"purpose":"programme and UTME requirement source","authority":"JAMB IBASS"}'::jsonb)
) as v(source_type,title,source_url,metadata)
where not exists (
  select 1 from ace.catalog_sources s where s.source_url = v.source_url
);

-- ==============================================================================
-- HackMitra PostgreSQL Schema Migration 004
-- Seed Real Event Sources & Pipeline Registry
-- NOTE: In compliance with project guidelines, NO invented production hackathon
-- events are inserted here. Only real verification sources and registries.
-- ==============================================================================

insert into public.event_sources (
  id, name, source_type, base_url, is_active, reliability_score
) values
  ('devfolio', 'Devfolio Official Student Developer Portal', 'aggregator', 'https://devfolio.co', true, 0.95),
  ('unstop', 'Unstop National Hackathons & Challenges', 'aggregator', 'https://unstop.com', true, 0.90),
  ('vtu_circular', 'VTU Registrar & Academic Event Notifications', 'university_portal', 'https://vtu.ac.in', true, 0.99),
  ('ktech_nain', 'Karnataka Innovation & Technology Society (K-Tech NAIN)', 'university_portal', 'https://ktech.karnataka.gov.in', true, 0.98),
  ('kdem_hub', 'Karnataka Digital Economy Mission (KDEM Clusters)', 'university_portal', 'https://kdem.karnataka.gov.in', true, 0.95),
  ('hack2skill', 'Hack2skill National Sprints', 'aggregator', 'https://hack2skill.com', true, 0.90),
  ('college_circular', 'Direct College Circular & Noticeboard Submissions', 'college_circular', null, true, 0.85),
  ('campus_scout_submission', 'Verified Campus Ambassador Submissions', 'manual_submission', null, true, 0.92)
on conflict (id) do update set
  name = excluded.name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  is_active = excluded.is_active,
  reliability_score = excluded.reliability_score,
  updated_at = now();

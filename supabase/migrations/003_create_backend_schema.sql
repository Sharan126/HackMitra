-- ==============================================================================
-- HackMitra PostgreSQL Schema Migration 003
-- Comprehensive Backend Schema:
--   1. districts
--   2. event_sources
--   3. discovery_runs
--   4. hackathons
--   5. hackathon_source_records
--   6. verification_logs
--   7. saved_events (future phase preparation)
--   8. user_preferences (future phase preparation)
--   9. notification_subscriptions (future phase preparation)
-- ==============================================================================

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Helper function for automated updated_at timestamps
-- ------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 2. TABLE: districts
-- ------------------------------------------------------------------------------
create table if not exists public.districts (
  id text primary key, -- slug (e.g. 'dharwad', 'dakshina-kannada')
  name text not null unique,
  kannada_name text not null,
  slug text not null unique,
  headquarters text not null,
  division text not null check (division in ('Bengaluru', 'Belagavi', 'Kalaburagi', 'Mysuru')),
  kdem_cluster text not null check (kdem_cluster in (
    'Bengaluru Urban',
    'Hubballi-Dharwad-Belagavi',
    'Mysuru Cluster',
    'Mangaluru Coastal',
    'Kalyana Karnataka',
    'Central Karnataka'
  )),
  monitored_colleges_count integer not null default 0 check (monitored_colleges_count >= 0),
  nain_centers_count integer not null default 0 check (nain_centers_count >= 0),
  coverage_status text not null check (coverage_status in ('verified_active', 'verified_zero', 'seeking_leads')) default 'seeking_leads',
  last_audited_at timestamptz default now(),
  audit_frequency_hours integer not null default 12 check (audit_frequency_hours > 0),
  key_institutions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_districts_division on public.districts(division);
create index if not exists idx_districts_cluster on public.districts(kdem_cluster);
create index if not exists idx_districts_coverage on public.districts(coverage_status);

drop trigger if exists trigger_districts_updated_at on public.districts;
create trigger trigger_districts_updated_at
  before update on public.districts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. TABLE: event_sources
-- Tracks discovery channels (Devfolio, Unstop, VTU circular feeds, college portals)
-- ------------------------------------------------------------------------------
create table if not exists public.event_sources (
  id text primary key, -- e.g. 'devfolio', 'unstop', 'vtu_circular', 'nain_portal', 'manual_submission'
  name text not null,
  source_type text not null check (source_type in (
    'aggregator',
    'university_portal',
    'college_circular',
    'manual_submission',
    'rss_feed'
  )),
  base_url text,
  is_active boolean not null default true,
  reliability_score numeric(3, 2) not null default 1.00 check (reliability_score >= 0.00 and reliability_score <= 1.00),
  last_scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_sources_type on public.event_sources(source_type);
create index if not exists idx_event_sources_active on public.event_sources(is_active);

drop trigger if exists trigger_event_sources_updated_at on public.event_sources;
create trigger trigger_event_sources_updated_at
  before update on public.event_sources
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. TABLE: discovery_runs
-- Audit history of scraper jobs, circular ingestion runs, and pipeline metrics
-- ------------------------------------------------------------------------------
create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text references public.event_sources(id) on delete set null,
  status text not null check (status in ('running', 'completed', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_ingested integer not null default 0 check (records_ingested >= 0),
  events_discovered integer not null default 0 check (events_discovered >= 0),
  events_updated integer not null default 0 check (events_updated >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_discovery_runs_source on public.discovery_runs(source_id);
create index if not exists idx_discovery_runs_status on public.discovery_runs(status);
create index if not exists idx_discovery_runs_started on public.discovery_runs(started_at desc);

-- ------------------------------------------------------------------------------
-- 5. TABLE: hackathons
-- Canonical, verified hackathon records across Karnataka
-- ------------------------------------------------------------------------------
create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text not null,
  organizer text not null,
  organizer_type text not null check (organizer_type in (
    'College',
    'University',
    'KDEM / K-Tech',
    'Incubator',
    'Student Club',
    'Corporate'
  )) default 'College',
  city text not null,
  district_id text not null references public.districts(id) on delete restrict,
  district_name text not null,
  venue text not null,
  format text not null check (format in ('in_person', 'hybrid', 'online')),
  is_beyond_bengaluru boolean not null default false,
  cluster text not null,
  official_website_url text not null,
  registration_url text not null,
  registration_deadline timestamptz not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  eligibility text not null default 'Open to all engineering, polytechnic, and university students',
  team_size_min integer not null default 1 check (team_size_min >= 1),
  team_size_max integer not null default 4 check (team_size_max >= team_size_min),
  prize_pool_text text not null default '₹0',
  prize_pool_inr integer not null default 0 check (prize_pool_inr >= 0),
  is_free boolean not null default true,
  registration_fee_inr integer not null default 0 check (registration_fee_inr >= 0),
  fee_amount_text text,
  technology_domains text[] not null default '{}',
  theme_tags text[] not null default '{}',
  current_status text not null check (current_status in (
    'open',
    'closing_soon',
    'closed',
    'upcoming',
    'archived'
  )) default 'open',
  verification_status text not null check (verification_status in (
    'verified',
    'pending_verification',
    'rejected'
  )) default 'verified',
  last_verified_at timestamptz not null default now(),
  source_proof_url text,
  rounds jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint: end_date must be on or after start_date
  constraint chk_dates_valid check (end_date >= start_date),
  -- Constraint: registration deadline must be on or before end_date
  constraint chk_deadline_valid check (registration_deadline <= end_date)
);

create index if not exists idx_hackathons_district on public.hackathons(district_id);
create index if not exists idx_hackathons_status on public.hackathons(current_status);
create index if not exists idx_hackathons_verification on public.hackathons(verification_status);
create index if not exists idx_hackathons_deadline on public.hackathons(registration_deadline);
create index if not exists idx_hackathons_dates on public.hackathons(start_date, end_date);
create index if not exists idx_hackathons_beyond_blr on public.hackathons(is_beyond_bengaluru);
create index if not exists idx_hackathons_slug on public.hackathons(slug);

drop trigger if exists trigger_hackathons_updated_at on public.hackathons;
create trigger trigger_hackathons_updated_at
  before update on public.hackathons
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. TABLE: hackathon_source_records
-- Multiple sources mapping to one canonical event
-- ------------------------------------------------------------------------------
create table if not exists public.hackathon_source_records (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid references public.hackathons(id) on delete cascade,
  source_id text not null references public.event_sources(id) on delete restrict,
  discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  external_event_id text,
  external_url text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  extracted_title text,
  extracted_deadline timestamptz,
  extracted_venue text,
  ingestion_status text not null check (ingestion_status in ('mapped', 'unmapped', 'duplicate', 'flagged')) default 'mapped',
  confidence_score numeric(3, 2) not null default 1.00 check (confidence_score >= 0.00 and confidence_score <= 1.00),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Guarantee deduplication per source
  constraint unique_source_record unique (source_id, external_url)
);

create index if not exists idx_source_records_hackathon on public.hackathon_source_records(hackathon_id);
create index if not exists idx_source_records_source on public.hackathon_source_records(source_id);
create index if not exists idx_source_records_status on public.hackathon_source_records(ingestion_status);

drop trigger if exists trigger_hackathon_source_records_updated_at on public.hackathon_source_records;
create trigger trigger_hackathon_source_records_updated_at
  before update on public.hackathon_source_records
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. TABLE: verification_logs
-- Preserves complete verification audit trail (bot checks, manual moderator audits)
-- ------------------------------------------------------------------------------
create table if not exists public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  verifier_type text not null check (verifier_type in ('automated_bot', 'moderator', 'campus_scout')),
  verifier_identity text not null, -- e.g. 'bot_vtu_liveness', 'moderator_admin'
  previous_status text,
  new_status text not null,
  verification_check_type text not null check (verification_check_type in (
    'link_liveness',
    'dates_consistency',
    'circular_proof_check',
    'organizer_verification',
    'manual_audit'
  )),
  is_verified boolean not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_verification_logs_hackathon on public.verification_logs(hackathon_id);
create index if not exists idx_verification_logs_created on public.verification_logs(created_at desc);

-- ------------------------------------------------------------------------------
-- 8. TABLE: saved_events (Future phase preparation)
-- Student bookmarks and watchlist
-- ------------------------------------------------------------------------------
create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- references auth.users(id) in Supabase Auth
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),

  constraint unique_user_saved_event unique (user_id, hackathon_id)
);

create index if not exists idx_saved_events_user on public.saved_events(user_id);
create index if not exists idx_saved_events_hackathon on public.saved_events(hackathon_id);

-- ------------------------------------------------------------------------------
-- 9. TABLE: user_preferences (Future phase preparation)
-- District preferences, notification toggles, theme tags
-- ------------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key, -- references auth.users(id)
  home_district_id text references public.districts(id) on delete set null,
  preferred_districts text[] not null default '{}',
  preferred_themes text[] not null default '{}',
  notify_email boolean not null default true,
  notify_deadline_reminders boolean not null default true,
  notify_new_in_district boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trigger_user_preferences_updated_at on public.user_preferences;
create trigger trigger_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 10. TABLE: notification_subscriptions (Future phase preparation)
-- Student email subscriptions for district-specific hackathon alerts
-- ------------------------------------------------------------------------------
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  district_id text references public.districts(id) on delete cascade,
  is_active boolean not null default true,
  confirmed_at timestamptz default now(),
  created_at timestamptz not null default now(),

  constraint unique_email_district unique (email, district_id)
);

create index if not exists idx_notifications_district on public.notification_subscriptions(district_id);
create index if not exists idx_notifications_email on public.notification_subscriptions(email);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
alter table public.districts enable row level security;
alter table public.event_sources enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.hackathons enable row level security;
alter table public.hackathon_source_records enable row level security;
alter table public.verification_logs enable row level security;
alter table public.saved_events enable row level security;
alter table public.user_preferences enable row level security;
alter table public.notification_subscriptions enable row level security;

-- 1. districts RLS
drop policy if exists "Districts are viewable by everyone" on public.districts;
create policy "Districts are viewable by everyone"
  on public.districts for select using (true);

drop policy if exists "Districts editable only by service_role" on public.districts;
create policy "Districts editable only by service_role"
  on public.districts for all using (auth.role() = 'service_role');

-- 2. event_sources RLS
drop policy if exists "Active sources are viewable by public" on public.event_sources;
create policy "Active sources are viewable by public"
  on public.event_sources for select using (is_active = true or auth.role() = 'service_role');

drop policy if exists "Sources manageable only by service_role" on public.event_sources;
create policy "Sources manageable only by service_role"
  on public.event_sources for all using (auth.role() = 'service_role');

-- 3. discovery_runs RLS
drop policy if exists "Discovery runs are viewable by public for transparency" on public.discovery_runs;
create policy "Discovery runs are viewable by public for transparency"
  on public.discovery_runs for select using (true);

drop policy if exists "Discovery runs writable only by service_role" on public.discovery_runs;
create policy "Discovery runs writable only by service_role"
  on public.discovery_runs for all using (auth.role() = 'service_role');

-- 4. hackathons RLS
drop policy if exists "Verified hackathons are viewable by everyone" on public.hackathons;
create policy "Verified hackathons are viewable by everyone"
  on public.hackathons for select using (
    verification_status = 'verified' or auth.role() = 'service_role'
  );

drop policy if exists "Hackathons manageable only by service_role" on public.hackathons;
create policy "Hackathons manageable only by service_role"
  on public.hackathons for all using (auth.role() = 'service_role');

-- 5. hackathon_source_records RLS
drop policy if exists "Source records viewable by everyone for transparency" on public.hackathon_source_records;
create policy "Source records viewable by everyone for transparency"
  on public.hackathon_source_records for select using (true);

drop policy if exists "Source records manageable only by service_role" on public.hackathon_source_records;
create policy "Source records manageable only by service_role"
  on public.hackathon_source_records for all using (auth.role() = 'service_role');

-- 6. verification_logs RLS
drop policy if exists "Verification logs are publicly inspectable" on public.verification_logs;
create policy "Verification logs are publicly inspectable"
  on public.verification_logs for select using (true);

drop policy if exists "Verification logs writable only by service_role" on public.verification_logs;
create policy "Verification logs writable only by service_role"
  on public.verification_logs for all using (auth.role() = 'service_role');

-- 7. saved_events RLS
drop policy if exists "Users can view their own saved events" on public.saved_events;
create policy "Users can view their own saved events"
  on public.saved_events for select using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can save events" on public.saved_events;
create policy "Users can save events"
  on public.saved_events for insert with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can delete their own saved events" on public.saved_events;
create policy "Users can delete their own saved events"
  on public.saved_events for delete using (auth.uid() = user_id or auth.role() = 'service_role');

-- 8. user_preferences RLS
drop policy if exists "Users can view their own preferences" on public.user_preferences;
create policy "Users can view their own preferences"
  on public.user_preferences for select using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
  on public.user_preferences for all using (auth.uid() = user_id or auth.role() = 'service_role');

-- 9. notification_subscriptions RLS
drop policy if exists "Anyone can subscribe to district alerts" on public.notification_subscriptions;
create policy "Anyone can subscribe to district alerts"
  on public.notification_subscriptions for insert with check (true);

drop policy if exists "Service role manages notification subscriptions" on public.notification_subscriptions;
create policy "Service role manages notification subscriptions"
  on public.notification_subscriptions for all using (auth.role() = 'service_role');

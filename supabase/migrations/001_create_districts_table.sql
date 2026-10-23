-- HackMitra Districts Schema & Seed Migration
-- Table: public.districts

create table if not exists public.districts (
  id text primary key, -- slug (e.g. 'dharwad', 'dakshina-kannada')
  name text not null unique,
  kannada_name text not null,
  slug text not null unique,
  headquarters text not null,
  division text not null check (division in ('Bengaluru', 'Belagavi', 'Kalaburagi', 'Mysuru')),
  kdem_cluster text not null check (kdem_cluster in ('Bengaluru Urban', 'Hubballi-Dharwad-Belagavi', 'Mysuru Cluster', 'Mangaluru Coastal', 'Kalyana Karnataka', 'Central Karnataka')),
  monitored_colleges_count integer not null default 0,
  nain_centers_count integer not null default 0,
  coverage_status text not null check (coverage_status in ('verified_active', 'verified_zero', 'seeking_leads')) default 'seeking_leads',
  last_audited_at timestamptz default now(),
  audit_frequency_hours integer not null default 12,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for speedy queries
create index if not exists idx_districts_division on public.districts(division);
create index if not exists idx_districts_kdem_cluster on public.districts(kdem_cluster);
create index if not exists idx_districts_slug on public.districts(slug);

-- Enable Row Level Security (RLS)
alter table public.districts enable row level security;

-- Policy: Everyone can read verified districts
create policy "Allow public read access on districts"
  on public.districts for select
  using (true);

-- Policy: Only authenticated service role can update district metadata
create policy "Allow service role to manage districts"
  on public.districts for all
  using (auth.role() = 'service_role');

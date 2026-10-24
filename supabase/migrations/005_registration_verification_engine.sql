-- ==============================================================================
-- HackMitra PostgreSQL Schema Migration 005
-- Registration-Status Verification Engine Schema:
--   - 10 Supported Statuses (open, deadline_today, closing_soon, upcoming,
--     ongoing, closed, completed, cancelled, unverified, stale)
--   - Date-only deadline indicators without fabricated closing times
--   - Recheck scheduling timestamps and approaching deadline priority indexing
--   - Extended verification check types
-- ==============================================================================

-- 1. Update hackathons table constraints and columns
alter table public.hackathons
  drop constraint if exists hackathons_current_status_check;

alter table public.hackathons
  add constraint hackathons_current_status_check check (current_status in (
    'open',
    'deadline_today',
    'closing_soon',
    'upcoming',
    'ongoing',
    'closed',
    'completed',
    'cancelled',
    'unverified',
    'stale'
  ));

alter table public.hackathons
  add column if not exists is_date_only_deadline boolean not null default false,
  add column if not exists registration_deadline_raw text,
  add column if not exists next_verification_due_at timestamptz default now() + interval '12 hours',
  add column if not exists verification_notes text;

-- Priority index for approaching deadline rechecks
create index if not exists idx_hackathons_recheck_priority
  on public.hackathons (next_verification_due_at asc, registration_deadline asc)
  where current_status in ('open', 'deadline_today', 'closing_soon', 'upcoming');

-- 2. Expand verification_logs check types
alter table public.verification_logs
  drop constraint if exists verification_logs_verification_check_type_check;

alter table public.verification_logs
  add constraint verification_logs_verification_check_type_check check (verification_check_type in (
    'link_liveness',
    'dates_consistency',
    'circular_proof_check',
    'organizer_verification',
    'manual_audit',
    'deadline_recheck',
    'cancellation_check',
    'postponement_check',
    'extension_detected',
    'stale_detection'
  ));

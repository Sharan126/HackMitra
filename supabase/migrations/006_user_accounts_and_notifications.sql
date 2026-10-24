-- ==============================================================================
-- HackMitra Migration 006: User Accounts, Notifications, Reminders & Delivery Logs
-- ==============================================================================

-- 1. Extend user_preferences if columns are missing
alter table public.user_preferences 
  add column if not exists email text,
  add column if not exists notify_status_changes boolean not null default true;

-- 2. Create notification_delivery_logs
create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- references auth.users(id) or null for guest district subscriptions
  recipient_email text not null,
  notification_type text not null check (notification_type in (
    'new_matching_event',
    'deadline_reminder',
    'status_or_deadline_change',
    'test_notification'
  )),
  hackathon_id uuid references public.hackathons(id) on delete set null,
  dedup_key text not null unique,
  subject text not null,
  body_preview text,
  provider text not null default 'hackmitra_email_service',
  status text not null check (status in ('delivered', 'failed', 'cancelled', 'skipped_opt_out')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_logs_user on public.notification_delivery_logs(user_id);
create index if not exists idx_delivery_logs_email on public.notification_delivery_logs(recipient_email);
create index if not exists idx_delivery_logs_hackathon on public.notification_delivery_logs(hackathon_id);
create index if not exists idx_delivery_logs_created on public.notification_delivery_logs(created_at desc);

-- 3. Create scheduled_reminders
create table if not exists public.scheduled_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h_before_deadline', '48h_before_deadline', 'deadline_today')),
  target_deadline timestamptz not null,
  scheduled_for timestamptz not null,
  status text not null check (status in ('pending', 'sent', 'cancelled', 'stale')) default 'pending',
  last_processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_user_event_reminder unique (user_id, hackathon_id, reminder_type)
);

create index if not exists idx_reminders_user on public.scheduled_reminders(user_id);
create index if not exists idx_reminders_status_scheduled on public.scheduled_reminders(status, scheduled_for);
create index if not exists idx_reminders_hackathon on public.scheduled_reminders(hackathon_id);

drop trigger if exists trigger_scheduled_reminders_updated_at on public.scheduled_reminders;
create trigger trigger_scheduled_reminders_updated_at
  before update on public.scheduled_reminders
  for each row execute function public.set_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.notification_delivery_logs enable row level security;
alter table public.scheduled_reminders enable row level security;

-- Delivery Logs Policies
drop policy if exists "Users can view their own delivery logs" on public.notification_delivery_logs;
create policy "Users can view their own delivery logs"
  on public.notification_delivery_logs for select using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

drop policy if exists "Delivery logs manageable only by service_role" on public.notification_delivery_logs;
create policy "Delivery logs manageable only by service_role"
  on public.notification_delivery_logs for all using (auth.role() = 'service_role');

-- Scheduled Reminders Policies
drop policy if exists "Users can view their own scheduled reminders" on public.scheduled_reminders;
create policy "Users can view their own scheduled reminders"
  on public.scheduled_reminders for select using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

drop policy if exists "Scheduled reminders manageable by user and service_role" on public.scheduled_reminders;
create policy "Scheduled reminders manageable by user and service_role"
  on public.scheduled_reminders for all using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

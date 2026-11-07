-- Additive migration ONLY — does not drop/alter existing ledger tables.
-- Safe to run on the current hostel expense database.
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- payment_requests: roommate repayment verification workflow
-- ---------------------------------------------------------------------------
create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  from_roommate uuid not null references roommates(id) on delete cascade,
  to_roommate uuid not null references roommates(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  method text not null default 'Cash',
  reference text,
  notes text,
  receipt_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'disputed', 'cancelled')),
  reviewed_by uuid references roommates(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  constraint payment_requests_different_people check (from_roommate <> to_roommate)
);

create index if not exists payment_requests_room_status_idx
  on payment_requests (room_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- notifications: in-app alerts for roommates
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  recipient_id text not null, -- roommate uuid OR 'ALL'
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  link_tab text,
  related_id text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_room_recipient_idx
  on notifications (room_id, recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs: activity trail for admin/coordinator
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  entity_type text not null
    check (entity_type in ('expense', 'payment', 'payment_request', 'kitty', 'roommate', 'settings')),
  entity_id text,
  amount numeric(12,2),
  details text not null,
  timestamp timestamptz not null default now()
);

create index if not exists audit_logs_room_time_idx
  on audit_logs (room_id, timestamp desc);

-- ---------------------------------------------------------------------------
-- RLS policies for new tables (anon read/write for this public room ledger)
-- ---------------------------------------------------------------------------
alter table payment_requests enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

do $$ begin
  create policy "anon_all_payment_requests" on payment_requests
    for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon_all_notifications" on notifications
    for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon_all_audit_logs" on audit_logs
    for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

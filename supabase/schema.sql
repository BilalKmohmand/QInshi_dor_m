-- Hostel Room Expense Tracker — Supabase schema
-- Run in Supabase SQL Editor, then run rls.sql

create extension if not exists "pgcrypto";

do $$ begin
  create type split_mode as enum ('equal', 'exact', 'shares');
exception
  when duplicate_object then null;
end $$;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text not null default 'Room',
  room_number text not null default '',
  currency text not null default 'CNY',
  currency_symbol text not null default '¥',
  monthly_budget numeric(12,2) not null default 0,
  default_coordinator uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roommates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  color text not null default '#0B7A6E',
  handle text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table rooms
    add constraint rooms_default_coordinator_fkey
    foreign key (default_coordinator) references roommates(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  unique (room_id, name)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  date date not null,
  what text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_by uuid references roommates(id) on delete set null,
  paid_from_kitty boolean not null default false,
  split_mode split_mode not null default 'equal',
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  constraint expenses_payer_check check (
    (paid_from_kitty = true and paid_by is null)
    or (paid_from_kitty = false and paid_by is not null)
  )
);

create table if not exists expense_splits (
  expense_id uuid not null references expenses(id) on delete cascade,
  roommate_id uuid not null references roommates(id) on delete cascade,
  custom_amount numeric(12,2),
  custom_shares numeric(12,4) default 1,
  primary key (expense_id, roommate_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  date date not null,
  from_roommate uuid not null references roommates(id) on delete cascade,
  to_roommate uuid not null references roommates(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  constraint payments_different_people check (from_roommate <> to_roommate)
);

create table if not exists kitty_deposits (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  date date not null,
  roommate_id uuid not null references roommates(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_room_date_idx on expenses (room_id, date desc);
create index if not exists payments_room_date_idx on payments (room_id, date desc);
create index if not exists kitty_deposits_room_date_idx on kitty_deposits (room_id, date desc);
create index if not exists roommates_room_id_idx on roommates (room_id);
create index if not exists expense_splits_roommate_idx on expense_splits (roommate_id);

insert into rooms (id, room_name, room_number, currency, currency_symbol, monthly_budget)
values ('00000000-0000-0000-0000-000000000001', 'Hostel Room', '304', 'CNY', '¥', 1500)
on conflict (id) do nothing;

insert into roommates (id, room_id, name, color, handle) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Umair',  '#0B7A6E', 'Alipay / Cash'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Ali',    '#2563EB', 'WeChat Pay'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Aleem',  '#7C3AED', 'Bank Transfer'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Faiz',   '#D97706', 'Cash'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Yousaf', '#DC2626', 'Alipay')
on conflict (id) do nothing;

update rooms
set default_coordinator = '11111111-1111-1111-1111-111111111111'
where id = '00000000-0000-0000-0000-000000000001'
  and default_coordinator is null;

insert into categories (room_id, name)
select '00000000-0000-0000-0000-000000000001', x
from unnest(array['Food','Utilities','Supplies','Internet','Snacks','Other']) as x
on conflict (room_id, name) do nothing;

-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists portfolio_snapshots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users not null,
  snapshot_date     date not null,
  total_value_usd   numeric(14,2) not null,
  total_value_thb   numeric(14,2) not null,
  created_at        timestamptz default now(),
  unique(user_id, snapshot_date)
);

alter table portfolio_snapshots enable row level security;

create policy "Users manage own snapshots"
  on portfolio_snapshots for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

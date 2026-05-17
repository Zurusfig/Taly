-- plants (harvested or grown from seed packets)
create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  species text not null,
  origin_type text not null check (origin_type in ('harvest', 'seed_packet')),
  origin_label text not null,
  planted_at timestamptz default now(),
  fully_grown_at timestamptz,
  position integer
);
alter table plants enable row level security;
create policy "Users manage own plants" on plants for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- seed_packets
create table if not exists seed_packets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  species text not null,
  earned_from text not null,
  earned_at timestamptz default now(),
  planted boolean default false,
  planted_at timestamptz
);
alter table seed_packets enable row level security;
create policy "Users manage own seed_packets" on seed_packets for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- daily_completions (the 3-petal system)
create table if not exists daily_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  completion_date date not null,
  capture_done boolean default false,
  awareness_done boolean default false,
  discipline_done boolean default false,
  all_done_at timestamptz,
  unique(user_id, completion_date)
);
alter table daily_completions enable row level security;
create policy "Users manage own daily_completions" on daily_completions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists idx_daily_completions_user_date on daily_completions(user_id, completion_date);

-- no_spend_days
create table if not exists no_spend_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  marked_date date not null,
  marked_at timestamptz default now(),
  unique(user_id, marked_date)
);
alter table no_spend_days enable row level security;
create policy "Users manage own no_spend_days" on no_spend_days for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- category_mastery
create table if not exists category_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories not null,
  level integer default 1,
  xp integer default 0,
  current_streak_weeks integer default 0,
  longest_streak_weeks integer default 0,
  unique(user_id, category_id)
);
alter table category_mastery enable row level security;
create policy "Users manage own category_mastery" on category_mastery for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- weekly_insights (Sunday cards)
create table if not exists weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  insight_key text not null,
  insight_body jsonb not null,
  seen boolean default false,
  generated_at timestamptz default now(),
  unique(user_id, week_start)
);
alter table weekly_insights enable row level security;
create policy "Users manage own weekly_insights" on weekly_insights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- extend user_progress
alter table user_progress
  add column if not exists active_plant_species text default 'sprout',
  add column if not exists active_plant_planted_at timestamptz default now();

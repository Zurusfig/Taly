create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  xp integer not null default 0,
  last_logged_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_progress enable row level security;

create policy "Users can manage own progress"
  on user_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

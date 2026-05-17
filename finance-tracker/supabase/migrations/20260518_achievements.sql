-- achievements
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, key)
);
alter table achievements enable row level security;
create policy "Users manage own achievements" on achievements for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists idx_achievements_user_id on achievements(user_id);

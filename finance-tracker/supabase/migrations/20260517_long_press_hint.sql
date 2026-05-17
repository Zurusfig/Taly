alter table user_progress
  add column if not exists long_press_hint_dismissed boolean default false;

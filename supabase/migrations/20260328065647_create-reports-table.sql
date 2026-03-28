create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

-- Only the reporter and admins can see reports
alter table reports enable row level security;
create policy "Users can insert their own reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

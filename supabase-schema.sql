create table if not exists public.planner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 3,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planner_profiles enable row level security;

create policy "planner_profiles_select_own"
on public.planner_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "planner_profiles_insert_own"
on public.planner_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "planner_profiles_update_own"
on public.planner_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "planner_profiles_delete_own"
on public.planner_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_planner_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planner_profiles_set_updated_at on public.planner_profiles;

create trigger planner_profiles_set_updated_at
before update on public.planner_profiles
for each row
execute function public.set_planner_profiles_updated_at();

create table if not exists public.planner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 3,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_social_profiles_username_format check (username ~ '^[a-z0-9_.-]{3,28}$')
);

create table if not exists public.planner_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_friendships_status_check check (status in ('pending', 'accepted', 'blocked')),
  constraint planner_friendships_not_self check (requester_id <> receiver_id)
);

create unique index if not exists planner_friendships_pair_unique
on public.planner_friendships (
  least(requester_id, receiver_id),
  greatest(requester_id, receiver_id)
);

create table if not exists public.planner_shared_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  visibility text not null,
  title text not null default '',
  summary text not null default '',
  image_url text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_shared_items_type_check check (item_type in ('mission', 'dino', 'timeline', 'goal')),
  constraint planner_shared_items_visibility_check check (visibility in ('friends', 'shared'))
);

create unique index if not exists planner_shared_items_owner_item_unique
on public.planner_shared_items (owner_id, item_type, item_id);

alter table public.planner_profiles enable row level security;
alter table public.planner_social_profiles enable row level security;
alter table public.planner_friendships enable row level security;
alter table public.planner_shared_items enable row level security;

drop policy if exists "planner_profiles_select_own" on public.planner_profiles;
drop policy if exists "planner_profiles_insert_own" on public.planner_profiles;
drop policy if exists "planner_profiles_update_own" on public.planner_profiles;
drop policy if exists "planner_profiles_delete_own" on public.planner_profiles;

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

drop policy if exists "planner_social_profiles_select_authenticated" on public.planner_social_profiles;
drop policy if exists "planner_social_profiles_insert_own" on public.planner_social_profiles;
drop policy if exists "planner_social_profiles_update_own" on public.planner_social_profiles;
drop policy if exists "planner_social_profiles_delete_own" on public.planner_social_profiles;

create policy "planner_social_profiles_select_authenticated"
on public.planner_social_profiles
for select
to authenticated
using (true);

create policy "planner_social_profiles_insert_own"
on public.planner_social_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "planner_social_profiles_update_own"
on public.planner_social_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "planner_social_profiles_delete_own"
on public.planner_social_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "planner_friendships_select_participant" on public.planner_friendships;
drop policy if exists "planner_friendships_insert_requester" on public.planner_friendships;
drop policy if exists "planner_friendships_update_participant" on public.planner_friendships;
drop policy if exists "planner_friendships_delete_participant" on public.planner_friendships;

create policy "planner_friendships_select_participant"
on public.planner_friendships
for select
to authenticated
using ((select auth.uid()) = requester_id or (select auth.uid()) = receiver_id);

create policy "planner_friendships_insert_requester"
on public.planner_friendships
for insert
to authenticated
with check ((select auth.uid()) = requester_id);

create policy "planner_friendships_update_participant"
on public.planner_friendships
for update
to authenticated
using ((select auth.uid()) = receiver_id)
with check ((select auth.uid()) = receiver_id);

create policy "planner_friendships_delete_participant"
on public.planner_friendships
for delete
to authenticated
using ((select auth.uid()) = requester_id or (select auth.uid()) = receiver_id);

drop policy if exists "planner_shared_items_select_allowed" on public.planner_shared_items;
drop policy if exists "planner_shared_items_insert_own" on public.planner_shared_items;
drop policy if exists "planner_shared_items_update_own" on public.planner_shared_items;
drop policy if exists "planner_shared_items_delete_own" on public.planner_shared_items;

create policy "planner_shared_items_select_allowed"
on public.planner_shared_items
for select
to authenticated
using (
  (select auth.uid()) = owner_id
  or visibility = 'shared'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from public.planner_friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = owner_id and f.receiver_id = (select auth.uid()))
          or (f.receiver_id = owner_id and f.requester_id = (select auth.uid()))
        )
    )
  )
);

create policy "planner_shared_items_insert_own"
on public.planner_shared_items
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "planner_shared_items_update_own"
on public.planner_shared_items
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "planner_shared_items_delete_own"
on public.planner_shared_items
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.set_planner_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planner_profiles_set_updated_at on public.planner_profiles;
drop trigger if exists planner_social_profiles_set_updated_at on public.planner_social_profiles;
drop trigger if exists planner_friendships_set_updated_at on public.planner_friendships;
drop trigger if exists planner_shared_items_set_updated_at on public.planner_shared_items;

create trigger planner_profiles_set_updated_at
before update on public.planner_profiles
for each row
execute function public.set_planner_updated_at();

create trigger planner_social_profiles_set_updated_at
before update on public.planner_social_profiles
for each row
execute function public.set_planner_updated_at();

create trigger planner_friendships_set_updated_at
before update on public.planner_friendships
for each row
execute function public.set_planner_updated_at();

create trigger planner_shared_items_set_updated_at
before update on public.planner_shared_items
for each row
execute function public.set_planner_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_friendships'
  ) then
    alter publication supabase_realtime add table public.planner_friendships;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_shared_items'
  ) then
    alter publication supabase_realtime add table public.planner_shared_items;
  end if;
end $$;

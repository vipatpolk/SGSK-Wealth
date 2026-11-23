-- Dedicated private schema for internal auth triggers (not exposed via Data API)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- 1. User Profiles (1:1 with auth.users; authorization columns are read-only to clients)
create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'owner')),
  can_view_cloud_portfolio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. User Settings (1:1 with auth.users; editable by owning user)
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'THB' check (currency in ('THB', 'USD')),
  language text not null default 'en' check (language in ('en', 'th')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  privacy_mode boolean not null default false,
  target_allocations jsonb not null default '{}'::jsonb,
  rebalance_targets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Least-privilege table & column grants
revoke all on public.user_profiles from public, anon, authenticated;
grant select on public.user_profiles to authenticated;
grant update (display_name, avatar_url, updated_at) on public.user_profiles to authenticated;

revoke all on public.user_settings from public, anon, authenticated;
grant select, insert, update on public.user_settings to authenticated;

-- Enable Row-Level Security
alter table public.user_profiles enable row level security;
alter table public.user_settings enable row level security;

-- RLS Policies: user_profiles
create policy "Users can view own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile display fields"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- RLS Policies: user_settings
create policy "Users can view own settings"
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own settings"
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own settings"
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Shared updated_at trigger function
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function private.set_updated_at();

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function private.set_updated_at();

-- Auto-provision profile & settings on auth.users creation and email confirmation sync
create or replace function private.handle_auth_user_upsert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_is_verified_owner boolean := (v_email = 'vipatpolk@gmail.com' and new.email_confirmed_at is not null);
  v_display_name text := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(v_email, '@', 1)
  );
  v_avatar_url text := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
begin
  insert into public.user_profiles (id, email, display_name, avatar_url, role, can_view_cloud_portfolio)
  values (
    new.id,
    v_email,
    v_display_name,
    v_avatar_url,
    case when v_is_verified_owner then 'owner' else 'user' end,
    v_is_verified_owner
  )
  on conflict (id) do update
  set
    email = excluded.email,
    avatar_url = coalesce(public.user_profiles.avatar_url, excluded.avatar_url),
    role = case when v_is_verified_owner then 'owner' else public.user_profiles.role end,
    can_view_cloud_portfolio = case when v_is_verified_owner then true else public.user_profiles.can_view_cloud_portfolio end,
    updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_auth_user_upsert() from public, anon, authenticated;

create trigger on_auth_user_created_or_confirmed
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function private.handle_auth_user_upsert();

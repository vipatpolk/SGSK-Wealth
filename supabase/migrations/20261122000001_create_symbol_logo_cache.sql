-- 1. Provision public storage bucket for cached symbol and AMC logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'symbol-logos',
  'symbol-logos',
  true,
  524288,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policy: allow public read of cached logos; writes are performed by backend service_role
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read access for symbol logos'
  ) then
    create policy "Public read access for symbol logos"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'symbol-logos');
  end if;
end
$$;

-- 2. Symbol & AMC Logo Cache Registry
create table if not exists public.symbol_logo_cache (
  cache_key text primary key,
  symbol text not null,
  asset_type text not null,
  fund_name text,
  amc_id text,
  amc_name text,
  amc_domain text,
  storage_path text,
  content_type text not null default 'image/png',
  status text not null default 'resolved' check (status in ('resolved', 'fallback_svg')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_symbol_logo_cache_amc_id
  on public.symbol_logo_cache (amc_id)
  where amc_id is not null;

create index if not exists idx_symbol_logo_cache_expires_at
  on public.symbol_logo_cache (expires_at);

-- Least-privilege grants & RLS (backend writes via service_role; clients read-only)
revoke all on public.symbol_logo_cache from public, anon, authenticated;
grant select on public.symbol_logo_cache to anon, authenticated;

alter table public.symbol_logo_cache enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'symbol_logo_cache'
      and policyname = 'Anyone can read symbol logo cache metadata'
  ) then
    create policy "Anyone can read symbol logo cache metadata"
      on public.symbol_logo_cache
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'symbol_logo_cache_set_updated_at'
  ) then
    create trigger symbol_logo_cache_set_updated_at
      before update on public.symbol_logo_cache
      for each row execute function private.set_updated_at();
  end if;
end
$$;

# SGSK-Wealth Supabase & Data Boundary Architecture

> **Status:** Verified against `supabase/migrations/`
> **Decision:** Preserve existing Supabase project, schema, Auth triggers, Storage bucket, and RLS policies; keep Google Sheets for cloud portfolio sync and on-device storage for local/guest portfolios ([ADR-005](../decisions/ADR-005-target-architecture-and-strangler-roadmap.md)).

---

## 1. Existing Supabase Schema Inventory

Verified across the three versioned migrations in `supabase/migrations/`:
1. `20261119102204_create_user_profiles_and_settings.sql`
2. `20261121173901_create_symbol_logo_cache.sql`
3. `20261123065653_allow_system_theme_in_user_settings.sql`

### 1.1 Private Schema & Auth Triggers (`private`)
- `private` schema has all privileges revoked from `public`, `anon`, and `authenticated`.
- `private.set_updated_at()`: trigger function updating `updated_at = now()`.
- `private.handle_auth_user_upsert()`: `security definer` trigger on `auth.users` (`after insert or update of email, email_confirmed_at`) that auto-provisions `public.user_profiles` and `public.user_settings`, elevating `role = 'owner'` and `can_view_cloud_portfolio = true` only when the verified owner email has `email_confirmed_at is not null`.

### 1.2 Tables & Storage

| Object | Primary Key / Scope | Key Columns & Constraints | Grants & RLS |
| :--- | :--- | :--- | :--- |
| `public.user_profiles` | `id uuid` → `auth.users(id) on delete cascade` | `email`, `display_name`, `avatar_url`, `role in ('user','owner')`, `can_view_cloud_portfolio boolean` | `authenticated`: `select`, `update(display_name, avatar_url, updated_at)`. RLS: `auth.uid() = id`. |
| `public.user_settings` | `user_id uuid` → `auth.users(id) on delete cascade` | `currency in ('THB','USD')`, `language in ('en','th')`, `theme in ('dark','light','system')`, `privacy_mode`, `target_allocations jsonb`, `rebalance_targets jsonb` | `authenticated`: `select, insert, update`. RLS: `auth.uid() = user_id`. |
| `public.symbol_logo_cache` | `cache_key text` | `symbol`, `asset_type`, `fund_name`, `amc_id`, `amc_name`, `amc_domain`, `storage_path`, `content_type`, `status in ('resolved','fallback_svg')`, `expires_at` (30d TTL). Indexes on `amc_id`, `expires_at`. | `anon, authenticated`: `select` (`using (true)`). Backend writes via `service_role`. |
| `storage.buckets` (`symbol-logos`) | `id = 'symbol-logos'` | Public bucket, `524288` byte limit, MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`. | Public `select` policy for `anon, authenticated`; backend writes via `service_role`. |

---

## 2. Portfolio & Identity Data Boundaries

1. **Cloud Owner Portfolio (Read-Only Sync):**
   - Stored in Google Sheets (`google_spreadsheet_id` and `google_pvd_spreadsheet_id`) and fetched by the Rust backend via `TransactionSheetPort` (`GoogleSheetsAdapter`).
   - Protected by `RequirePortfolioAuthorizedUser` (checks Supabase JWT via JWKS/Auth + `user_profiles.can_view_cloud_portfolio` via `IdentityProfilePort`).
2. **Guest / Non-Owner Local Portfolio:**
   - Stored on-device via `KeyValueStorageAdapter` (`localStorage` on Web, `@capacitor/preferences` on Capacitor Mobile).
   - Computed client-side using `@sgsk-wealth/domain` (`local-fifo.utils.ts`) while live Price, FX, Mutual Fund/PVD NAV, and Factsheet lookups execute in the Rust backend.
3. **Backend Supabase Access Strategy:**
   - Never expose Supabase `service_role` keys to Web or Mobile clients (`npm run check:secrets` enforces this).
   - Backend `IdentityProfilePort` queries `user_profiles` using the caller's bearer token + publishable key so Postgres RLS enforces user-row isolation.
   - `IconService` writes to `symbol_logo_cache` and `symbol-logos` Storage bucket via `service_role` only.

---

## 3. Migration & Verification Rules

- All schema changes must be added as reviewed, sequential SQL files in `supabase/migrations/`.
- Test RLS isolation explicitly: authenticated user A must never read or mutate user B's `user_profiles` or `user_settings`, nor escalate `role` or `can_view_cloud_portfolio` (column-level grants forbid updating authorization columns).

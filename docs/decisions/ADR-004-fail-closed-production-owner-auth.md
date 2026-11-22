# ADR-004: Fail-Closed Production Owner Authorization

- **Status:** Accepted (Implemented in M1)
- **Scope:** `backend/src/utils/supabase_auth.rs`, `backend/src/ports.rs`, `backend/tests/test_security_and_auth.rs`

## Context
Owner cloud portfolio access combines email allowlisting (`AUTHORIZED_PORTFOLIO_EMAILS`), verified email status (`email_confirmed_at`), and database authorization flags from Supabase PostgREST `/rest/v1/user_profiles` (`role`, `can_view_cloud_portfolio`). Falling back to the static email allowlist when Supabase PostgREST is unreachable in production would allow temporary database/RLS revocations to be bypassed during an outage.

## Decision
1. In non-development environments (`!settings.is_development()`), if `IdentityProfilePort::fetch_profile_flags` fails or returns no row for the authenticated user, `SupabaseTokenVerifier::verify_token` MUST fail closed (`role = "user"`, `can_view_cloud_portfolio = false`).
2. Development environments (`ENVIRONMENT=development`) retain email-allowlist fallback when no profile row is available so local development without full Supabase PostgREST rows stays ergonomic.
3. All protected routes require `X-API-Key` validation (`ApiKeyAuth`) plus request-header origin/proxy enforcement (`direct_access_block_middleware`), and non-`X-App-Source` header spoofing cannot bypass JWT or owner checks (`test_complete_route_authorization_matrix_and_fail_closed_prod`).

## Consequences
- Production owner endpoints never grant cloud portfolio access if Supabase PostgREST verification fails or returns `can_view_cloud_portfolio = false`.
- `Settings::validate_production_security()` rejects weak keys, placeholder spreadsheet IDs, empty `SUPABASE_URL`, or empty `AUTHORIZED_PORTFOLIO_EMAILS` at backend startup in `production`.

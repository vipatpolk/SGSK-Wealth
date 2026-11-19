import hashlib
import logging
from typing import Any, cast

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from config.settings import Settings, get_settings
from utils.cache import singleflight, ttl_cache
from utils.http_client import get_http_client

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)
ALLOWED_ASYMMETRIC_ALGS: set[str] = {"ES256", "RS256", "EdDSA"}


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    role: str = "user"
    providers: list[str] = []
    email_verified: bool = False
    can_view_cloud_portfolio: bool = False


class SupabaseTokenVerifier:
    """Verifies Supabase Auth Bearer JWTs via JWKS, HS256 secret, or Auth API fallback."""

    async def _fetch_jwks_set(self, jwks_url: str, force_refresh: bool = False) -> jwt.PyJWKSet:
        cache_key = f"supabase_jwks::{jwks_url}"
        if not force_refresh:
            cached = ttl_cache.get(cache_key)
            if cached is not None:
                return cast(jwt.PyJWKSet, cached)

        async def _load() -> jwt.PyJWKSet:
            if not force_refresh:
                inner = ttl_cache.get(cache_key)
                if inner is not None:
                    return cast(jwt.PyJWKSet, inner)
            res = await get_http_client().get(jwks_url, timeout=5.0)
            res.raise_for_status()
            data = res.json()
            key_set = jwt.PyJWKSet.from_dict(data)
            ttl_cache.set(cache_key, key_set, ttl=600.0)
            return key_set

        return await singleflight.execute(f"jwks_fetch::{jwks_url}::{force_refresh}", _load)

    async def _decode_with_jwks(self, token: str, alg: str, settings: Settings) -> dict[str, Any]:
        jwks_url = settings.resolved_supabase_jwks_url
        if not jwks_url:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supabase JWKS URL is not configured",
            )

        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        jwk_set = await self._fetch_jwks_set(jwks_url, force_refresh=False)

        signing_key = self._find_key_in_set(jwk_set, kid)
        if signing_key is None:
            jwk_set = await self._fetch_jwks_set(jwks_url, force_refresh=True)
            signing_key = self._find_key_in_set(jwk_set, kid)

        if signing_key is None:
            raise jwt.InvalidTokenError("Signing key not found in JWKS")

        decode_kwargs: dict[str, Any] = {
            "algorithms": [alg],
            "audience": settings.supabase_jwt_audience,
            "leeway": 30,
        }
        if settings.resolved_supabase_issuer:
            decode_kwargs["issuer"] = settings.resolved_supabase_issuer

        payload = jwt.decode(token, signing_key.key, **decode_kwargs)
        return cast(dict[str, Any], payload)

    @staticmethod
    def _find_key_in_set(jwk_set: jwt.PyJWKSet, kid: Any) -> jwt.PyJWK | None:
        if kid:
            for key in jwk_set.keys:
                if key.key_id == kid:
                    return key
            return None
        if len(jwk_set.keys) == 1:
            return jwk_set.keys[0]
        return None

    async def _verify_via_auth_api(self, token: str, settings: Settings) -> dict[str, Any]:
        base_url = settings.supabase_url.strip().rstrip("/")
        pub_key = settings.supabase_publishable_key.strip()
        if not base_url or not pub_key:
            raise jwt.InvalidTokenError("Cannot verify HS256 token without SUPABASE_JWT_SECRET or SUPABASE_PUBLISHABLE_KEY")

        token_digest = hashlib.sha256(token.encode()).hexdigest()
        cache_key = f"supabase_user_token::{token_digest}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(dict[str, Any], cached)

        res = await get_http_client().get(
            f"{base_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": pub_key,
            },
            timeout=5.0,
        )
        if res.status_code != 200:
            raise jwt.InvalidTokenError("Supabase Auth rejected token")

        user_data = cast(dict[str, Any], res.json())
        normalized: dict[str, Any] = {
            "sub": user_data.get("id", ""),
            "email": user_data.get("email", ""),
            "is_anonymous": bool(user_data.get("is_anonymous", False)),
            "app_metadata": user_data.get("app_metadata") or {},
            "email_confirmed_at": user_data.get("email_confirmed_at"),
        }
        ttl_cache.set(cache_key, normalized, ttl=60.0)
        return normalized

    async def _fetch_profile_flags(self, user_id: str, token: str, settings: Settings) -> tuple[str, bool] | None:
        base_url = settings.supabase_url.strip().rstrip("/")
        pub_key = settings.supabase_publishable_key.strip()
        if not base_url or not pub_key or not user_id:
            return None

        cache_key = f"supabase_profile_flags::{user_id}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(tuple[str, bool], cached)

        try:
            res = await get_http_client().get(
                f"{base_url}/rest/v1/user_profiles",
                params={"select": "role,can_view_cloud_portfolio", "id": f"eq.{user_id}"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": pub_key,
                },
                timeout=5.0,
            )
            if res.status_code == 200:
                rows = res.json()
                if isinstance(rows, list) and len(rows) > 0:
                    row = rows[0]
                    flags = (
                        str(row.get("role") or "user"),
                        bool(row.get("can_view_cloud_portfolio", False)),
                    )
                    ttl_cache.set(cache_key, flags, ttl=60.0)
                    return flags
        except Exception:
            return None
        return None

    async def verify_token(self, token: str, settings: Settings | None = None) -> AuthenticatedUser:
        cfg = settings or get_settings()
        claims: dict[str, Any]
        try:
            header = jwt.get_unverified_header(token)
            alg = str(header.get("alg") or "")
            if alg in ALLOWED_ASYMMETRIC_ALGS:
                claims = await self._decode_with_jwks(token, alg, cfg)
            elif alg == "HS256":
                if cfg.supabase_jwt_secret.strip():
                    decode_kwargs: dict[str, Any] = {
                        "algorithms": ["HS256"],
                        "audience": cfg.supabase_jwt_audience,
                        "leeway": 30,
                    }
                    if cfg.resolved_supabase_issuer:
                        decode_kwargs["issuer"] = cfg.resolved_supabase_issuer
                    claims = cast(dict[str, Any], jwt.decode(token, cfg.supabase_jwt_secret.strip(), **decode_kwargs))
                else:
                    claims = await self._verify_via_auth_api(token, cfg)
            else:
                raise jwt.InvalidTokenError(f"Unsupported JWT algorithm: {alg}")
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("Supabase JWT verification failed (%s): %s", type(exc).__name__, exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

        if bool(claims.get("is_anonymous", False)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Anonymous sessions are not authorized",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = str(claims.get("sub") or "").strip()
        email = str(claims.get("email") or "").strip().lower()
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or incomplete authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        app_meta = claims.get("app_metadata")
        providers: list[str] = []
        if isinstance(app_meta, dict):
            raw_providers = app_meta.get("providers")
            if isinstance(raw_providers, list):
                providers = [str(p) for p in raw_providers if p]
            elif app_meta.get("provider"):
                providers = [str(app_meta.get("provider"))]

        allowed_emails = {e.strip().lower() for e in cfg.authorized_portfolio_emails if e.strip()}
        is_allowlisted_email = email in allowed_emails

        email_confirmed = True
        if "email_confirmed_at" in claims:
            email_confirmed = claims.get("email_confirmed_at") is not None

        profile_flags = await self._fetch_profile_flags(user_id, token, cfg)
        role = "owner" if is_allowlisted_email else "user"
        can_view_cloud = is_allowlisted_email and email_confirmed

        if profile_flags is not None:
            db_role, db_can_view = profile_flags
            role = db_role
            can_view_cloud = is_allowlisted_email and email_confirmed and db_can_view

        return AuthenticatedUser(
            user_id=user_id,
            email=email,
            role=role,
            providers=providers,
            email_verified=email_confirmed,
            can_view_cloud_portfolio=can_view_cloud,
        )


supabase_token_verifier = SupabaseTokenVerifier()


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> AuthenticatedUser | None:
    if credentials is None or not credentials.credentials:
        return None
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await supabase_token_verifier.verify_token(credentials.credentials)


async def require_authenticated_user(
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
) -> AuthenticatedUser:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def require_portfolio_authorized_user(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
) -> AuthenticatedUser:
    if not current_user.can_view_cloud_portfolio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portfolio access is restricted to authorized accounts",
        )
    return current_user

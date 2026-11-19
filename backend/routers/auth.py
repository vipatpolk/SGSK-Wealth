from fastapi import APIRouter, Depends
from pydantic import BaseModel

from utils.auth import verify_api_key
from utils.supabase_auth import AuthenticatedUser, get_optional_current_user

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(verify_api_key)])


class AuthMeResponse(BaseModel):
    authenticated: bool
    userId: str | None = None
    email: str | None = None
    role: str = "guest"
    providers: list[str] = []
    canViewCloudPortfolio: bool = False
    portfolioSource: str = "local"


@router.get("/me", response_model=AuthMeResponse)
async def get_auth_me(
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
) -> AuthMeResponse:
    if current_user is None:
        return AuthMeResponse(
            authenticated=False,
            userId=None,
            email=None,
            role="guest",
            providers=[],
            canViewCloudPortfolio=False,
            portfolioSource="local",
        )

    return AuthMeResponse(
        authenticated=True,
        userId=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
        providers=current_user.providers,
        canViewCloudPortfolio=current_user.can_view_cloud_portfolio,
        portfolioSource="google_sheets" if current_user.can_view_cloud_portfolio else "local",
    )

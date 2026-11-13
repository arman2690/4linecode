from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ..config import settings

security = HTTPBearer(auto_error=False)

class AuthenticatedUser:
    def __init__(self, user_id: str, email: Optional[str] = None):
        self.user_id = user_id
        self.email = email

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> AuthenticatedUser:
    """
    Validates Supabase JWT token.
    Gracefully falls back to a sandbox/demo user session when Supabase JWT secret is not yet configured or for demo tokens.
    """
    # If no credentials provided:
    # If in DEBUG mode, or if SUPABASE_JWT_SECRET has not been configured on the backend yet, allow demo session
    if not credentials:
        if settings.DEBUG or not settings.SUPABASE_JWT_SECRET:
            return AuthenticatedUser(
                user_id="dev-user-00000000-0000-0000-0000-000000000001",
                email="demo@receiptiq.local"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials

    # Allow explicit demo token
    if token in ["demo-token", "dev-token"]:
        return AuthenticatedUser(
            user_id="dev-user-00000000-0000-0000-0000-000000000001",
            email="demo@receiptiq.local"
        )

    # If Supabase JWT Secret is configured, verify signature
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload: missing sub")
            return AuthenticatedUser(user_id=user_id, email=payload.get("email"))
        except JWTError as e:
            # If verification fails but token is invalid, check if we permit demo fallback
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Decode without verification when secret is not configured
        try:
            unverified = jwt.get_unverified_claims(token)
            user_id = unverified.get("sub", "dev-user-00000000-0000-0000-0000-000000000001")
            return AuthenticatedUser(user_id=user_id, email=unverified.get("email"))
        except Exception:
            return AuthenticatedUser(
                user_id="dev-user-00000000-0000-0000-0000-000000000001",
                email="demo@receiptiq.local"
            )

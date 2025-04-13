from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.database.database import get_db
from app.database.crud_user import create_user
from app.schema.user import Token, UserCreate
from app.auth.security import create_access_token, verify_password, oauth2_scheme
from app.config.config import settings
from app.utils.redis_service import RedisService, get_redis_service
from app.utils.user_utils import get_user_by_username
import jwt

router = APIRouter()


@router.post("/login", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    redis_service: RedisService = Depends(get_redis_service),
):
    user = await get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Set cookie via header - the client will automatically handle this
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    await create_user(db, user)
    return {"username": user.username}


@router.post("/logout")
async def logout(
        response: Response,
        token: str = Depends(oauth2_scheme),
        redis_service: RedisService = Depends(get_redis_service),
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        if jti:
            redis_service.set(
                f"denylist:{jti}",
                "denylisted",
                expiry=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        # If token is already expired, we just need to clear the cookie
        pass

    response.set_cookie(
        key="token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        expires=0,
        path="/",
    )
    return {"message": "Logout successful"}



# Validate route token
@router.get("/validate-token")
async def validate_token(
    token: str = Depends(oauth2_scheme),
    redis_service: RedisService = Depends(get_redis_service),
):
    token_data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    # check if token is denylisted
    jti = token_data.get("jti")
    if redis_service.get(f"denylist:{jti}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked"
        )
    return {"message": "Token is valid"}

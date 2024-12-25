from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import verify_access_token
from app.database.database import get_db
from app.database.crud import get_user_by_username
from app.schema.schema import UserBase


async def get_current_user(
        token: str = Depends(verify_access_token),
        db: AsyncSession = Depends(get_db)
) -> UserBase:
    username = token.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = await get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


async def get_current_active_user(
        current_user: UserBase = Depends(get_current_user)
) -> UserBase:
    return current_user

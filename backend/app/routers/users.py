from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schema.user import UserBase

router = APIRouter()


@router.get("/users/me", response_model=UserBase)
async def read_users_me(current_user: UserBase = Depends(get_current_user)):
    return current_user

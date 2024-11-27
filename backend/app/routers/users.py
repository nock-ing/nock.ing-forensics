from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.main import get_current_active_user
from app.schema.schema import UserBase
from app.database.crud import get_user_by_username

router = APIRouter()

@router.get("/users/me", response_model=UserBase)
async def read_users_me(current_user: UserBase = Depends(get_current_active_user)):
    return current_user

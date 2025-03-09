from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.users import Users


async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(Users).where(Users.username.__eq__(username)))

    if result is None:
        return None
    user = result.scalars().first()
    return user
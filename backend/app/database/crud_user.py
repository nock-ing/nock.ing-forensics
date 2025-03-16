from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.security import get_password_hash
from app.models.users import Users
from app.schema.user import UserCreate

async def create_user(db: AsyncSession, user: UserCreate):
    hashed_password = get_password_hash(user.password)

    db_user = Users(
        username=user.username,
        email=user.email,
        is_active=True,
        hashed_password=hashed_password,
    )

    db.add(db_user)

    await db.commit()
    await db.refresh(db_user)
    return db_user
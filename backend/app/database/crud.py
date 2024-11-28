from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth.security import get_password_hash
from app.models.models import User
from app.schema.schema import UserCreate


async def get_user_by_username(db: AsyncSession, username: str):
    # Execute the query with `AsyncSession.execute`
    result = await db.execute(select(User).where(User.username.__eq__(username)))
    return result.scalars().first()


async def create_user(db: AsyncSession, user: UserCreate):
    # Hash the user's password
    hashed_password = get_password_hash(user.password)

    # Create a new User instance
    db_user = User(
        username=user.username,
        email=user.email,
        is_active=True,
        hashed_password=hashed_password,
    )

    # Add the user to the session
    db.add(db_user)

    # Commit the transaction to save the user to the database
    await db.commit()

    # Refresh the instance to get updated attributes (e.g., ID)
    await db.refresh(db_user)

    return db_user

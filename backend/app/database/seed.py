import os

from app.auth.security import get_password_hash
from app.models.models import User
from dotenv import load_dotenv

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

load_dotenv()


async def seed_database(session: AsyncSession):
    # Execute the query with `session.execute`
    result = await session.execute(select(User).limit(1))
    existing_users = result.scalars().first()

    if not existing_users:
        hashed_password = get_password_hash(os.getenv("DEFAULT_PASSWORD"))
        default_user = User(
            username="alsjourney",
            email="alsjourneydev@hotmail.com",
            hashed_password=hashed_password,
        )
        session.add(default_user)
        await session.commit()
        print("Database seeded with default data")
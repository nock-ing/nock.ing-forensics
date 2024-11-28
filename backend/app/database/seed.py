import os

from app.auth.security import get_password_hash
from app.models.models import User
from sqlalchemy.future import select
from dotenv import load_dotenv

load_dotenv()


async def seed_database(conn, session):
    result = await conn.execute(select(User).limit(1))
    existing_users = result.scalars().first()

    if not existing_users:
        # Seed default data
        hashed_password = get_password_hash(os.getenv("DEFAULT_PASSWORD"))
        default_user = User(
            username="alsjourney",
            email="alsjourneydev@hotmail.com",
            hashed_password=hashed_password,
            is_active=True
        )
        session.add(default_user)
        await session.commit()
        print("Database seeded with default data")
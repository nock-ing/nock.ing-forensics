from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.seed import seed_database
from app.models.models import Base
from app.database.database import engine
from app.routers import auth, users
from sqlalchemy.ext.asyncio import AsyncSession

# Define the lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform startup actions (e.g., initialize the database)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            await seed_database(conn, session)
    yield
    # Perform shutdown actions (e.g., close the database connection)
    await engine.dispose()
    print("Database connection closed")

# Create the FastAPI instance with the lifespan context
app = FastAPI(lifespan=lifespan)

# Include your routers
app.include_router(auth.router)
app.include_router(users.router)

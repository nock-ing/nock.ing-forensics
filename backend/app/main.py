from fastapi import FastAPI
from app.models.models import Base
from app.database.database import engine
from app.routers import auth, users

# Initialize database before creating the app instance
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Create the FastAPI instance
app = FastAPI()

# Call the init_db function before running the app
import asyncio
asyncio.run(init_db())  # Ensure the DB is initialized before serving requests

# Include your routers
app.include_router(auth.router)
app.include_router(users.router)

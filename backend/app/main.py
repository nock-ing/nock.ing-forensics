from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.seed import seed_database
from app.models.models import SQLModel
from app.database.database import engine, get_db
from app.routers import auth, users, rpc_node
from sqlalchemy.ext.asyncio import AsyncSession
import redis

# Define the lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform startup actions (e.g., initialize the database)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.commit()

    async with AsyncSession(engine) as session:
        await seed_database(session)
    yield
    # Perform shutdown actions (e.g., close the database connection)
    await engine.dispose()
    print("Database connection closed")

# Create the FastAPI instance with the lifespan context
app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rpc_node.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.seed import seed_users, seed_blocks, seed_wallets, seed_tx, seed_investigations
from app.models.users import SQLModel
from app.database.database import engine, get_db
from app.routers import auth, redis, users, rpc_node, investigation
from sqlalchemy.ext.asyncio import AsyncSession

# Define the lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform startup actions (e.g., initialize the database)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.commit()

    async with AsyncSession(engine) as session:
        await seed_users(session)
        await seed_blocks(session)
        await seed_wallets(session)
        await seed_tx(session)
        await seed_investigations(session)
    yield
    # Perform shutdown actions (e.g., close the database connection)
    await engine.dispose()
    print("Database connection closed")

# Create the FastAPI instance with the lifespan context
app = FastAPI(lifespan=lifespan)

app.include_router(auth.router, tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(rpc_node.router, tags=["rpc_node"])
app.include_router(redis.router, tags=["redis"])
app.include_router(investigation.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.config.config import settings

# Create the async engine for PostgreSQL
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Create a session maker using the async engine
SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
)

# Dependency to get the database session
async def get_db():
    async with SessionLocal() as session:
        yield session

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)

SessionLocal = async_sessionmaker(
    autoflush=False, autocommit=False, bind=engine, class_=AsyncSession
)


# Dependency to get the database session
async def get_db():
    async with SessionLocal() as session:
        yield session

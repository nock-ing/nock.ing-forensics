import asyncio
from app.database.database import SessionLocal
from app.database.seed import (
    seed_users,
    seed_blocks,
    seed_wallets,
    seed_tx,
    seed_investigations,
)

async def run_seed():
    async with SessionLocal() as session:
        # Run all seed functions
        await seed_users(session)
        await seed_blocks(session)
        await seed_wallets(session)
        await seed_tx(session)
        await seed_investigations(session)
        print("All seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_seed()) 
import os
from datetime import datetime

from app.auth.security import get_password_hash
from app.models.transactions import Transactions
from app.models.blocks import Blocks
from app.models.wallets import Wallets
from app.models.users import Users
from app.models.investigations import Investigations
from dotenv import load_dotenv

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

load_dotenv()


async def seed_users(session: AsyncSession):
    result = await session.execute(select(Users).limit(1))
    existing_users = result.scalars().first()

    if not existing_users:
        hashed_password = get_password_hash(os.getenv("DEFAULT_PASSWORD"))
        default_user = Users(
            username="alsjourney",
            email="alsjourneydev@hotmail.com",
            hashed_password=hashed_password,
        )
        session.add(default_user)
        await session.commit()
        print("Database seeded with default data")


async def seed_blocks(session: AsyncSession):
    result = await session.execute(select(Blocks).limit(1))
    existing_blocks = result.scalars().first()

    if not existing_blocks:
        default_block = Blocks(
            id=1, block_hash="0x1234567890", timestamp=1630444800, height=1, size=100
        )
        session.add(default_block)
        await session.commit()
        print("Block Seed Successful")


async def seed_wallets(session: AsyncSession):
    result = await session.execute(select(Wallets).limit(1))
    existing_wallets = result.scalars().first()

    if not existing_wallets:
        default_wallet = Wallets(
            id=1,
            user_id=1,
            wallet_name="bad actor 1",
            wallet_address="0x1234567890",
            wallet_type="taproot",
            created_at=datetime.timestamp(datetime.now()),
            balance=100,
        )
        session.add(default_wallet)
        await session.commit()
        print("Wallet Seed Successful")


async def seed_tx(session: AsyncSession):
    result = await session.execute(select(Transactions).limit(1))
    existing_transactions = result.scalars().first()

    if not existing_transactions:
        default_tx = Transactions(
            id=1,
            wallet_id=1,
            user_id=1,
            block_id=1,
            transaction_hash="0x1234567890",
            timestamp=1630444800,
            total_input=100,
            total_output=99,
            fee=1,
            suspicious_illegal_activity=False,
        )
        session.add(default_tx)
        await session.commit()
        print("Tx Seed Successful")


async def seed_investigations(session: AsyncSession):
    result = await session.execute(select(Investigations).limit(1))
    existing_investigations = result.scalars().first()

    if not existing_investigations:
        default_investigation = Investigations(
            id=0, user_id=1, wallet_id=1, transaction_id=1, status=1
        )
        session.add(default_investigation)
        await session.commit()
        print("Investigation Seed Successful")

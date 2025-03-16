from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.schema.wallet import Wallet
from app.models.wallets import Wallets


async def create_wallet(db: AsyncSession, wallet: Wallet):
    db_wallet = Wallet(
        wallet_address = wallet.address,
        owner = wallet.owner,
        created_at = wallet.created_at,
        suspicious_activity = wallet.suspicious_activity
    )

    db.add(db_wallet)
    await db.commit()
    await db.refresh(db_wallet)

    return db_wallet

async def check_wallet_exists(db: AsyncSession, wallet_id: int):
    result = await db.execute(select(Wallets).filter_by(id=wallet_id))
    wallet = result.scalars().first()
    return wallet is not None
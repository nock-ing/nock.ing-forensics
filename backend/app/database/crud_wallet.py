from sqlalchemy.ext.asyncio import AsyncSession

from app.schema.wallet import Wallet


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
from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.transaction import Transaction

async def create_tx(db: AsyncSession, tx: Transaction):
    db_tx = Transaction(
        transaction_hash = tx.transaction_hash,
        timestamp = tx.timestamp,
        total_input = tx.total_input,
        total_output = tx.total_output,
        fee = tx.fee,
        suspicious_illegal_activity = tx.suspicious_illegal_activity
    )

    db.add(db_tx)
    await db.commit()
    await db.refresh(db_tx)

    return db_tx
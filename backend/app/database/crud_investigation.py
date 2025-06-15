from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.crud_transaction import check_transaction_exists, create_transaction_with_dependencies
from app.database.crud_wallet import check_wallet_exists
from app.models.investigations import Investigations
from app.schema.investigation import Investigation
from app.schema.transaction import Transaction, TransactionUpdate
from app.models.transactions import Transactions
from typing import List, Optional


async def get_investigations(db: AsyncSession) -> Investigations:
    result = await db.execute(select(Investigations))
    investigations = result.scalars().all()
    return investigations


async def get_investigation(db: AsyncSession, investigation_id: int) -> Investigations:
    result = await db.execute(select(Investigations).filter_by(id=investigation_id))
    investigation = result.scalars().first()
    return investigation


async def create_investigation_crud(
    db: AsyncSession, investigation: Investigation
) -> int:
    db_investigation = Investigations(
        user_id=investigation.user_id,
        wallet_id=investigation.wallet_id,
        transaction_id=investigation.transaction_id,
        status=investigation.status,
        created_at=investigation.created_at,
    )

    tx_exists = await check_tx_exists(db, investigation.transaction_id)
    if not tx_exists:
        raise Exception("Transaction does not exist")

    wallet_exists = await check_wallet_exists(db, investigation.wallet_id)
    if not wallet_exists:
        raise Exception("Wallet does not exist")

    result = await db.execute(
        select(Investigations).filter_by(transaction_id=investigation.transaction_id)
    )
    existing_investigation = result.scalars().first()
    if existing_investigation:
        raise Exception("Investigation already exists for this transaction")

    db.add(db_investigation)

    await db.commit()

    await db.refresh(db_investigation)

    return db_investigation.id


async def delete_investigation_crud(db: AsyncSession, investigation_id: int) -> None:
    db_investigation = await db.get(Investigations, investigation_id)
    if not db_investigation:
        raise Exception("Investigation not found")

    await db.delete(db_investigation)
    await db.commit()


async def delete_transaction(db: AsyncSession, transaction_id: int) -> bool:
    """Delete a transaction"""
    result = await db.execute(select(Transactions).where(Transactions.id == transaction_id))
    db_transaction = result.scalars().first()
    
    if not db_transaction:
        return False
    
    await db.delete(db_transaction)
    await db.commit()
    return True


# Backward compatibility - keep the old function name
async def check_tx_exists(db: AsyncSession, tx_id: int) -> bool:
    """Check if a transaction exists (backward compatibility)"""
    return await check_transaction_exists(db, tx_id)


# Legacy function for backward compatibility
async def create_tx(db: AsyncSession, tx: Transaction) -> Transactions:
    """Create a new transaction (backward compatibility)"""
    return await create_transaction_with_dependencies(db, tx)
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.transaction import Transaction, TransactionUpdate
from app.models.transactions import Transactions
from typing import List, Optional


async def create_transaction(db: AsyncSession, transaction: Transaction) -> Transactions:
    """Create a new transaction"""
    db_transaction = Transactions(
        wallet_id=transaction.wallet_id,
        user_id=transaction.user_id,
        block_id=transaction.block_id,
        transaction_hash=transaction.transaction_hash,
        timestamp=transaction.timestamp,
        total_input=transaction.total_input,
        total_output=transaction.total_output,
        fee=transaction.fee,
        suspicious_illegal_activity=transaction.suspicious_illegal_activity,
    )

    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def get_transaction_by_id(db: AsyncSession, transaction_id: str) -> Optional[Transactions]:
    """Get a transaction by its ID"""
    result = await db.execute(select(Transactions).where(Transactions.id == transaction_id))
    return result.scalars().first()


async def get_transaction_by_hash(db: AsyncSession, transaction_hash: str) -> Optional[Transactions]:
    """Get a transaction by its hash"""
    result = await db.execute(select(Transactions).where(Transactions.transaction_hash == transaction_hash))
    return result.scalars().first()


async def get_transactions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Transactions]:
    """Get all transactions with pagination"""
    result = await db.execute(select(Transactions).offset(skip).limit(limit))
    return result.scalars().all()


async def get_transactions_by_user(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Transactions]:
    """Get all transactions for a specific user"""
    result = await db.execute(
        select(Transactions)
        .where(Transactions.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_transactions_by_wallet(db: AsyncSession, wallet_id: int, skip: int = 0, limit: int = 100) -> List[Transactions]:
    """Get all transactions for a specific wallet"""
    result = await db.execute(
        select(Transactions)
        .where(Transactions.wallet_id == wallet_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_suspicious_transactions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Transactions]:
    """Get all suspicious transactions"""
    result = await db.execute(
        select(Transactions)
        .where(Transactions.suspicious_illegal_activity == True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def update_transaction(db: AsyncSession, transaction_id: str, transaction_update: TransactionUpdate) -> Optional[Transactions]:
    """Update a transaction"""
    result = await db.execute(select(Transactions).where(Transactions.id == transaction_id))
    db_transaction = result.scalars().first()
    
    if not db_transaction:
        return None
    
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def delete_transaction(db: AsyncSession, transaction_id: str) -> bool:
    """Delete a transaction and its related investigations"""
    # First check if transaction exists
    result = await db.execute(select(Transactions).where(Transactions.id == transaction_id))
    db_transaction = result.scalars().first()
    
    if not db_transaction:
        return False
    
    # Delete related investigations first
    from app.models.investigations import Investigations
    investigations_result = await db.execute(
        select(Investigations).where(Investigations.transaction_id == transaction_id)
    )
    investigations = investigations_result.scalars().all()
    
    for investigation in investigations:
        await db.delete(investigation)
    
    # Now delete the transaction
    await db.delete(db_transaction)
    await db.commit()
    return True


async def check_transaction_exists(db: AsyncSession, transaction_id: str) -> bool:
    """Check if a transaction exists"""
    result = await db.execute(select(Transactions).where(Transactions.id == transaction_id))
    return result.scalars().first() is not None


async def check_transaction_hash_exists(db: AsyncSession, transaction_hash: str) -> bool:
    """Check if a transaction with given hash exists"""
    result = await db.execute(select(Transactions).where(Transactions.transaction_hash == transaction_hash))
    return result.scalars().first() is not None
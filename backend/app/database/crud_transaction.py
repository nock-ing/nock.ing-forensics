from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.transaction import Transaction, TransactionUpdate
from app.models.transactions import Transactions
from app.models.wallets import Wallets
from app.models.blocks import Blocks
from app.utils.wallet_types import identify_bitcoin_wallet_type
from typing import List, Optional
import time


async def create_transaction_with_dependencies(
    db: AsyncSession, 
    transaction: Transaction,
    wallet_address: str = None,
    wallet_name: str = None,
    block_hash: str = None,
    block_size: int = None
) -> Transactions:
    """Create a new transaction, creating wallet and block if they don't exist"""
    
    # 1. Handle wallet creation/lookup
    wallet_id = None
    
    # Always prioritize wallet_address if provided
    if wallet_address:
        # Check if wallet exists
        wallet_result = await db.execute(
            select(Wallets).where(Wallets.wallet_address == wallet_address)
        )
        existing_wallet = wallet_result.scalars().first()
        
        if existing_wallet:
            wallet_id = existing_wallet.id
        else:
            # Identify wallet type dynamically
            wallet_type_info = identify_bitcoin_wallet_type(wallet_address)
            wallet_type = wallet_type_info["type"].value
            
            # Create new wallet
            new_wallet = Wallets(
                user_id=transaction.user_id,
                wallet_name=wallet_name or f"Wallet_{wallet_address[:8]}",
                wallet_address=wallet_address,
                wallet_type=wallet_type,
                created_at=time.time(),
                balance=0.0,
                suspicious_illegal_activity=False,
            )
            db.add(new_wallet)
            await db.flush()  # Get the ID without committing
            wallet_id = new_wallet.id
    elif hasattr(transaction, 'wallet_id') and transaction.wallet_id:
        # Only use transaction.wallet_id if no wallet_address is provided
        wallet_id = transaction.wallet_id
    else:
        raise ValueError("Either wallet_address or transaction.wallet_id must be provided")
    
    # 2. Handle block creation/lookup
    block_id = None
    
    # Always prioritize block_hash if provided
    if block_hash:
        # Check if block exists
        block_result = await db.execute(
            select(Blocks).where(Blocks.block_hash == block_hash)
        )
        existing_block = block_result.scalars().first()
        
        if existing_block:
            block_id = existing_block.id
        else:
            # Create new block
            new_block = Blocks(
                block_hash=block_hash,
                timestamp=transaction.timestamp or int(time.time()),
                size=block_size or 1000,  # Default size if not provided
            )
            db.add(new_block)
            await db.flush()  # Get the ID without committing
            block_id = new_block.id
    elif hasattr(transaction, 'block_id') and transaction.block_id:
        # Only use transaction.block_id if no block_hash is provided
        block_id = transaction.block_id
    else:
        raise ValueError("Either block_hash or transaction.block_id must be provided")
    
    # 3. Validate transaction inputs and outputs
    total_input = getattr(transaction, 'total_input', 0)
    total_output = getattr(transaction, 'total_output', 0)
    
    if total_input == 0 and total_output == 0:
        print(f"Warning: Transaction {transaction.transaction_hash} has zero input and output values")
    
    # 4. Create the transaction
    db_transaction = Transactions(
        wallet_id=wallet_id,
        user_id=transaction.user_id,
        block_id=block_id,
        transaction_hash=transaction.transaction_hash,
        timestamp=transaction.timestamp,
        total_input=total_input,
        total_output=total_output,
        fee=getattr(transaction, 'fee', 0),
        suspicious_illegal_activity=getattr(transaction, 'suspicious_illegal_activity', False),
    )

    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def create_transaction_from_txid(
    db: AsyncSession,
    txid: str,
    user_id: int,
    mempool_api_call,  # Pass this function as dependency
    block_hash: str = None,
    block_size: int = None
) -> Transactions:
    """Create a transaction from a transaction ID, auto-creating wallet and block"""
    
    # Fetch transaction info from mempool API
    tx_info = await mempool_api_call(f"api/tx/{txid}")
    if not tx_info:
        raise ValueError(f"Transaction {txid} not found")
    
    # Extract wallet address
    scriptpubkey_address = tx_info["vin"][0]["prevout"]["scriptpubkey_address"]
    if not scriptpubkey_address:
        raise ValueError(f"No wallet address found for transaction {txid}")
    
    # Create Transaction object
    transaction = Transaction(
        user_id=user_id,
        transaction_hash=txid,
        timestamp=tx_info.get("status", {}).get("block_time", int(time.time())),
        total_input=sum(vin["prevout"]["value"] for vin in tx_info["vin"]),
        total_output=sum(vout["value"] for vout in tx_info["vout"]),
        fee=tx_info.get("fee", 0),
        suspicious_illegal_activity=False,
    )
    
    # Use the enhanced creation function
    return await create_transaction_with_dependencies(
        db=db,
        transaction=transaction,
        wallet_address=scriptpubkey_address,
        wallet_name=f"Wallet_{scriptpubkey_address[:8]}",
        block_hash=block_hash,
        block_size=block_size
    )


async def create_transaction(db: AsyncSession, transaction: Transaction) -> Transactions:
    """Create a new transaction (original function kept for compatibility)"""
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
        .where(Transactions.suspicious_illegal_activity)
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
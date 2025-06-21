from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database.database import get_db
from app.database import crud_transaction
from app.schema.transaction import Transaction, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: Transaction,
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    # Check if transaction hash already exists
    if await crud_transaction.check_transaction_hash_exists(db, transaction.transaction_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction with this hash already exists"
        )
    
    return await crud_transaction.create_transaction_with_dependencies(db, transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,  # Changed from str to int
    db: AsyncSession = Depends(get_db)
):
    """Get a transaction by ID"""
    transaction = await crud_transaction.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction


@router.get("/hash/{transaction_hash}", response_model=TransactionResponse)
async def get_transaction_by_hash(
    transaction_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a transaction by hash"""
    transaction = await crud_transaction.get_transaction_by_hash(db, transaction_hash)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions with pagination"""
    return await crud_transaction.get_transactions(db, skip=skip, limit=limit)


@router.get("/user/{user_id}", response_model=List[TransactionResponse])
async def get_user_transactions(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions for a specific user"""
    return await crud_transaction.get_transactions_by_user(db, user_id, skip=skip, limit=limit)


@router.get("/wallet/{wallet_id}", response_model=List[TransactionResponse])
async def get_wallet_transactions(
    wallet_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions for a specific wallet"""
    return await crud_transaction.get_transactions_by_wallet(db, wallet_id, skip=skip, limit=limit)


@router.get("/suspicious/", response_model=List[TransactionResponse])
async def get_suspicious_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all suspicious transactions"""
    return await crud_transaction.get_suspicious_transactions(db, skip=skip, limit=limit)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,  # Changed from str to int
    transaction_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    transaction = await crud_transaction.update_transaction(db, transaction_id, transaction_update)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,  # Changed from str to int
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    success = await crud_transaction.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
from pydantic import BaseModel
from typing import Optional


class TransactionBase(BaseModel):
    wallet_id: int
    user_id: int
    block_id: int
    transaction_hash: str
    timestamp: int
    total_input: float
    total_output: float
    fee: Optional[float] = 0.0
    suspicious_illegal_activity: Optional[bool] = False


class Transaction(TransactionBase):
    """Schema for creating a transaction"""
    pass


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    wallet_id: Optional[int] = None
    user_id: Optional[int] = None
    block_id: Optional[int] = None
    transaction_hash: Optional[str] = None
    timestamp: Optional[int] = None
    total_input: Optional[float] = None
    total_output: Optional[float] = None
    fee: Optional[float] = None
    suspicious_illegal_activity: Optional[bool] = None


class TransactionResponse(TransactionBase):
    """Schema for transaction responses"""
    id: int

    class Config:
        from_attributes = True
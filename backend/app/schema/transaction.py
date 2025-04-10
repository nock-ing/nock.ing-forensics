from typing import Optional

from sqlmodel import SQLModel


class Transaction(SQLModel):
    id: Optional[int] = None
    transaction_hash: str
    timestamp: int
    total_input: float
    total_output: float
    fee: float
    suspicious_illegal_activity: bool

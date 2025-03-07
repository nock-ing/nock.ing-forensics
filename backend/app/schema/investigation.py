from typing import Optional

from sqlmodel import SQLModel

class Investigation(SQLModel):
    user_id: int
    wallet_id: int
    transaction_id: int
    status: int
    created_at: Optional[float] = None
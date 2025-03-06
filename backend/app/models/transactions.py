from datetime import datetime

from sqlmodel import Field, SQLModel
from typing import Optional

class Transactions(SQLModel, table=True):
    id: int = Field(primary_key=True)
    wallet_id: int = Field(foreign_key="wallets.id")
    user_id: int = Field(foreign_key="users.id")
    block_id: int = Field(foreign_key="blocks.id")
    timestamp: int = Field(default=datetime.timestamp(datetime.now()))
    investigation_id: Optional[int] = Field(foreign_key="investigations.id")
    transaction_hash: str = Field(nullable=False)
    total_input: float = Field(nullable=False)
    total_output: float = Field(nullable=False)
    fee: Optional[float] = Field(default=0.0)
    suspicious_illegal_activity: Optional[bool] = Field(default=False)


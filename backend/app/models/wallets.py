from datetime import datetime

from sqlmodel import Field, SQLModel
from typing import Optional

class Wallets(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    wallet_name: str = Field(nullable=False)
    wallet_address: str = Field(nullable=False)
    investigation_id: Optional[int] = Field(foreign_key="investigations.id")
    wallet_type: str = Field(nullable=False)
    created_at: float = Field(default=datetime.timestamp(datetime.now()))
    balance: float = Field(nullable=False)
    suspicious_illegal_activity: Optional[bool] = Field(default=False)
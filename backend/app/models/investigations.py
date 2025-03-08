from datetime import datetime

from sqlmodel import Field, SQLModel, Relationship
from typing import Optional

from app.models.transactions import Transactions
from app.models.users import Users
from app.models.wallets import Wallets


class Investigations(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    wallet_id: int = Field(foreign_key="wallets.id")
    transaction_id: int = Field(foreign_key="transactions.id")
    status: int = Field(nullable=False)
    created_at: Optional[float] = Field(default=datetime.timestamp(datetime.now()))

    user: "Users" = Relationship(back_populates="investigations")
    wallet: "Wallets" = Relationship(back_populates="investigations")
    transaction: "Transactions" = Relationship(back_populates="investigations")

from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.investigations import Investigations
    from app.models.users import Users
    from app.models.transactions import Transactions


class Wallets(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    wallet_name: str = Field(nullable=False)
    wallet_address: str = Field(nullable=False)
    wallet_type: str = Field(nullable=False)
    created_at: float = Field(default=datetime.timestamp(datetime.now()))
    balance: float = Field(nullable=False)
    suspicious_illegal_activity: Optional[bool] = Field(default=False)

    user: "Users" = Relationship(back_populates="wallets")
    transactions: list["Transactions"] = Relationship(back_populates="wallet")
    investigations: list["Investigations"] = Relationship(back_populates="wallet")

from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.transactions import Transactions
    from app.models.wallets import Wallets
    from app.models.investigations import Investigations
    from app.models.wallet_monitoring import MonitoredAddress


class Users(SQLModel, table=True):
    id: int = Field(primary_key=True)
    username: str = Field(unique=True, index=True)
    email: Optional[str] = Field(unique=True, index=True)
    hashed_password: str

    transactions: List["Transactions"] = Relationship(back_populates="user")
    wallets: List["Wallets"] = Relationship(back_populates="user")
    investigations: List["Investigations"] = Relationship(back_populates="user")
    monitored_addresses: List["MonitoredAddress"] = Relationship(back_populates="user")
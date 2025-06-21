from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

from app.models import Users


class MonitoredAddress(SQLModel, table=True):
    __tablename__ = "monitored_addresses"

    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    address: str = Field(nullable=False, index=True)
    label: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    user: Optional["Users"] = Relationship(back_populates="monitored_addresses")
    wallet_transactions: List["WalletTransaction"] = Relationship(back_populates="monitored_address")

class WalletTransaction(SQLModel, table=True):
    __tablename__ = "wallet_transactions"

    id: int = Field(primary_key=True)
    monitored_address_id: int = Field(foreign_key="monitored_addresses.id")
    txid: str = Field(nullable=False, index=True)
    block_height: Optional[int] = Field(default=None)
    confirmed: bool = Field(default=False)
    amount: int = Field(nullable=False)  # in satoshis
    fee: Optional[int] = Field(default=None)  # in satoshis
    transaction_type: str = Field(nullable=False)  # "incoming" or "outgoing"
    first_seen: datetime = Field(default_factory=datetime.now)
    confirmed_at: Optional[datetime] = Field(default=None)

    # Raw transaction data as JSON
    raw_data: Optional[str] = Field(default=None)

    # Relationships
    monitored_address: Optional[MonitoredAddress] = Relationship(back_populates="wallet_transactions")
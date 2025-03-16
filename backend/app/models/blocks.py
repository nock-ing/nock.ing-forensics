from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.transactions import Transactions

class Blocks(SQLModel, table=True):
    id: int = Field(primary_key=True)
    block_hash: str = Field()
    timestamp: int = Field(default=datetime.timestamp(datetime.now()))
    size: int = Field(nullable=False)

    transactions: List["Transactions"] = Relationship(back_populates="block")

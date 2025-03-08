from datetime import datetime

from sqlmodel import Field, SQLModel, Relationship
from typing import Optional

from app.models.transactions import Transactions


class Blocks(SQLModel, table=True):
    id: int = Field(primary_key=True)
    block_hash: str = Field()
    timestamp: int = Field(default=datetime.timestamp(datetime.now()))
    size: int = Field(nullable=False)
    transaction: Transactions = Relationship(back_populates="blocks")
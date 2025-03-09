from sqlmodel import Relationship
from app.models.blocks import Blocks
from app.models.transactions import Transactions

Blocks.transactions = Relationship(back_populates="block")
Transactions.block = Relationship(back_populates="transactions")

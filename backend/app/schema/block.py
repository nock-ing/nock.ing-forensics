from sqlmodel import SQLModel


class Block(SQLModel):
    block_hash: str
    timestamp: int
    block_height: int
    size: int

from sqlmodel import Field, SQLModel
from typing import Optional


class Users(SQLModel, table=True):
    id: int = Field(primary_key=True)
    username: str = Field(unique=True, index=True)
    email: Optional[str] = Field(unique=True, index=True)
    hashed_password: str

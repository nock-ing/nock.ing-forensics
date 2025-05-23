from sqlmodel import SQLModel
from typing import Union, Optional


class UserBase(SQLModel):
    id: Optional[int] = None
    username: str
    email: Optional[str] = None


class UserCreate(UserBase, SQLModel):
    password: str


class UserInDB(UserBase, SQLModel):
    hashed_password: str


class Token(SQLModel):
    access_token: str
    token_type: str

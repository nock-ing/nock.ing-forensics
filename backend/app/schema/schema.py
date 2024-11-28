from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str | None = None
    is_active: bool | None = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

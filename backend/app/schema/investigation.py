from sqlmodel import SQLModel

class Investigation(SQLModel):
    status: int
    created_at: str
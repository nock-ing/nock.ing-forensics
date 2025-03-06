from datetime import datetime

from sqlmodel import Field, SQLModel
from typing import Optional

class CoinAge(SQLModel, table=True):
    id: int = Field(primary_key=True)
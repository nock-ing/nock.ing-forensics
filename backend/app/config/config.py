from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings
from pydantic import Field

load_dotenv()

class Settings(BaseSettings):
    SECRET_KEY: str = Field(default=os.getenv("SECRET_KEY"))
    ALGORITHM: str = Field(default=os.getenv("ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL"))

settings = Settings()

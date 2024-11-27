import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    SECRET_KEY: str = Field(default=os.getenv("SECRET_KEY", "default_secret_key"))  # <-- Default or env var
    ALGORITHM: str = Field(default=os.getenv("ALGORITHM", "HS256"))                 # <-- Default or env var
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)))  # <-- Default
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL", "sqlite:///./test.db"))  # <-- Default or env var

settings = Settings()

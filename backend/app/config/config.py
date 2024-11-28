import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field

# Load the .env file into the environment
load_dotenv()

class Settings(BaseSettings):
    # General Application Settings
    SECRET_KEY: str = Field(default=os.getenv("SECRET_KEY", "default_secret_key"))
    ALGORITHM: str = Field(default=os.getenv("ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)))
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL", ""))

    # Bitcoin Node RPC Settings
    RPC_HOST: str = Field(default=os.getenv("BITCOIN_RPC_HOST", "127.0.0.1"))
    RPC_PORT: int = Field(default=int(os.getenv("BITCOIN_RPC_PORT", 8332)))
    RPC_USER: str = Field(default=os.getenv("BITCOIN_RPC_USER", "user"))
    RPC_PASSWORD: str = Field(default=os.getenv("BITCOIN_RPC_PASSWORD", "pass"))

    WALLET_NAME: str = Field(default=os.getenv("BITCOIN_WALLET_NAME", "default_wallet"))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

# Instantiate settings
settings = Settings()

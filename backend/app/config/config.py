import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field, computed_field

# Load the .env file into the environment
load_dotenv()


class Settings(BaseSettings):
    # General Application Settings
    SECRET_KEY: str = Field(default=os.getenv("SECRET_KEY", "default_secret_key"))
    ALGORITHM: str = Field(default=os.getenv("ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    )
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL", ""))

    # Bitcoin Node RPC Settings
    RPC_HOST: str = Field(default=os.getenv("BITCOIN_RPC_HOST", "127.0.0.1"))
    RPC_PORT: int = Field(default=int(os.getenv("BITCOIN_RPC_PORT", 8332)))
    RPC_USER: str = Field(default=os.getenv("BITCOIN_RPC_USER", "user"))
    RPC_PASSWORD: str = Field(default=os.getenv("BITCOIN_RPC_PASSWORD", "pass"))

    WALLET_NAME: str = Field(default=os.getenv("BITCOIN_WALLET_NAME", "default_wallet"))

    # Umbrel
    UMBREL_HOST: str = Field(default=os.getenv("UMBREL_HOST", "127.0.0.1"))
    UMBREL_PORT: int = Field(default=int(os.getenv("UMBREL_PORT", 3006)))

    # Redis
    REDIS_HOST: str = Field(default=os.getenv("REDIS_HOST", "127.0.0.1"))
    REDIS_PORT: int = Field(default=int(os.getenv("REDIS_PORT", 6379)))
    REDIS_USERNAME: str = Field(default=os.getenv("REDIS_USERNAME", ""))
    REDIS_PASSWORD: str = Field(default=os.getenv("REDIS_PASSWORD", ""))
    REDIS_DB: int = Field(default=int(os.getenv("REDIS_DB", 0)))

    # Use computed_field for dynamic Redis URL generation
    @computed_field
    @property
    def REDIS_URL(self) -> str:
        # Check if REDIS_URL is explicitly set in environment
        env_redis_url = os.getenv("REDIS_URL")
        if env_redis_url:
            return env_redis_url
        
        # Build Redis URL with credentials if provided
        if self.REDIS_USERNAME and self.REDIS_PASSWORD:
            return f"redis://{self.REDIS_USERNAME}:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        elif self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        else:
            return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Environment
    ENVIRONMENT: str = Field(default=os.getenv("ENVIRONMENT", "dev"))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


# Instantiate settings
settings = Settings()
from pydantic import BaseModel


class WalletForensicsRequest(BaseModel):
    wallet_address: str
    max_depth: int = 5
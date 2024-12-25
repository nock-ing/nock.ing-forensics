from sqlmodel import SQLModel

class WalletForensicsRequest(SQLModel):
    wallet_address: str
    max_depth: int = 5
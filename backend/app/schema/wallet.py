from sqlmodel import SQLModel

class Wallet(SQLModel):
    wallet_address: str
    owner: str
    created_at: str
    suspicious_illegal_activity: bool = False

class WalletForensicsRequest(Wallet):
    max_depth: int = 5
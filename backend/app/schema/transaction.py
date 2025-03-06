from sqlmodel import SQLModel

class Transaction(SQLModel):
    transaction_hash: str
    timestamp: int
    total_input: float
    total_output: float
    fee: float
    suspicious_illegal_activity: bool
from fastapi import APIRouter

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/create")
async def create_transaction():
    return {"message": "Create transaction"}

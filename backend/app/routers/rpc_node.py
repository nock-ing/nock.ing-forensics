from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_active_user
from app.utils.bitcoin_rpc import bitcoin_rpc_call

router = APIRouter()

@router.get("/node-info", response_model=dict)
async def get_node_info(current_user: dict = Depends(get_current_active_user)):
    """
    Fetch basic information about the Bitcoin node.
    """
    try:
        blockchain_info = bitcoin_rpc_call("getblockchaininfo")
        return {"blockchain_info": blockchain_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

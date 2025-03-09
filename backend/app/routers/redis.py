

from fastapi import APIRouter, HTTPException, Depends

from app.auth.dependencies import get_current_active_user
from app.auth.security import get_jti
from app.utils.redis_service import get_redis_service, RedisService


router = APIRouter()

@router.get("/recent-txids", response_model=list)
async def get_recent_txids(
    current_user=Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service)
):
    """
    Retrieve the most recent 8 transaction IDs stored in Redis.
    """
    try:
        recent_txids = redis_service.get_recent_list("txid")
        return recent_txids
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))


@router.get("/recent-wallets", response_model=list)
async def get_recent_wallets(
        redis_service: RedisService = Depends(get_redis_service),
        current_user=Depends(get_current_active_user)
):
    """
    Retrieve the most recent 8 analyzed wallet addresses.
    """
    try:
        recent_wallets = redis_service.get_recent_list("wallet")
        return recent_wallets
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))

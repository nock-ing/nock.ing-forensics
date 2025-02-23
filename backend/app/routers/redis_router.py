

from fastapi import APIRouter, HTTPException, Depends

from app.auth.security import get_jti
from app.utils.redis_service import get_redis_service, RedisService


router = APIRouter()

@router.get("/recent-txids", response_model=list)
async def get_recent_txids(redis_service: RedisService = Depends(get_redis_service)):
    """
    Retrieve the most recent 8 transaction IDs stored in Redis.
    """
    try:
        recent_txids = redis_service.get_recent_list("txid")
        return recent_txids
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))


@router.get("/recent-wallets", response_model=list)
async def get_recent_wallets(redis_service: RedisService = Depends(get_redis_service)):
    """
    Retrieve the most recent 8 analyzed wallet addresses.
    """
    try:
        recent_wallets = redis_service.get_recent_list("wallet")
        return recent_wallets
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))
    
@router.get("/recent-sessions", response_model=list)
async def get_recent_sessions(
    redis_service: RedisService = Depends(get_redis_service),
    jti: str = Depends(get_jti)
    ):
    try:
        return redis_service.get(jti)
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))
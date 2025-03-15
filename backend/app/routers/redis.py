

from fastapi import APIRouter, HTTPException, Depends

from app.auth.dependencies import get_current_active_user
from app.auth.security import get_jti
from app.utils.redis_service import get_redis_service, RedisService


router = APIRouter(prefix="/redis", tags=["redis"])

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

@router.delete("/empty-redis", response_model=dict)
async def empty_redis(
        redis_service: RedisService = Depends(get_redis_service),
        current_user=Depends(get_current_active_user)
):
    """
    Empty the Redis cache.
    """
    try:
        redis_service.empty_redis()
        return {"message": "Redis cache emptied"}
    except Exception as e:
        raise HTTPException(status_code=498, detail=str(e))

@router.get("/debug/redis-txid")
async def debug_redis_txid(redis_service: RedisService = Depends(get_redis_service)):
    return redis_service.redis.lrange("txid", 0, 10)

@router.get("/related-tx")
async def get_related_tx(txid: str, redis_service: RedisService = Depends(get_redis_service)):
    return redis_service.get(f"flow-tx-info:{txid}")

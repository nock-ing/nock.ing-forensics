from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_active_user
from app.utils.mempool_api import mempool_api_call
from app.utils.redis_service import RedisService, get_redis_service

router = APIRouter(prefix="/price")


@router.get("/current", response_model=dict)
async def get_current_price(
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    current_price = await mempool_api_call("/api/v1/prices")
    return current_price


@router.get("/historical", response_model=dict)
async def get_historical_price(
    timestamp: int,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    price = await mempool_api_call(
        f"api/v1/historical-price?currency=EUR&timestamp={timestamp}"
    )
    if not price:
        raise HTTPException(
            status_code=404, detail=f"Price for timestamp {timestamp} not found."
        )

    return price

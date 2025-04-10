from app.utils.mempool_api import mempool_api_call


async def get_price_based_on_timestamp(timestamp: int):
    try:
        price = await mempool_api_call(
            f"api/v1/historical-price?currency=EUR&timestamp={timestamp}"
        )

    except Exception as e:
        print(e)
        price = None

    return price

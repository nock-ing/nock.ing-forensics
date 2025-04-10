from app.config.config import settings
import aiohttp


async def mempool_api_call(method: str, params=None):
    if params is None:
        params = []

    url = f"http://{settings.UMBREL_HOST}:{settings.UMBREL_PORT}/{method}"
    headers = {"content-type": "application/json"}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                raise Exception(f"Mempool REST API error: {await response.text()}")

            data = await response.json()
            print(data)
            return data

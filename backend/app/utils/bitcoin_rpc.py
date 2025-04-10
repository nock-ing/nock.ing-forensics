from app.config.config import settings
import aiohttp


async def bitcoin_rpc_call(method: str, params=None):
    if params is None:
        params = []

    wallet_path = f"/wallet/{settings.WALLET_NAME}" if settings.WALLET_NAME else ""
    url = f"http://{settings.RPC_USER}:{settings.RPC_PASSWORD}@{settings.RPC_HOST}:{settings.RPC_PORT}{wallet_path}"
    headers = {"content-type": "application/json"}
    payload = {
        "method": method,
        "params": params,
        "jsonrpc": "2.0",
        "id": 0,
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status != 200:
                raise Exception(f"Bitcoin RPC error: {await response.text()}")

            result = await response.json()
            return result["result"]

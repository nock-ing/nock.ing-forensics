from app.config.config import settings
import requests

def bitcoin_rpc_call(method: str, params=None):
    if params is None:
        params = []

    url = f"http://{settings.RPC_USER}:{settings.RPC_PASSWORD}@{settings.RPC_HOST}:{settings.RPC_PORT}"
    headers = {'content-type': 'application/json'}
    payload = {
        "method": method,
        "params": params,
        "jsonrpc": "2.0",
        "id": 0,
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Bitcoin RPC error: {response.text}")

    return response.json()["result"]

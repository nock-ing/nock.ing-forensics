from app.config.config import settings
import requests

def mempool_api_call(method: str, params=None):
    if params is None:
        params = []

    url = f"http://umbrel.remote:3006/{method}"
    headers = {'content-type': 'application/json'}

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Mempool REST API error: {response.text}")

    print(response.json())
    return response.json()

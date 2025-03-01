import json

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_active_user
from app.schema.walletschema import WalletForensicsRequest
from app.utils.redis_service import RedisService, get_redis_service
from app.utils.bitcoin_rpc import bitcoin_rpc_call

from collections import defaultdict

from app.utils.mempool_api import mempool_api_call

router = APIRouter()


@router.get("/node-info", response_model=dict)
async def get_node_info(
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch basic information about the Bitcoin node.
    """
    try:
        cached_node_info = redis_service.get("node_info")
        if cached_node_info:
            return json.loads(cached_node_info)
        
        blockchain_info = bitcoin_rpc_call("getblockchaininfo")

        if not blockchain_info:
            raise HTTPException(status_code=404, detail="Blockchain info not found.")
        
        redis_service.set("node_info", json.dumps(blockchain_info))
        
        return {"blockchain_info": blockchain_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest-blocks", response_model=dict)
async def get_latest_blocks(
    count: int = 7,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch the latest blocks.
    """
    try:
        # if count changes, we need to update the cache
        cached_latest_blocks = redis_service.get("latest_blocks")
        if (cached_latest_blocks):
            cached_latest_blocks = json.loads(cached_latest_blocks)
            if (len(cached_latest_blocks["latest_blocks"]) != count):
                redis_service.delete("latest_blocks")
            else:
                return cached_latest_blocks

        # Fetch the latest block height
        blockchain_info = bitcoin_rpc_call("getblockchaininfo")

        if not blockchain_info:
            raise HTTPException(status_code=404, detail="Blockchain info not found.")

        latest_height = blockchain_info["blocks"]

        # Adjust count if it exceeds available blocks
        if count > latest_height:
            count = latest_height

        # Collect details of the latest blocks
        blocks = []
        for i in range(latest_height, latest_height - count, -1):
            block_hash = bitcoin_rpc_call("getblockhash", [i])
            block = bitcoin_rpc_call("getblock", [block_hash])
            blocks.append(
                {
                    "height": i,
                    "hash": block["hash"],
                    "time": block["time"],
                    "transactions": len(block["tx"]),
                }
            )

        redis_service.set("latest_blocks", json.dumps({"latest_blocks": blocks}))

        return {"latest_blocks": blocks}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/related-tx", response_model=dict)
async def transaction_forensics(
    txid: str,
    depth: int = 5,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """Related Transactions, connecting them by inputs and outputs."""

    try:
        cache_key = f"{txid}:{depth}"  # Unique cache key per depth value
        cached_related_tx = redis_service.get(cache_key)

        if cached_related_tx:
            return {"related_transactions": json.loads(cached_related_tx)}

        # Fetch raw transaction details
        raw_tx = bitcoin_rpc_call("getrawtransaction", [txid, True])

        # Ensure the response is valid
        if not raw_tx or "vin" not in raw_tx or "vout" not in raw_tx:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {txid} not found or not decodable.",
            )

        # Extract inputs and outputs
        inputs = raw_tx["vin"]
        outputs = raw_tx["vout"]

        # Related transactions
        related_transactions = []

        # Trace previous transactions for inputs
        for vin in inputs:
            if "txid" in vin:
                prev_txid = vin["txid"]
                prev_tx = bitcoin_rpc_call("getrawtransaction", [prev_txid, True])
                if prev_tx:
                    related_transactions.append({"txid": prev_txid, "details": prev_tx})
                if len(related_transactions) >= depth:
                    break

        # Trace outputs for spending transactions
        for vout in outputs:
            script_pub_key = vout.get("scriptPubKey", {})
            addresses = script_pub_key.get("addresses", [])
            for address in addresses:
                unspent = bitcoin_rpc_call("listunspent", [0, 9999999, [address]])
                for utxo in unspent:
                    if utxo["txid"] not in [tx["txid"] for tx in related_transactions]:
                        spent_txid = utxo["txid"]
                        spent_tx = bitcoin_rpc_call(
                            "getrawtransaction", [spent_txid, True]
                        )
                        if spent_tx:
                            related_transactions.append(
                                {"txid": spent_txid, "details": spent_tx}
                            )
                            if len(related_transactions) >= depth:
                                break
                if len(related_transactions) >= depth:
                    break

        # Cache the result for future requests
        redis_service.set(cache_key, json.dumps(related_transactions))

        return {"related_transactions": related_transactions[:depth]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tx-info", response_model=dict)
async def get_tx_info(
    txid: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch details about a specific transaction by its txid.
    Uses Redis to cache results for quicker response times.
    """
    try:
        cached_tx = redis_service.get(txid)
        if cached_tx:
            return json.loads(cached_tx)

        # Fetch transaction details from the Bitcoin node
        raw_tx = bitcoin_rpc_call("getrawtransaction", [txid, True])

        if not raw_tx:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        # Cache the result for future requests
        redis_service.set(txid, json.dumps(raw_tx), 600)

        return {"transaction": raw_tx}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mempool/tx/info", response_model=dict)
async def get_tx_info_mempool(
    txid: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch all transactions related to a given address.
    """
    try:
        # Fetch address transactions
        tx_info = mempool_api_call(f"api/tx/{txid}")

        redis_service.lpush_trim("txid", txid)

        return {
            "txid": txid,
            "transaction": tx_info,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tx/wallet")
async def get_tx_wallet(
    txid: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Get the wallet address from a given transaction ID.
    """

    try:
        tx_info = mempool_api_call(f"api/tx/{txid}")

        if not tx_info:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        scriptpubkey_address = tx_info["vin"][0]["prevout"]["scriptpubkey_address"]

        if not scriptpubkey_address:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        redis_service.lpush_trim("wallet", scriptpubkey_address)

        return {
            "txid": txid,
            "scriptpubkey_address": scriptpubkey_address,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coin-age/txid", response_model=dict)
async def get_coin_age_by_txid(
    hashid: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Get the age of coins from a transaction ID.
    """
    try:
        raw_tx = bitcoin_rpc_call("getrawtransaction", [hashid, True])

        if not raw_tx or "blockhash" not in raw_tx:
            raise HTTPException(
                status_code=404, detail=f"Transaction {hashid} not found."
            )

        block_hash = raw_tx["blockhash"]
        block = bitcoin_rpc_call("getblock", [block_hash])

        current_block = bitcoin_rpc_call("getblockcount")
        coin_creation_block = block["height"]
        age_in_blocks = current_block - coin_creation_block
        age_in_days = (age_in_blocks * 10) / (60 * 24)

        redis_service.lpush_trim("txid", hashid)

        return {
            "hashid": hashid,
            "coin_creation_block": coin_creation_block,
            "current_block": current_block,
            "age_in_blocks": age_in_blocks,
            "age_in_days": round(age_in_days, 2),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coin-age/address", response_model=dict)
async def get_coin_age_by_address(
    address: str, current_user: dict = Depends(get_current_active_user)
):
    """
    Get the age of coins for a wallet address.
    """
    try:
        # Fetch unspent outputs for the address
        unspent_outputs = bitcoin_rpc_call("listunspent", [0, 9999999, [address]])

        if not unspent_outputs:
            raise HTTPException(
                status_code=404, detail=f"No UTXOs found for address {address}."
            )

        current_block = bitcoin_rpc_call("getblockcount")
        coin_ages = []

        for utxo in unspent_outputs:
            confirmations = utxo["confirmations"]
            creation_block = current_block - confirmations
            age_in_days = (confirmations * 10) / (
                60 * 24
            )  # Approx 10 minutes per block

            coin_ages.append(
                {
                    "txid": utxo["txid"],
                    "vout": utxo["vout"],
                    "amount": utxo["amount"],
                    "confirmations": confirmations,
                    "creation_block": creation_block,
                    "age_in_days": round(age_in_days, 2),
                }
            )

        return {
            "address": address,
            "utxos": coin_ages,
            "current_block": current_block,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/address/txs", response_model=dict)
async def get_address_txs(
    address: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch all transactions related to a given address.
    """
    try:
        # Fetch address transactions
        address_txs = mempool_api_call(f"api/address/{address}/txs")
        redis_service.lpush_trim("wallet", address)

        return {
            "address": address,
            "transactions": address_txs,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/received-by-address", response_model=dict)
async def get_received_by_address(
    address: str, current_user: dict = Depends(get_current_active_user)
):
    """
    Get the total amount received by a specific Bitcoin address.
    """
    try:
        received_amount = mempool_api_call(f"api/address/{address}")

        return {"address": address, "total_received": received_amount}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

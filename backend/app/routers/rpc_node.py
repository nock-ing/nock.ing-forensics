import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_active_user
from app.utils.price import get_price_based_on_timestamp
from app.utils.redis_service import RedisService, get_redis_service
from app.utils.bitcoin_rpc import bitcoin_rpc_call
from app.utils.format import sats_to_btc
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

        blockchain_info = await bitcoin_rpc_call("getblockchaininfo")

        if not blockchain_info:
            raise HTTPException(status_code=404, detail="Blockchain info not found.")

        redis_service.set("node_info", json.dumps({"blockchain_info": blockchain_info}))

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
        if cached_latest_blocks:
            if isinstance(cached_latest_blocks, dict):
                return cached_latest_blocks
            cached_latest_blocks = json.loads(cached_latest_blocks)
            if len(cached_latest_blocks["latest_blocks"]) != count:
                redis_service.delete("latest_blocks")
            else:
                return cached_latest_blocks

        # Fetch the latest block height
        blockchain_info = await bitcoin_rpc_call("getblockchaininfo")

        if not blockchain_info:
            raise HTTPException(status_code=404, detail="Blockchain info not found.")

        latest_height = blockchain_info["blocks"]

        # Adjust count if it exceeds available blocks
        if count > latest_height:
            count = latest_height

        # Collect details of the latest blocks
        blocks = []
        for i in range(latest_height, latest_height - count, -1):
            block_hash = await bitcoin_rpc_call("getblockhash", [i])
            block = await bitcoin_rpc_call("getblock", [block_hash])
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
        cache_key = f"{txid}:{depth}"
        cached_related_tx = redis_service.get(cache_key)
        flow_cache_key = f"flow-tx-info:{txid}"

        if cached_related_tx:
            # check if its a dict, if not, return the cached value
            if isinstance(cached_related_tx, dict):
                return cached_related_tx
            return json.loads(cached_related_tx)

        # Fetch raw transaction details
        raw_tx = await bitcoin_rpc_call("getrawtransaction", [txid, True])

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
                prev_tx = await bitcoin_rpc_call("getrawtransaction", [prev_txid, True])
                if prev_tx:
                    related_transactions.append({"txid": prev_txid, "details": prev_tx})
                if len(related_transactions) >= depth:
                    break

        # Trace outputs for spending transactions
        for vout in outputs:
            script_pub_key = vout.get("scriptPubKey", {})
            addresses = script_pub_key.get("addresses", [])
            for address in addresses:
                unspent = await bitcoin_rpc_call("listunspent", [0, 9999999, [address]])
                for utxo in unspent:
                    if utxo["txid"] not in [tx["txid"] for tx in related_transactions]:
                        spent_txid = utxo["txid"]
                        spent_tx = await bitcoin_rpc_call(
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

        # Cache the result for reactflow
        # we need id, label, position (can be 0,0)
        #related_txids = [tx["txid"] for tx in related_transactions]
        redis_service.set(
            flow_cache_key,
            json.dumps(
                {
                    "id": txid,
                    "data": {"label": txid},
                    "position": {"x": 0, "y": 0},
                    "related_txids": {
                        tx["txid"]: {
                            "id": tx["txid"],
                            "data": {"label": tx["txid"]},
                            "position": {"x": 0, "y": 0},
                        }
                        for tx in related_transactions
                    },
                }
            ),
        )

        redis_service.set(
            cache_key,
            json.dumps({"related_transactions": related_transactions[:depth]}),
        )

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
    cache_key = f"tx-info:{txid}"
    try:
        cached_tx = redis_service.get(cache_key)
        if cached_tx:
            if isinstance(cached_tx, dict):
                return cached_tx
            return json.loads(cached_tx)

        raw_tx = await bitcoin_rpc_call("getrawtransaction", [txid, True])

        if not raw_tx:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        redis_service.set(cache_key, json.dumps({"transaction": raw_tx}))

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
    cache_key = f"tx-info-mempool:{txid}"
    try:
        cached_tx = redis_service.get(cache_key)
        if cached_tx:
            if isinstance(cached_tx, dict):
                return cached_tx
            return json.loads(cached_tx)
        # Fetch address transactions
        tx_info = await mempool_api_call(f"api/tx/{txid}")

        if not tx_info:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        redis_service.lpush_trim(
            "txid", json.dumps({"txid": txid, "added": datetime.now().isoformat()})
        )
        redis_service.set(
            cache_key,
            json.dumps(
                {
                    "txid": txid,
                    "transaction": tx_info,
                }
            ),
        )

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

    cache_key = f"tx-wallet:{txid}"
    try:
        cached_wallet = redis_service.get(cache_key)
        if cached_wallet:
            if isinstance(cached_wallet, dict):
                return cached_wallet
            return json.loads(cached_wallet)
        tx_info = await mempool_api_call(f"api/tx/{txid}")

        if not tx_info:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        scriptpubkey_address = tx_info["vin"][0]["prevout"]["scriptpubkey_address"]

        if not scriptpubkey_address:
            raise HTTPException(
                status_code=404, detail=f"Transaction {txid} not found."
            )

        redis_service.set(
            cache_key,
            json.dumps(
                {
                    "txid": txid,
                    "scriptpubkey_address": scriptpubkey_address,
                }
            ),
        )
        redis_service.lpush_trim(
            "wallet",
            json.dumps(
                {"wallet": scriptpubkey_address, "added": datetime.now().isoformat()}
            ),
        )

        return {
            "txid": txid,
            "scriptpubkey_address": scriptpubkey_address,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coin-age/address", response_model=dict)
async def get_coin_age_by_address(
    address: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Get the coin age for all transactions associated with an address,
    calculating the difference in block heights between when UTXOs were
    received and when they were spent.
    """
    try:
        # Check cache
        cache_key = f"coin_age_{address}"
        cached_result = redis_service.get(cache_key)
        if cached_result:
            if isinstance(cached_result, dict):
                return cached_result
            return json.loads(cached_result)

        # Fetch all transactions for this address using mempool API
        txs = await mempool_api_call(f"api/address/{address}/txs")

        if not txs:
            raise HTTPException(
                status_code=404, detail=f"No transactions found for address {address}"
            )

        # Track all UTXOs and their spending
        results = []
        utxo_map = {}  # Maps txid:vout to block_height for received outputs

        # First pass: collect all outputs received by this address
        for tx in txs:
            if "status" not in tx or "block_height" not in tx["status"]:
                continue  # Skip unconfirmed transactions

            tx_id = tx["txid"]
            block_height = tx["status"]["block_height"]

            # Track outputs belonging to this address
            for vout_idx, vout in enumerate(tx.get("vout", [])):
                if (
                    "scriptpubkey_address" in vout
                    and vout["scriptpubkey_address"] == address
                ):
                    utxo_key = f"{tx_id}:{vout_idx}"
                    utxo_map[utxo_key] = {
                        "block_height": block_height,
                        "value": vout["value"],
                        "txid": tx_id,
                        "vout": vout_idx,
                    }

        # Second pass: find spending transactions and calculate coin age
        for tx in txs:
            if "status" not in tx or "block_height" not in tx["status"]:
                continue  # Skip unconfirmed transactions

            spent_block_height = tx["status"]["block_height"]

            # Find inputs spending from this address
            for vin in tx.get("vin", []):
                if "txid" in vin and "vout" in vin:
                    utxo_key = f"{vin['txid']}:{vin['vout']}"

                    if utxo_key in utxo_map:
                        # This input is spending a UTXO belonging to our address
                        utxo_info = utxo_map[utxo_key]
                        received_block_height = utxo_info["block_height"]

                        # Calculate the difference in block heights (coin age)
                        blocks_diff = spent_block_height - received_block_height
                        days_diff = (blocks_diff * 10) / (
                            60 * 24
                        )  # Assuming 10-minute blocks

                        results.append(
                            {
                                "txid": tx["txid"],  # Spending transaction
                                "prev_txid": utxo_info["txid"],  # Original transaction
                                "received_block": received_block_height,
                                "spent_block": spent_block_height,
                                "blocks_difference": blocks_diff,
                                "days_difference": round(days_diff, 2),
                                "amount": utxo_info["value"]
                                / 100000000,  # Convert from satoshis to BTC
                            }
                        )

        # Cache and return the response
        response = {
            "address": address,
            "transactions_count": len(results),
            "coin_age_details": results,
        }

        redis_service.set(cache_key, json.dumps(response))

        # Record address lookup in recent queries
        redis_service.lpush_trim(
            "address_coin_age",
            json.dumps({"address": address, "added": datetime.now().isoformat()}),
        )

        return response

    except Exception as e:
        # Log the actual exception for debugging
        print(f"Error in get_coin_age_by_address: {str(e)}")
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
        cached_coin_age = redis_service.get(hashid)
        if cached_coin_age:
            if isinstance(cached_coin_age, dict):
                return cached_coin_age
            return json.loads(cached_coin_age)

        raw_tx = await bitcoin_rpc_call("getrawtransaction", [hashid, True])

        if not raw_tx or "blockhash" not in raw_tx:
            raise HTTPException(
                status_code=404, detail=f"Transaction {hashid} not found."
            )

        block_hash = raw_tx["blockhash"]
        block = await bitcoin_rpc_call("getblock", [block_hash])
        block_time = block["time"]

        price = await get_price_based_on_timestamp(block_time)
        if not price:
            raise HTTPException(
                status_code=404, detail=f"Transaction {hashid} not found."
            )

        current_block = await bitcoin_rpc_call("getblockcount")
        coin_creation_block = block["height"]
        age_in_blocks = current_block - coin_creation_block
        age_in_days = (age_in_blocks * 10) / (60 * 24)

        redis_service.set(
            hashid,
            json.dumps(
                {
                    "hashid": hashid,
                    "coin_creation_block": coin_creation_block,
                    "current_block": current_block,
                    "age_in_blocks": age_in_blocks,
                    "age_in_days": round(age_in_days, 2),
                    "block_time": block_time,
                    "price": price,
                }
            ),
        )

        redis_service.lpush_trim(
            "txid", json.dumps({"txid": hashid, "added": datetime.now().isoformat()})
        )

        return {
            "hashid": hashid,
            "coin_creation_block": coin_creation_block,
            "current_block": current_block,
            "age_in_blocks": age_in_blocks,
            "age_in_days": round(age_in_days, 2),
            "block_time": block_time,
            "price": price,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/address/txs/summary", response_model=dict)
async def get_address_txs_summary(
    address: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Fetch all transactions related to a given address using pagination
    and calculate accurate totals.
    """
    cache_key = f"address-txs-summary:{address}"
    try:
        cached_data = redis_service.get(cache_key)
        if cached_data:
            if isinstance(cached_data, dict):
                return cached_data
            return json.loads(cached_data)
    except Exception as cache_err:
         print(f"Cache retrieval error: {cache_err}")


    all_address_txs = []
    last_confirmed_txid = None
    has_more_confirmed_txs = True
    page_count = 0 # Debugging

    # --- Fetch Initial Page (Mempool + first 25 confirmed) ---
    try:
        page_count += 1
        initial_url = f"api/address/{address}/txs"
        print(f"Fetching initial page from Mempool API: {initial_url}") # Debugging
        current_page_txs = await mempool_api_call(initial_url)

        if not current_page_txs:
            # Address found, but no transactions yet
            print(f"Address {address} found, but no transactions.") # Debugging
            result = {
                "address": address,
                "total_received_sats": 0,
                "total_sent_sats": 0,
                "total_received_btc": 0.0,
                "total_sent_btc": 0.0,
                "balance_sats": 0,
                "balance_btc": 0.0,
                "tx_count": 0,
                "transactions": [],
            }
            # Optional: Cache this empty result
            # redis_service.set(cache_key, json.dumps(result))
            return result

        all_address_txs.extend(current_page_txs)
        print(f"Fetched {len(current_page_txs)} transactions on initial page.") # Debugging


        # Find the last confirmed transaction in the initial page
        # Iterate backwards to find the one earliest in time within this batch
        found_last_confirmed = False
        for tx in reversed(current_page_txs):
            if tx.get("status", {}).get("confirmed"):
                last_confirmed_txid = tx["txid"]
                found_last_confirmed = True
                break # Found the last confirmed one on this page

        if not found_last_confirmed:
             print("No confirmed transactions in the initial page. Stopping pagination.") # Debugging
             has_more_confirmed_txs = False


    except HTTPException as http_err:
         if http_err.status_code == 404:
              print(f"Address {address} not found by Mempool API.") # Debugging
              raise HTTPException(status_code=404, detail=f"Address {address} not found.")
         else:
              print(f"HTTP error fetching initial page: {http_err}") # Debugging
              raise http_err
    except Exception as e:
        print(f"Error fetching initial page: {e}") # Debugging
        raise HTTPException(status_code=500, detail=f"Error fetching initial transactions: {e}")


    # --- Fetch Subsequent Confirmed Transaction Pages ---
    # Continue fetching only if we found at least one confirmed tx in the initial page
    while has_more_confirmed_txs and last_confirmed_txid:
        page_count += 1 # Debugging
        url = f"api/address/{address}/txs?after_txid={last_confirmed_txid}"
        print(f"Fetching page {page_count} from Mempool API: {url}") # Debugging

        try:
            current_page_txs = await mempool_api_call(url)

            if not current_page_txs:
                # API returned empty list, no more confirmed transactions
                print(f"Mempool API returned empty list on page {page_count} for after_txid={last_confirmed_txid}. Stopping pagination.") # Debugging
                has_more_confirmed_txs = False
                break # End pagination loop

            # Extend the main list with transactions from the current page
            all_address_txs.extend(current_page_txs)
            print(f"Fetched {len(current_page_txs)} transactions on page {page_count}.") # Debugging


            # Update last_confirmed_txid for the next iteration
            # In paginated calls with after_txid, the response should only contain
            # confirmed transactions after the specified txid. So, the last tx in
            # the returned list should be the one earliest in time in this page.
            last_confirmed_txid = current_page_txs[-1]["txid"]
            print(f"Updated last_confirmed_txid for next page: {last_confirmed_txid}") # Debugging


            # Optional: Add a safeguard against excessive requests or infinite loops
            # if page_count > 100 or len(all_address_txs) > 10000: # Adjust limits as needed
            #     print(f"Pagination stopping due to reaching limit (Page: {page_count}, Total Txs: {len(all_address_txs)})") # Debugging
            #     has_more_confirmed_txs = False
            #     break

        except Exception as e:
            print(f"Error fetching paginated page {page_count} with after_txid={last_confirmed_txid}: {e}") # Debugging
            # Decide how to handle errors during pagination - continue or stop?
            # For now, stop pagination on error
            has_more_confirmed_txs = False
            # Optionally raise the exception
            # raise HTTPException(status_code=500, detail=f"Error during pagination: {e}")


    print(f"Finished fetching transactions. Total transactions found: {len(all_address_txs)}") # Debugging


    # --- Process All Fetched Transactions ---
    total_received = 0
    total_sent = 0
    # The all_address_txs list already contains the full transaction objects
    # including vin, vout, fee, size, and status.
    # We just need to iterate through this complete list to calculate totals
    # from the perspective of the target address.

    # We don't need to rebuild a separate 'transactions' list for the response
    # as the all_address_txs list already has the structure needed by the frontend.
    # We also don't need seen_txids if the API and pagination are correct.

    for tx in all_address_txs:
        received_in_tx = 0
        sent_in_tx = 0

        # Check inputs (sending)
        for vin in tx.get("vin", []):
            prevout = vin.get("prevout", {})
            if prevout.get("scriptpubkey_address") == address:
                amount = prevout.get("value", 0)
                sent_in_tx += amount

        # Check outputs (receiving)
        for vout in tx.get("vout", []):
            if vout.get("scriptpubkey_address") == address:
                amount = vout.get("value", 0)
                received_in_tx += amount

        # Add to totals
        total_received += received_in_tx
        total_sent += sent_in_tx


    btc_received = await sats_to_btc(total_received)
    btc_sent = await sats_to_btc(total_sent)

    result = {
        "address": address,
        "total_received_sats": total_received,
        "total_sent_sats": total_sent,
        "total_received_btc": btc_received,
        "total_sent_btc": btc_sent,
        "balance_sats": total_received - total_sent,
        "balance_btc": (total_received - total_sent) / 100000000,
        "tx_count": len(all_address_txs), # Count based on the full list from pagination
        "transactions": all_address_txs, # <--- Pass the full list fetched
    }

    try:
        redis_service.set(cache_key, json.dumps(result))
    except Exception as cache_err:
        print(f"Cache setting error for {address}: {cache_err}")

    print(f"Returning result for {address} with {result['tx_count']} transactions.") # Debugging
    return result

@router.get("/address/wallet", response_model=dict)
async def get_basic_wallet_info(
    address: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    cache_key = f"wallet_info:{address}"
    try:
        cached_wallet_info = redis_service.get(cache_key)
        if cached_wallet_info:
            if isinstance(cached_wallet_info, dict):
                return cached_wallet_info
            json.loads(cached_wallet_info)

        wallet_info = await mempool_api_call(f"api/address/{address}")
        if not wallet_info:
            raise HTTPException(status_code=404, detail=f"Address {address} not found.")

        chain_stats = wallet_info.get("chain_stats", {})

        # Calculate current balance
        current_balance_sats = int(str(chain_stats.get("funded_txo_sum"))) - int(
            str(chain_stats.get("spent_txo_sum"))
        )
        current_balance = await sats_to_btc(current_balance_sats)

        redis_service.set(
            cache_key,
            json.dumps(
                {
                    "address": address,
                    "tx_received": chain_stats.get("funded_txo_count"),
                    "tx_value_received": chain_stats.get("funded_txo_sum"),
                    "tx_coins_spent": chain_stats.get("spent_txo_count"),
                    "tx_coins_sum": chain_stats.get("spent_txo_sum"),
                    "balance_sats": current_balance_sats,
                    "balance": current_balance,
                }
            ),
        )

        return {
            "address": address,
            "tx_received": chain_stats.get("funded_txo_count"),
            "tx_value_received": chain_stats.get("funded_txo_sum"),
            "tx_coins_spent": chain_stats.get("spent_txo_count"),
            "tx_coins_sum": chain_stats.get("spent_txo_sum"),
            "balance_sats": current_balance_sats,
            "balance": current_balance,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

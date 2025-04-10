import json
from datetime import datetime

from app.celery_worker import celery_app
from app.utils.redis_service import get_redis_service
from app.utils.bitcoin_rpc import bitcoin_rpc_call
import asyncio


redis_service = get_redis_service()


@celery_app.task(name="trace_transaction_origin")
def perform_transaction_origin_trace(
    txid: str,
    include_tx_details: bool,
    task_id: str,
):
    """Background task to trace a transaction back to its origin."""
    try:
        print(f"Starting transaction origin trace for {txid}...")
        update_task_status(redis_service, task_id, "processing", progress=5)
        print(f"Transaction origin trace for {txid} started.")

        # Data structures to store results
        trace_path = []
        visited_txids = set()

        # Queue for breadth-first search
        queue = [(txid, 0)]  # (txid, depth)

        # Track the origin transactions (coinbase transactions)
        origins = []

        processed_count = 0

        while queue:
            current_txid, depth = queue.pop(0)

            if current_txid in visited_txids:
                continue

            visited_txids.add(current_txid)
            processed_count += 1

            # Update progress every 10 transactions
            if processed_count % 10 == 0:
                # Calculate an approximate progress (max 90%)
                progress = min(
                    90, int(5 + (processed_count / (processed_count + len(queue))) * 85)
                )
                update_task_status(
                    redis_service, task_id, "processing", progress=progress
                )

            # Get transaction details
            try:
                tx = asyncio.run(
                    bitcoin_rpc_call("getrawtransaction", [current_txid, True])
                )
            except Exception as e:
                # Handle case where transaction can't be retrieved
                trace_path.append(
                    {
                        "txid": current_txid,
                        "depth": depth,
                        "error": str(e),
                        "is_coinbase": False,
                    }
                )
                continue

            # Create the trace entry
            trace_entry = {
                "txid": current_txid,
                "depth": depth,
                "time": tx.get("time"),
                "blockheight": tx.get("height"),
                "is_coinbase": False,
            }

            if include_tx_details:
                trace_entry["details"] = tx

            inputs = tx.get("vin", [])

            # Check if this is a coinbase transaction
            if len(inputs) == 1 and "coinbase" in inputs[0]:
                trace_entry["is_coinbase"] = True
                origins.append(trace_entry)
            else:
                # Add previous transactions to the queue
                for vin in inputs:
                    if "txid" in vin:
                        prev_txid = vin["txid"]
                        queue.append((prev_txid, depth + 1))

            trace_path.append(trace_entry)

        # Construct the result
        result = {
            "source_txid": txid,
            "trace_count": len(trace_path),
            "origin_count": len(origins),
            "trace_path": trace_path,
            "origin_transactions": origins,
        }

        # Cache the result
        cache_key = f"tx-origin-trace:{txid}:{include_tx_details}"
        redis_service.set(cache_key, json.dumps(result))

        # Update task status to completed
        update_task_status(
            redis_service, task_id, "completed", progress=100, result_key=cache_key
        )

        # Remove the in-progress flag
        redis_service.delete(f"tx-origin-trace-in-progress:{txid}")

    except Exception as e:
        # Update task status to error
        update_task_status(redis_service, task_id, "error", error=str(e))
        # Remove the in-progress flag
        redis_service.delete(f"tx-origin-trace-in-progress:{txid}")


def update_task_status(
    redis_service, task_id, status, progress=None, error=None, result_key=None
):
    """Update the status of a background task."""
    task_key = f"task:{task_id}"
    task_data = redis_service.get(task_key)

    if not task_data:
        return

    task_info = json.loads(task_data) if isinstance(task_data, str) else task_data
    task_info["status"] = status
    task_info["updated_at"] = datetime.utcnow().isoformat()

    if progress is not None:
        task_info["progress"] = progress

    if error is not None:
        task_info["error"] = error

    if result_key is not None:
        task_info["result_key"] = result_key

    redis_service.set(task_key, json.dumps(task_info))

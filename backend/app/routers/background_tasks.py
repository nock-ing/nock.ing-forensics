import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.utils.redis_service import RedisService, get_redis_service
from app.auth.dependencies import get_current_active_user
from app.tasks.tasks import perform_transaction_origin_trace

router = APIRouter()


@router.get("/trace-tx-origin", response_model=dict)
def trace_transaction_to_origin(
    txid: str,
    include_tx_details: bool = False,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Trace a Bitcoin transaction back to its origin (coinbase transaction).

    This endpoint returns immediately with a task ID and processes the trace in the background.
    Results can be retrieved using the task ID.
    """
    # Generate a task ID
    task_id = f"task-origin-trace-{txid}-{uuid.uuid4().hex[:8]}"

    # Check if this trace has been completed before
    cache_key = f"tx-origin-trace:{txid}:{include_tx_details}"
    cached_result = redis_service.get(cache_key)

    if cached_result:
        if isinstance(cached_result, dict):
            return {"status": "completed", "task_id": task_id, "result": cached_result}
        return {
            "status": "completed",
            "task_id": task_id,
            "result": json.loads(cached_result),
        }

    # Check if this trace is already in progress
    in_progress_key = f"tx-origin-trace-in-progress:{txid}"
    if redis_service.get(in_progress_key):
        existing_task_id = redis_service.get(in_progress_key)
        return {"status": "in_progress", "task_id": existing_task_id}

    # Set the task as in progress
    redis_service.set(in_progress_key, task_id)

    # Set initial task status
    redis_service.set(
        f"task:{task_id}",
        json.dumps(
            {
                "status": "pending",
                "txid": txid,
                "include_tx_details": include_tx_details,
                "created_at": datetime.utcnow().isoformat(),
                "progress": 0,
            }
        ),
    )

    # Queue the task with Celery
    perform_transaction_origin_trace.delay(txid, include_tx_details, task_id)

    return {
        "status": "pending",
        "task_id": task_id,
        "message": "Transaction origin trace started in background",
    }


@router.get("/trace-tx-origin/status/{task_id}", response_model=dict)
async def get_trace_task_status(
    task_id: str,
    current_user: dict = Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """Get the status of a transaction origin trace task."""
    task_data = redis_service.get(f"task:{task_id}")

    if not task_data:
        raise HTTPException(
            status_code=404, detail=f"Task {task_id} not found or expired"
        )

    task_info = json.loads(task_data) if isinstance(task_data, str) else task_data

    # If task is completed, include the result
    if task_info.get("status") == "completed" and "result_key" in task_info:
        result = redis_service.get(task_info["result_key"])
        if result:
            task_info["result"] = (
                json.loads(result) if isinstance(result, str) else result
            )

    return task_info

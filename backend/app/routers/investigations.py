from fastapi import APIRouter, HTTPException, Depends

from app.database.crud_investigation import (
    create_investigation_crud,
    delete_investigation_crud,
    get_investigations,
    get_investigation,
)
from app.schema.investigation import Investigation
from app.database.database import get_db
from app.auth.dependencies import get_current_active_user
from app.utils.redis_service import RedisService, get_redis_service

router = APIRouter(prefix="/investigations", tags=["investigations"])


@router.get("/")
async def read_investigations(
    db=Depends(get_db), current_user=Depends(get_current_active_user)
):
    """
    Get all investigations.
    """
    investigations = await get_investigations(db)
    if not investigations:
        raise HTTPException(status_code=404, detail="No investigations found")
    return investigations


@router.get("/{investigation_id}")
async def read_investigation(
    investigation_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """
    Get an investigation by ID.
    """
    result = await get_investigation(db, investigation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return result


@router.post("/create")
async def create_investigation(
    investigation: Investigation,
    db=Depends(get_db),
    current_user=Depends(get_current_active_user),
    redis_service: RedisService = Depends(get_redis_service),
):
    """
    Create a new investigation. Returns an ID for the investigation.
    """
    try:
        investigation_id = await create_investigation_crud(db, investigation)

        return {"id": investigation_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete/{investigation_id}")
async def delete_investigation(
    investigation_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """
    Delete an investigation by ID.
    """
    try:
        await delete_investigation_crud(db, investigation_id)
        return {"message": "Investigation deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

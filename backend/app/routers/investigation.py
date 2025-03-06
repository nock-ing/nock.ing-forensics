

from fastapi import APIRouter, HTTPException, Depends

from app.schema.investigation import Investigation
from app.database.database import get_db
from app.auth.dependencies import get_current_active_user



router = APIRouter(prefix="/investigation", tags=["investigation"])

"""

"""
@router.post("/create")
async def create_investigation(
    investigation: Investigation,
    db=Depends(get_db),
    current_user=Depends(get_current_active_user)
    ):
    """
    Create a new investigation. Returns an ID for the investigation.
    """

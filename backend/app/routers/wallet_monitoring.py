from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from pydantic import BaseModel

from app.database.database import get_db
from app.auth.dependencies import get_current_active_user
from app.schema.user import UserBase
from app.models.wallet_monitoring import MonitoredAddress, WalletTransaction
from app.services.mempool_websocket import MempoolWebSocketService
from app.services.background_monitoring import background_service

router = APIRouter(prefix="/wallet-monitoring", tags=["wallet-monitoring"])

class AddressTrackingRequest(BaseModel):
    addresses: List[str]

class SingleAddressRequest(BaseModel):
    address: str
    label: str = None

class MonitoredAddressResponse(BaseModel):
    id: int
    address: str
    label: str = None
    is_active: bool
    created_at: str


class AddressToTrack(BaseModel):
    address: str
    label: Optional[str] = None

class TrackAddressesRequest(BaseModel):
    addresses: List[AddressToTrack]


class WalletTransactionResponse(BaseModel):
    id: int
    txid: str
    address: str
    amount: int
    amount_btc: float
    transaction_type: str
    confirmed: bool
    first_seen: str

@router.post("/track-address", response_model=dict)
async def track_single_address(
    request: SingleAddressRequest,
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Start tracking a single Bitcoin address"""
    try:
        # Check if address is already being monitored by this user
        existing = await db.execute(
            select(MonitoredAddress).where(
                MonitoredAddress.address == request.address,
                MonitoredAddress.user_id == current_user.id
            )
        )
        
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address is already being monitored"
            )
        
        # Create monitored address record
        monitored_address = MonitoredAddress(
            user_id=current_user.id,
            address=request.address,
            label=request.label
        )
        
        db.add(monitored_address)
        await db.commit()
        await db.refresh(monitored_address)
        
        # Add to WebSocket monitoring
        await background_service.add_address(request.address)
        
        return {"message": f"Started tracking address: {request.address}"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to track address: {str(e)}")


@router.post("/track-addresses", response_model=dict)
async def track_addresses(
        addresses_data: TrackAddressesRequest,
        current_user: UserBase = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db),
):
    """Track multiple Bitcoin addresses"""
    try:
        # Store addresses in database
        stored_addresses = []
        for address_data in addresses_data.addresses:
            # Check if address already exists for this user
            result = await db.execute(
                select(MonitoredAddress).where(
                    MonitoredAddress.user_id == current_user.id,
                    MonitoredAddress.address == address_data.address
                )
            )
            existing = result.scalars().first()

            if not existing:
                monitored_address = MonitoredAddress(
                    user_id=current_user.id,
                    address=address_data.address,
                    label=address_data.label
                )
                db.add(monitored_address)
                stored_addresses.append(address_data.address)

        await db.commit()

        # NOW ADD THIS: Track addresses with WebSocket service
        if stored_addresses:
            await background_service.add_addresses(stored_addresses)

        return {
            "message": f"Successfully tracking {len(stored_addresses)} addresses",
            "addresses": stored_addresses
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/addresses", response_model=List[MonitoredAddressResponse])
async def get_monitored_addresses(
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all monitored addresses for the current user"""
    result = await db.execute(
        select(MonitoredAddress).where(
            MonitoredAddress.user_id == current_user.id,
            MonitoredAddress.is_active == True
        )
    )
    addresses = result.scalars().all()
    
    return [
        MonitoredAddressResponse(
            id=addr.id,
            address=addr.address,
            label=addr.label,
            is_active=addr.is_active,
            created_at=addr.created_at.isoformat()
        )
        for addr in addresses
    ]

@router.get("/transactions", response_model=List[WalletTransactionResponse])
async def get_wallet_transactions(
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get wallet transactions for the current user's monitored addresses"""
    result = await db.execute(
        select(WalletTransaction, MonitoredAddress)
        .join(MonitoredAddress)
        .where(MonitoredAddress.user_id == current_user.id)
        .order_by(WalletTransaction.first_seen.desc())
        .offset(skip)
        .limit(limit)
    )
    
    transactions = []
    for tx, addr in result.all():
        transactions.append(
            WalletTransactionResponse(
                id=tx.id,
                txid=tx.txid,
                address=addr.address,
                amount=tx.amount,
                amount_btc=tx.amount / 100_000_000,
                transaction_type=tx.transaction_type,
                confirmed=tx.confirmed,
                first_seen=tx.first_seen.isoformat()
            )
        )
    
    return transactions

@router.delete("/address/{address_id}")
async def stop_monitoring_address(
    address_id: int,
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Stop monitoring a specific address"""
    result = await db.execute(
        select(MonitoredAddress).where(
            MonitoredAddress.id == address_id,
            MonitoredAddress.user_id == current_user.id
        )
    )
    
    address = result.scalars().first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitored address not found"
        )
    
    address.is_active = False
    await db.commit()
    
    return {"message": f"Stopped monitoring address: {address.address}"}

@router.get("/status")
async def get_monitoring_status(
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current monitoring status for the user"""
    result = await db.execute(
        select(MonitoredAddress).where(
            MonitoredAddress.user_id == current_user.id,
            MonitoredAddress.is_active == True
        )
    )
    user_addresses = result.scalars().all()
    
    return {
        "websocket_connected": background_service.mempool_service.is_connected,
        "monitored_addresses_count": len(user_addresses),
        "monitored_addresses": [addr.address for addr in user_addresses]
    }
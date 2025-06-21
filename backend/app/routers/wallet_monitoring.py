from fastapi import APIRouter, HTTPException, Depends, status, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from pydantic import BaseModel
from loguru import logger
from datetime import datetime

from app.database.database import get_db
from app.auth.dependencies import get_current_active_user
from app.schema.user import UserBase
from app.models.wallet_monitoring import MonitoredAddress, WalletTransaction
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
    label: Optional[str] = None  # Make label optional with default None
    is_active: bool
    created_at: datetime

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
            MonitoredAddress.is_active
        )
    )
    addresses = result.scalars().all()
    
    return [
        MonitoredAddressResponse(
            id=addr.id,
            address=addr.address,
            label=addr.label,
            is_active=addr.is_active,
            created_at=addr.created_at
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
            MonitoredAddress.is_active
        )
    )
    user_addresses = result.scalars().all()
    
    return {
        "websocket_connected": background_service.mempool_service.is_connected,
        "monitored_addresses_count": len(user_addresses),
        "monitored_addresses": [addr.address for addr in user_addresses],
        "background_service_running": background_service.is_running,
        "tracked_addresses_in_websocket": list(background_service.mempool_service.tracked_addresses)
    }

@router.post("/debug/test-real-transaction")
async def debug_test_real_transaction(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to test transaction processing with real Mempool data format"""
    
    # This is the actual format from your Mempool WebSocket
    real_transaction_data = {
        "block-transactions": [
            {
                "txid": "3a2d70d3754921aaba6fabbd260086fe78d0f8e00a32bce131c345eb8aab250a",
                "version": 1,
                "locktime": 0,
                "size": 588,
                "weight": 2025,
                "fee": 5070,
                "vin": [
                    {
                        "is_coinbase": False,
                        "prevout": None,
                        "scriptsig": "",
                        "scriptsig_asm": "",
                        "sequence": 4294967295,
                        "txid": "b1719f613c54d5a136a796ac21f1691760866e658a141d76a6b9fa7d5d684744",
                        "vout": 0,
                        "witness": [
                            "304402207da0e91641e64b33402b4c17581065b13e3060d29b6bb8f837b9f08aea6f00c60220411d2ef8db28b8abdc4cb1ceb347f6b53288ec3611589ea35ef2747ed0f17e7701",
                            "02174ee672429ff94304321cdae1fc1e487edf658b34bd1d36da03761658a2bb09"
                        ],
                        "inner_redeemscript_asm": "",
                        "inner_witnessscript_asm": ""
                    }
                ],
                "vout": [
                    {
                        "value": 160733,
                        "scriptpubkey": "0014bd22fb71504d70e36a3ea57afff837301b951c38",
                        "scriptpubkey_address": "bc1qh530ku2sf4cwx63754a0l7phxqde28pc5afm6f",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 bd22fb71504d70e36a3ea57afff837301b951c38",
                        "scriptpubkey_type": "v0_p2wpkh"
                    },
                    {
                        "value": 1278967,
                        "scriptpubkey": "0014dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_type": "v0_p2wpkh"
                    }
                ],
                "status": {
                    "confirmed": True,
                    "block_height": 902161,
                    "block_hash": "0000000000000000000011d35e1793a917d8d52e8bbce650bff5b7323a0ee6b5",
                    "block_time": 1750494309
                },
                "firstSeen": 1750493907
            }
        ]
    }
    
    # Process the real transaction
    await background_service.transaction_processor.process_address_transactions(real_transaction_data)
    
    return {"message": "Real transaction processed", "data": real_transaction_data}

@router.post("/debug/test-address-transaction")
async def debug_test_address_transaction(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to test address-transaction processing"""
    
    # Real address-transactions format from your WebSocket
    address_transaction_data = {
        "address-transactions": [
            {
                "txid": "480f0c1be502da46bf734112437516e2ce6bb51e54873e43bffe6af3936feb4c",
                "version": 1,
                "locktime": 0,
                "size": 510,
                "weight": 1713,
                "fee": 4290,
                "vin": [
                    {
                        "is_coinbase": False,
                        "prevout": {
                            "value": 22578023,
                            "scriptpubkey": "0014dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                            "scriptpubkey_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
                            "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                            "scriptpubkey_type": "v0_p2wpkh"
                        },
                        "scriptsig": "",
                        "scriptsig_asm": "",
                        "sequence": 4294967295,
                        "txid": "af99282fe5b52ec884fc7cd06888cba8866bbb36edd7399acbe81bf403e0d78b",
                        "vout": 1
                    }
                ],
                "vout": [
                    {
                        "value": 1164036,
                        "scriptpubkey": "001491f0656d1b0399e90ab0ede58e33ccf7b97483e4",
                        "scriptpubkey_address": "bc1qj8cx2mgmqwv7jz4sahjcuv7v77uhfqlyljnzww",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 91f0656d1b0399e90ab0ede58e33ccf7b97483e4",
                        "scriptpubkey_type": "v0_p2wpkh"
                    },
                    {
                        "value": 12820810,
                        "scriptpubkey": "0014dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_type": "v0_p2wpkh"
                    }
                ],
                "status": {
                    "confirmed": False
                },
                "firstSeen": 1750494365
            }
        ]
    }
    
    # Process the address transaction
    await background_service.transaction_processor.process_address_transactions(address_transaction_data)
    
    return {
        "message": "Address transaction processed", 
        "transaction_analysis": {
            "txid": "480f0c1be502da46bf734112437516e2ce6bb51e54873e43bffe6af3936feb4c",
            "monitored_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
            "input_amount": 22578023,
            "output_amount": 12820810,
            "net_amount": -9757213,  # Negative = outgoing
            "transaction_type": "outgoing",
            "fee": 4290
        }
    }

@router.post("/debug/test-multi-address-transaction")
async def debug_test_multi_address_transaction(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to test multi-address-transaction processing"""
    
    # Multi-address-transactions format (for when tracking multiple addresses)
    multi_address_transaction_data = {
        "multi-address-transactions": [
            {
                "txid": "test-multi-address-tx-123",
                "version": 1,
                "locktime": 0,
                "size": 510,
                "weight": 1713,
                "fee": 4290,
                "vin": [
                    {
                        "is_coinbase": False,
                        "prevout": {
                            "value": 22578023,
                            "scriptpubkey": "0014dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                            "scriptpubkey_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
                            "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                            "scriptpubkey_type": "v0_p2wpkh"
                        },
                        "scriptsig": "",
                        "scriptsig_asm": "",
                        "sequence": 4294967295,
                        "txid": "af99282fe5b52ec884fc7cd06888cba8866bbb36edd7399acbe81bf403e0d78b",
                        "vout": 1
                    }
                ],
                "vout": [
                    {
                        "value": 1164036,
                        "scriptpubkey": "001491f0656d1b0399e90ab0ede58e33ccf7b97483e4",
                        "scriptpubkey_address": "bc1qj8cx2mgmqwv7jz4sahjcuv7v77uhfqlyljnzww",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 91f0656d1b0399e90ab0ede58e33ccf7b97483e4",
                        "scriptpubkey_type": "v0_p2wpkh"
                    },
                    {
                        "value": 12820810,
                        "scriptpubkey": "0014dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_address": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
                        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 dc6bf86354105de2fcd9868a2b0376d6731cb92f",
                        "scriptpubkey_type": "v0_p2wpkh"
                    }
                ],
                "status": {
                    "confirmed": False
                },
                "firstSeen": 1750494365
            }
        ]
    }
    
    # Process the multi-address transaction
    await background_service.transaction_processor.process_address_transactions(multi_address_transaction_data)
    
    return {
        "message": "Multi-address transaction processed", 
        "format": "multi-address-transactions (for tracking multiple addresses)"
    }

@router.post("/debug/start-monitoring-service")
async def debug_start_monitoring_service(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to manually start the monitoring service"""
    if background_service.is_running:
        return {"message": "Background monitoring service is already running"}
    
    try:
        # Start the service in the background
        import asyncio
        asyncio.create_task(background_service.start())
        
        # Give it a moment to start
        await asyncio.sleep(2)
        
        return {
            "message": "Background monitoring service started",
            "status": {
                "running": background_service.is_running,
                "websocket_connected": background_service.mempool_service.is_connected,
                "tracked_addresses": list(background_service.mempool_service.tracked_addresses)
            }
        }
    except Exception as e:
        return {"error": f"Failed to start monitoring service: {e}"}

@router.post("/debug/check-websocket-connection")
async def debug_check_websocket_connection(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to check WebSocket connection status"""
    
    # Try to connect manually if not connected
    if not background_service.mempool_service.is_connected:
        logger.info("WebSocket not connected, attempting to connect...")
        await background_service.mempool_service.connect()
    
    return {
        "websocket_connected": background_service.mempool_service.is_connected,
        "websocket_url": background_service.mempool_service.websocket_url,
        "tracked_addresses": list(background_service.mempool_service.tracked_addresses),
        "background_service_running": background_service.is_running,
        "message_handlers_count": len(background_service.mempool_service.message_handlers)
    }

@router.post("/debug/force-track-addresses")
async def debug_force_track_addresses(
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to force re-track all monitored addresses"""
    
    # Get all monitored addresses for this user
    result = await db.execute(
        select(MonitoredAddress).where(
            MonitoredAddress.user_id == current_user.id,
            MonitoredAddress.is_active
        )
    )
    addresses = result.scalars().all()
    
    if not addresses:
        return {"message": "No monitored addresses found for this user"}
    
    address_list = [addr.address for addr in addresses]
    
    # Ensure WebSocket is connected
    if not background_service.mempool_service.is_connected:
        await background_service.mempool_service.connect()
    
    # Track addresses
    await background_service.mempool_service.track_addresses(address_list)
    
    return {
        "message": f"Force tracking {len(address_list)} addresses",
        "addresses": address_list,
        "websocket_connected": background_service.mempool_service.is_connected,
        "tracked_addresses": list(background_service.mempool_service.tracked_addresses)
    }

@router.post("/switch-tracking-address")
async def switch_tracking_address(
    request: SingleAddressRequest,
    current_user: UserBase = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Switch WebSocket tracking to a specific address"""
    
    # Verify the address belongs to the current user
    result = await db.execute(
        select(MonitoredAddress).where(
            MonitoredAddress.address == request.address,
            MonitoredAddress.user_id == current_user.id,
            MonitoredAddress.is_active
        )
    )
    
    address = result.scalars().first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found or not owned by current user"
        )
    
    # Switch tracking to this address
    await background_service.switch_to_address(request.address)
    
    return {
        "message": f"Switched tracking to address: {request.address}",
        "status": background_service.get_status()
    }

@router.get("/tracking-status")
async def get_tracking_status(
    current_user: UserBase = Depends(get_current_active_user)
):
    """Get current tracking status"""
    return {
        "tracking_status": background_service.get_status(),
        "note": "Due to Mempool API limitations, only 1 address can be tracked at a time via WebSocket"
    }

@router.post("/debug/track-single-address")
async def debug_track_single_address(
    request: SingleAddressRequest,
    current_user: UserBase = Depends(get_current_active_user)
):
    """Debug endpoint to track a single address"""
    
    # Ensure WebSocket is connected
    if not background_service.mempool_service.is_connected:
        await background_service.mempool_service.connect()
    
    # Track the address
    await background_service.switch_to_address(request.address)
    
    return {
        "message": f"Now tracking address: {request.address}",
        "status": background_service.get_status()
    }

# In wallet_monitoring.py router
@router.websocket("/ws/transactions/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    # Add websocket to a connection manager
    # Forward transaction updates to connected clients

# Connection manager to handle multiple frontend connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
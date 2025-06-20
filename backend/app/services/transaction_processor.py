import asyncio
import json
import logging
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.database import get_db
from app.models.wallet_monitoring import WalletTransaction, MonitoredAddress

logger = logging.getLogger(__name__)

class TransactionProcessor:
    def __init__(self):
        pass
    
    async def process_address_transactions(self, data: Dict[str, Any]):
        """Process incoming address-transactions message from Mempool"""
        try:
            if "address-transactions" not in data:
                return
            
            transactions = data["address-transactions"]
            
            # Get database session
            async for db in get_db():
                try:
                    for tx_data in transactions:
                        await self._process_single_transaction(db, tx_data)
                    await db.commit()
                except Exception as e:
                    await db.rollback()
                    logger.error(f"Error processing transactions: {e}")
                finally:
                    break  # Exit the async generator
                
        except Exception as e:
            logger.error(f"Error processing address transactions: {e}")
    
    async def _process_single_transaction(self, db: AsyncSession, tx_data: Dict[str, Any]):
        """Process a single transaction"""
        try:
            txid = tx_data.get("txid")
            if not txid:
                return
            
            # Check if transaction already exists
            existing_tx = await db.execute(
                select(WalletTransaction).where(WalletTransaction.txid == txid)
            )
            if existing_tx.scalars().first():
                logger.debug(f"Transaction {txid} already processed")
                return
            
            # Extract addresses from transaction
            affected_addresses = self._extract_addresses_from_transaction(tx_data)
            
            # Find monitored addresses
            monitored_addresses_result = await db.execute(
                select(MonitoredAddress).where(
                    MonitoredAddress.address.in_(affected_addresses),
                    MonitoredAddress.is_active == True
                )
            )
            monitored_addresses = monitored_addresses_result.scalars().all()
            
            if not monitored_addresses:
                return
            
            # Process transaction for each monitored address
            for monitored_address in monitored_addresses:
                await self._create_wallet_transaction(db, tx_data, monitored_address)
            
        except Exception as e:
            logger.error(f"Error processing transaction {tx_data.get('txid', 'unknown')}: {e}")
    
    def _extract_addresses_from_transaction(self, tx_data: Dict[str, Any]) -> List[str]:
        """Extract all addresses involved in the transaction"""
        addresses = []
        
        # Extract from outputs (vout)
        for vout in tx_data.get("vout", []):
            address = vout.get("scriptpubkey_address")
            if address:
                addresses.append(address)
        
        # Extract from inputs (vin) - from prevout
        for vin in tx_data.get("vin", []):
            prevout = vin.get("prevout", {})
            address = prevout.get("scriptpubkey_address")
            if address:
                addresses.append(address)
        
        return list(set(addresses))  # Remove duplicates
    
    async def _create_wallet_transaction(
        self, 
        db: AsyncSession, 
        tx_data: Dict[str, Any], 
        monitored_address: MonitoredAddress
    ):
        """Create a wallet transaction record"""
        try:
            # Calculate amount and determine transaction type
            amount, tx_type = self._calculate_amount_and_type(tx_data, monitored_address.address)
            
            wallet_transaction = WalletTransaction(
                monitored_address_id=monitored_address.id,
                txid=tx_data["txid"],
                block_height=None,  # Will be updated when confirmed
                confirmed=tx_data.get("status", {}).get("confirmed", False),
                amount=amount,
                fee=tx_data.get("fee", 0),
                transaction_type=tx_type,
                first_seen=datetime.fromtimestamp(tx_data.get("firstSeen", 0)),
                raw_data=json.dumps(tx_data)
            )
            
            db.add(wallet_transaction)
            
            # Send notification
            await self._send_notification(wallet_transaction, monitored_address)
            
        except Exception as e:
            logger.error(f"Error creating wallet transaction: {e}")
    
    def _calculate_amount_and_type(self, tx_data: Dict[str, Any], address: str) -> tuple[int, str]:
        """Calculate amount and determine if it's incoming or outgoing"""
        input_amount = 0
        output_amount = 0
        
        # Check inputs for the address
        for vin in tx_data.get("vin", []):
            prevout = vin.get("prevout", {})
            if prevout.get("scriptpubkey_address") == address:
                input_amount += prevout.get("value", 0)
        
        # Check outputs for the address
        for vout in tx_data.get("vout", []):
            if vout.get("scriptpubkey_address") == address:
                output_amount += vout.get("value", 0)
        
        # Determine type and net amount
        net_amount = output_amount - input_amount
        tx_type = "incoming" if net_amount > 0 else "outgoing"
        
        return abs(net_amount), tx_type
    
    async def _send_notification(self, wallet_transaction: WalletTransaction, monitored_address: MonitoredAddress):
        """Send notification for the transaction"""
        try:
            notification_data = {
                "type": "wallet_transaction",
                "txid": wallet_transaction.txid,
                "address": monitored_address.address,
                "address_label": monitored_address.label,
                "amount": wallet_transaction.amount,
                "amount_btc": wallet_transaction.amount / 100_000_000,  # Convert to BTC
                "fee": wallet_transaction.fee,
                "transaction_type": wallet_transaction.transaction_type,
                "confirmed": wallet_transaction.confirmed,
                "timestamp": wallet_transaction.first_seen.isoformat()
            }
            
            logger.info(f"New wallet transaction notification: {notification_data}")
            
            # Here you would emit to WebSocket clients or queue for notifications
            # await self._emit_to_websocket_clients(notification_data)
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
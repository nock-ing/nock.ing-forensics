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
        """Process incoming WebSocket message from Mempool"""
        try:
            # Log all incoming messages for debugging
            logger.info(f"Received WebSocket message: {json.dumps(data, indent=2)}")
            
            # Check for different possible message formats based on Mempool docs:
            # - single address tracking: "block-transactions"  
            # - multi address tracking: "multi-address-transactions"
            transactions = None
            
            if "multi-address-transactions" in data:
                transactions = data["multi-address-transactions"]
                logger.info(f"Found multi-address-transactions with {len(transactions)} transactions")
            elif "block-transactions" in data:
                transactions = data["block-transactions"]
                logger.info(f"Found block-transactions with {len(transactions)} transactions")
            elif "address-transactions" in data:
                # This might be from your test data or different API version
                transactions = data["address-transactions"]
                logger.info(f"Found address-transactions with {len(transactions)} transactions")
            elif "transactions" in data:
                transactions = data["transactions"]
                logger.info(f"Found transactions with {len(transactions)} transactions")
            elif "transaction" in data:
                transactions = [data["transaction"]]
                logger.info("Found single transaction")
            else:
                logger.warning(f"No recognized transaction format in message: {list(data.keys())}")
                return
            
            if not transactions:
                logger.warning("No transactions found in message")
                return
            
            # Get database session
            async for db in get_db():
                try:
                    processed_count = 0
                    for tx_data in transactions:
                        if await self._process_single_transaction(db, tx_data):
                            processed_count += 1
                    
                    await db.commit()
                    logger.info(f"Successfully processed {processed_count} transactions")
                except Exception as e:
                    await db.rollback()
                    logger.error(f"Error processing transactions: {e}")
                    raise
                finally:
                    break  # Exit the async generator
                
        except Exception as e:
            logger.error(f"Error processing address transactions: {e}")
    
    async def _process_single_transaction(self, db: AsyncSession, tx_data: Dict[str, Any]) -> bool:
        """Process a single transaction"""
        try:
            logger.info(f"Processing transaction: {tx_data.get('txid', 'unknown')}")
            
            txid = tx_data.get("txid")
            if not txid:
                logger.warning("No txid found in transaction data")
                return False
            
            # Check if transaction already exists
            existing_tx = await db.execute(
                select(WalletTransaction).where(WalletTransaction.txid == txid)
            )
            if existing_tx.scalars().first():
                logger.debug(f"Transaction {txid} already processed")
                return False
            
            # Extract addresses from transaction
            affected_addresses = self._extract_addresses_from_transaction(tx_data)
            logger.info(f"Extracted addresses from transaction {txid}: {affected_addresses}")
            
            if not affected_addresses:
                logger.warning(f"No addresses extracted from transaction {txid}")
                return False
            
            # Find monitored addresses
            monitored_addresses_result = await db.execute(
                select(MonitoredAddress).where(
                    MonitoredAddress.address.in_(affected_addresses),
                    MonitoredAddress.is_active
                )
            )
            monitored_addresses = monitored_addresses_result.scalars().all()
            
            if not monitored_addresses:
                logger.debug(f"No monitored addresses found for transaction {txid}. Affected addresses: {affected_addresses}")
                return False
            
            logger.info(f"Processing transaction {txid} for {len(monitored_addresses)} monitored addresses")
            
            # Process transaction for each monitored address
            for monitored_address in monitored_addresses:
                await self._create_wallet_transaction(db, tx_data, monitored_address)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing transaction {tx_data.get('txid', 'unknown')}: {e}")
            return False
    
    def _extract_addresses_from_transaction(self, tx_data: Dict[str, Any]) -> List[str]:
        """Extract all addresses involved in the transaction"""
        addresses = []
        
        # Extract from outputs (vout)
        for vout in tx_data.get("vout", []):
            address = vout.get("scriptpubkey_address")
            if address:
                addresses.append(address)
        
        # Extract from inputs (vin) - these might not have prevout data in block-transactions
        for vin in tx_data.get("vin", []):
            # Try to get from prevout if available
            prevout = vin.get("prevout")
            if prevout and isinstance(prevout, dict):
                address = prevout.get("scriptpubkey_address")
                if address:
                    addresses.append(address)
        
        # Also check if there's an "inputs" field (from your example data)
        for input_data in tx_data.get("inputs", []):
            if isinstance(input_data, dict):
                address = input_data.get("scriptpubkey_address")
                if address:
                    addresses.append(address)
        
        unique_addresses = list(set(addresses))  # Remove duplicates
        logger.debug(f"Extracted addresses: {unique_addresses}")
        return unique_addresses
    
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
            
            # Handle timestamp - try different fields
            timestamp = tx_data.get("firstSeen")
            if not timestamp:
                # Try status.block_time for confirmed transactions
                status = tx_data.get("status")
                if status and isinstance(status, dict):
                    timestamp = status.get("block_time")
            
            if timestamp:
                first_seen = datetime.fromtimestamp(timestamp)
            else:
                first_seen = datetime.now()
            
            # Get status information safely
            status = tx_data.get("status")
            if status and isinstance(status, dict):
                confirmed = status.get("confirmed", False)
                block_height = status.get("block_height") if confirmed else None
            else:
                # For block-transactions, assume confirmed if no status
                confirmed = True
                block_height = None
            
            wallet_transaction = WalletTransaction(
                monitored_address_id=monitored_address.id,
                txid=tx_data["txid"],
                block_height=block_height,
                confirmed=confirmed,
                amount=amount,
                fee=tx_data.get("fee", 0),
                transaction_type=tx_type,
                first_seen=first_seen,
                raw_data=json.dumps(tx_data)
            )
            
            db.add(wallet_transaction)
            logger.info(f"Created wallet transaction: {wallet_transaction.txid} for address {monitored_address.address} - {tx_type} {amount} sats")
            
            # Send notification
            await self._send_notification(wallet_transaction, monitored_address)
            
        except Exception as e:
            logger.error(f"Error creating wallet transaction: {e}")
            raise
    
    def _calculate_amount_and_type(self, tx_data: Dict[str, Any], address: str) -> tuple[int, str]:
        """Calculate amount and determine if it's incoming or outgoing"""
        input_amount = 0
        output_amount = 0
        
        # Check inputs for the address
        for vin in tx_data.get("vin", []):
            prevout = vin.get("prevout")
            if prevout and isinstance(prevout, dict) and prevout.get("scriptpubkey_address") == address:
                input_amount += prevout.get("value", 0)
        
        # Also check the "inputs" field if it exists
        for input_data in tx_data.get("inputs", []):
            if isinstance(input_data, dict) and input_data.get("scriptpubkey_address") == address:
                input_amount += input_data.get("value", 0)
        
        # Check outputs for the address
        for vout in tx_data.get("vout", []):
            if vout.get("scriptpubkey_address") == address:
                output_amount += vout.get("value", 0)
        
        # Determine type and net amount
        net_amount = output_amount - input_amount
        tx_type = "incoming" if net_amount > 0 else "outgoing"
        
        # If both are 0, it might be a transaction that doesn't directly affect the balance
        # but the address is involved somehow
        if net_amount == 0:
            # If the address appears in outputs, consider it incoming for the output amount
            if output_amount > 0:
                net_amount = output_amount
                tx_type = "incoming"
            elif input_amount > 0:
                net_amount = input_amount
                tx_type = "outgoing"
        
        logger.debug(f"Address {address}: input={input_amount}, output={output_amount}, net={net_amount}, type={tx_type}")
        
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
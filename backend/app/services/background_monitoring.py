import asyncio
import logging
from app.services.mempool_websocket import MempoolWebSocketService
from app.services.transaction_processor import TransactionProcessor
from app.database.database import get_db
from app.models.wallet_monitoring import MonitoredAddress
from sqlmodel import select

logger = logging.getLogger(__name__)


class BackgroundMonitoringService:
    def __init__(self):
        self.mempool_service = MempoolWebSocketService()
        self.transaction_processor = TransactionProcessor()
        self.is_running = False

    async def start(self):
        """Start the background monitoring service"""
        if self.is_running:
            logger.warning("Background monitoring service is already running")
            return

        self.is_running = True

        # Add message handler
        self.mempool_service.add_message_handler(
            self.transaction_processor.process_address_transactions
        )

        # Load and track existing addresses from database
        await self._load_existing_addresses()

        # Start the WebSocket service with reconnection
        try:
            await self.mempool_service.start_with_reconnect()
        except Exception as e:
            logger.error(f"Background monitoring service error: {e}")
        finally:
            self.is_running = False

    async def _load_existing_addresses(self):
        """Load existing monitored addresses from database and start tracking them"""
        try:
            async for db in get_db():
                result = await db.execute(
                    select(MonitoredAddress).where(MonitoredAddress.is_active == True)
                )
                addresses = result.scalars().all()

                if addresses:
                    address_list = [addr.address for addr in addresses]
                    await self.mempool_service.track_addresses(address_list)
                    logger.info(f"Loaded and started tracking {len(address_list)} existing addresses")
                break
        except Exception as e:
            logger.error(f"Error loading existing addresses: {e}")

    async def stop(self):
        """Stop the background monitoring service"""
        self.is_running = False
        await self.mempool_service.disconnect()

    async def add_address(self, address: str):
        """Add an address to monitor"""
        await self.mempool_service.track_address(address)

    async def add_addresses(self, addresses: list):
        """Add multiple addresses to monitor"""
        await self.mempool_service.track_addresses(addresses)


# Global instance
background_service = BackgroundMonitoringService()
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
        self.currently_tracking_address = None

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

        # Load and track the first address from database
        await self._load_and_track_first_address()

        # Start the WebSocket service with reconnection
        try:
            await self.mempool_service.start_with_reconnect()
        except Exception as e:
            logger.error(f"Background monitoring service error: {e}")
        finally:
            self.is_running = False

    async def _load_and_track_first_address(self):
        """Load the first monitored address from database and start tracking it"""
        try:
            async for db in get_db():
                result = await db.execute(
                    select(MonitoredAddress)
                    .where(MonitoredAddress.is_active)
                    .limit(1)  # Only get the first address
                )
                address = result.scalars().first()

                if address:
                    await self.mempool_service.track_address(address.address)
                    self.currently_tracking_address = address.address
                    logger.info(f"Started tracking address: {address.address}")
                else:
                    logger.info("No monitored addresses found in database")
                break
        except Exception as e:
            logger.error(f"Error loading address: {e}")

    async def stop(self):
        """Stop the background monitoring service"""
        self.is_running = False
        await self.mempool_service.disconnect()

    async def switch_to_address(self, address: str):
        """Switch tracking to a different address"""
        if not self.mempool_service.is_connected:
            logger.warning("WebSocket not connected, cannot switch address")
            return

        try:
            # The WebSocket API automatically stops tracking the previous address
            # when you send a new track-address command
            await self.mempool_service.track_address(address)
            self.currently_tracking_address = address
            logger.info(f"Switched tracking to address: {address}")
        except Exception as e:
            logger.error(f"Failed to switch to address {address}: {e}")

    async def add_address(self, address: str):
        """Add an address to monitor (and switch to tracking it)"""
        await self.switch_to_address(address)

    async def add_addresses(self, addresses: list):
        """Add multiple addresses to monitor (track the first one)"""
        if addresses:
            await self.switch_to_address(addresses[0])
            logger.info(f"Added {len(addresses)} addresses, now tracking: {addresses[0]}")

    def get_status(self):
        """Get current monitoring status"""
        return {
            "is_running": self.is_running,
            "websocket_connected": self.mempool_service.is_connected,
            "currently_tracking": self.currently_tracking_address,
            "tracked_addresses_in_websocket": list(self.mempool_service.tracked_addresses)
        }


# Global instance
background_service = BackgroundMonitoringService()
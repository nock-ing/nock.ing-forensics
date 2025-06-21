import asyncio
import json
import logging
from typing import List, Dict, Any, Callable
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)

class MempoolWebSocketService:
    def __init__(self, websocket_url: str = "ws://localhost:3006/api/v1/ws"):
        self.websocket_url = websocket_url
        self.websocket = None
        self.is_connected = False
        self.tracked_addresses = set()
        self.message_handlers = []
        self._reconnect_delay = 5  # seconds
        self._max_reconnect_attempts = 5

    async def connect(self):
        """Establish WebSocket connection to Mempool API"""
        try:
            logger.info(f"Attempting to connect to {self.websocket_url}")
            self.websocket = await websockets.connect(self.websocket_url)
            self.is_connected = True
            logger.info(f"Connected to Mempool WebSocket at {self.websocket_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Mempool WebSocket: {e}")
            self.is_connected = False
            return False

    async def disconnect(self):
        """Close WebSocket connection"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            logger.info("Disconnected from Mempool WebSocket")

    async def track_address(self, address: str):
        """Track a single Bitcoin address"""
        if not self.is_connected:
            logger.info("Not connected, attempting to connect...")
            await self.connect()

        if not self.is_connected:
            logger.error("Cannot track address - not connected to WebSocket")
            return

        try:
            message = {"track-address": address}
            logger.info(f"Sending track-address message: {message}")
            await self.websocket.send(json.dumps(message))
            self.tracked_addresses.add(address)
            logger.info(f"Started tracking address: {address}")
        except Exception as e:
            logger.error(f"Failed to track address {address}: {e}")

    async def track_addresses(self, addresses: List[str]):
        """Track multiple Bitcoin addresses"""
        if not self.is_connected:
            logger.info("Not connected, attempting to connect...")
            await self.connect()

        if not self.is_connected:
            logger.error("Cannot track addresses - not connected to WebSocket")
            return

        try:
            message = {"track-addresses": addresses}
            logger.info(f"Sending track-addresses message: {message}")
            await self.websocket.send(json.dumps(message))
            self.tracked_addresses.update(addresses)
            logger.info(f"Started tracking {len(addresses)} addresses: {addresses}")
        except Exception as e:
            logger.error(f"Failed to track addresses: {e}")

    def add_message_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Add a message handler function"""
        self.message_handlers.append(handler)
        logger.info(f"Added message handler: {handler.__name__}")

    async def listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        logger.info("Starting to listen for WebSocket messages...")
        while self.is_connected:
            try:
                if not self.websocket:
                    logger.warning("WebSocket connection is None")
                    break

                message = await self.websocket.recv()
                logger.info(f"Received raw WebSocket message: {message}")
                
                try:
                    data = json.loads(message)
                    logger.info(f"Parsed WebSocket message: {json.dumps(data, indent=2)}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON message: {e}, raw message: {message}")
                    continue

                # Process the message through all handlers
                for handler in self.message_handlers:
                    try:
                        logger.info(f"Processing message with handler: {handler.__name__}")
                        await handler(data)
                    except Exception as e:
                        logger.error(f"Error in message handler {handler.__name__}: {e}")

            except ConnectionClosed:
                logger.warning("WebSocket connection closed")
                self.is_connected = False
                break
            except WebSocketException as e:
                logger.error(f"WebSocket error: {e}")
                self.is_connected = False
                break
            except Exception as e:
                logger.error(f"Unexpected error in message listener: {e}")

    async def start_with_reconnect(self):
        """Start the WebSocket service with automatic reconnection"""
        attempt = 0
        while attempt < self._max_reconnect_attempts:
            try:
                logger.info(f"Starting WebSocket service (attempt {attempt + 1})")
                if await self.connect():
                    # Start listening for messages
                    await self.listen_for_messages()

                # If we get here, connection was lost
                attempt += 1
                if attempt < self._max_reconnect_attempts:
                    logger.info(f"Reconnecting in {self._reconnect_delay} seconds... (attempt {attempt})")
                    await asyncio.sleep(self._reconnect_delay)
            except Exception as e:
                logger.error(f"Error in WebSocket service: {e}")
                attempt += 1
                await asyncio.sleep(self._reconnect_delay)

        logger.error("Max reconnection attempts reached. WebSocket service stopped.")
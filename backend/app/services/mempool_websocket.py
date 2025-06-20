import asyncio
import json
import logging
from typing import List, Dict, Any, Optional, Callable
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
            await self.connect()

        try:
            message = {"track-address": address}
            await self.websocket.send(json.dumps(message))
            self.tracked_addresses.add(address)
            logger.info(f"Started tracking address: {address}")
        except Exception as e:
            logger.error(f"Failed to track address {address}: {e}")

    async def track_addresses(self, addresses: List[str]):
        """Track multiple Bitcoin addresses"""
        if not self.is_connected:
            await self.connect()

        try:
            message = {"track-addresses": addresses}
            await self.websocket.send(json.dumps(message))
            self.tracked_addresses.update(addresses)
            logger.info(f"Started tracking {len(addresses)} addresses")
        except Exception as e:
            logger.error(f"Failed to track addresses: {e}")

    def add_message_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Add a message handler function"""
        self.message_handlers.append(handler)

    async def listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        while self.is_connected:
            try:
                if not self.websocket:
                    break

                message = await self.websocket.recv()
                data = json.loads(message)

                # Process the message through all handlers
                for handler in self.message_handlers:
                    try:
                        await handler(data)
                    except Exception as e:
                        logger.error(f"Error in message handler: {e}")

            except ConnectionClosed:
                logger.warning("WebSocket connection closed")
                self.is_connected = False
                break
            except WebSocketException as e:
                logger.error(f"WebSocket error: {e}")
                self.is_connected = False
                break
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON message: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in message listener: {e}")

    async def start_with_reconnect(self):
        """Start the WebSocket service with automatic reconnection"""
        attempt = 0
        while attempt < self._max_reconnect_attempts:
            try:
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
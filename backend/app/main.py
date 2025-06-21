import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth, 
    users, 
    transactions, 
    investigations, 
    price, 
    redis, 
    rpc_node, 
    wallets,
    wallet_monitoring,
    background_tasks
)
from app.services.background_monitoring import background_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Background task for the monitoring service
background_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    global background_task
    
    # Startup
    logger.info("Starting application...")
    
    # Start the background monitoring service
    logger.info("Starting background monitoring service...")
    background_task = asyncio.create_task(background_service.start())
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    # Stop the background monitoring service
    if background_task:
        logger.info("Stopping background monitoring service...")
        await background_service.stop()
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            logger.info("Background monitoring service stopped")

app = FastAPI(
    title="Bitcoin Analysis API",
    description="API for Bitcoin blockchain analysis and monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(investigations.router)
app.include_router(price.router)
app.include_router(redis.router)
app.include_router(rpc_node.router)
app.include_router(wallets.router)
app.include_router(wallet_monitoring.router)
app.include_router(background_tasks.router)

@app.get("/")
async def root():
    return {
        "message": "Bitcoin Analysis API",
        "version": "1.0.0",
        "monitoring_status": {
            "background_service_running": background_service.is_running,
            "websocket_connected": background_service.mempool_service.is_connected,
            "tracked_addresses": list(background_service.mempool_service.tracked_addresses)
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "background_service": {
            "running": background_service.is_running,
            "websocket_connected": background_service.mempool_service.is_connected,
            "tracked_addresses_count": len(background_service.mempool_service.tracked_addresses)
        }
    }
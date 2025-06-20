from fastapi import FastAPI
import os
import asyncio
from contextlib import asynccontextmanager
from app.routers import wallet_monitoring
from app.services.background_monitoring import background_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Start background monitoring service
    task = asyncio.create_task(background_service.start())
    yield
    # Shutdown
    await background_service.stop()
    task.cancel()

app = FastAPI(lifespan=lifespan)

from app.routers import (
    auth,
    redis,
    users,
    rpc_node,
    investigations,
    background_tasks,
    price,
    wallets, 
    transactions,
)
from dotenv import load_dotenv

load_dotenv()

app.include_router(auth.router, tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(rpc_node.router, tags=["rpc_node"])
app.include_router(redis.router, tags=["redis"])
app.include_router(investigations.router)
app.include_router(price.router, tags=["price"])
app.include_router(background_tasks.router, tags=["Background Tasks"])
app.include_router(wallets.router, tags=["wallets db routes"])
app.include_router(transactions.router, tags=["transactions"])

# Include the wallet monitoring router with authentication
app.include_router(wallet_monitoring.router, tags=["wallet-monitoring"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
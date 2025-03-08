from fastapi import FastAPI

from app.routers import auth, redis, users, rpc_node, investigation
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.include_router(auth.router, tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(rpc_node.router, tags=["rpc_node"])
app.include_router(redis.router, tags=["redis"])
app.include_router(investigation.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

import redis
from app.config.config import settings

# Initialize Redis Connection
pool = redis.ConnectionPool(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
r = redis.Redis(connection_pool=pool)

try:
    r.ping()
    print("Connected to Redis!")
except redis.exceptions.ConnectionError:
    print("Redis connection failed.")


def get_redis():
    return r

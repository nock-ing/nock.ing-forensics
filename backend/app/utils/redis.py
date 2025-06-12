import redis
from app.config.config import settings

r = redis.from_url(settings.REDIS_URL)

try:
    r.ping()
    print("Connected to Redis!")
except redis.exceptions.ConnectionError:
    print("Redis connection failed.")

def get_redis():
    return r
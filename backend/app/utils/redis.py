import redis
from app.config.config import settings
import sys

print(f"Attempting to connect to Redis with URL: {settings.REDIS_URL}")

try:
    # Initialize Redis Connection using URL
    r = redis.from_url(settings.REDIS_URL)

    # Test connection
    r.ping()
    print("Connected to Redis successfully!")
except redis.exceptions.ConnectionError as e:
    print(f"Redis connection failed: {e}")
    print(f"Redis URL being used: {settings.REDIS_URL}")
    # Don't exit, let the app start but warn about Redis issues
    r = None
except Exception as e:
    print(f"Unexpected Redis error: {e}")
    r = None


def get_redis():
    if r is None:
        # Try to reconnect
        try:
            new_r = redis.from_url(settings.REDIS_URL)
            new_r.ping()
            print("Redis reconnected successfully!")
            return new_r
        except Exception as e:
            print(f"Redis still unavailable: {e}")
            raise ConnectionError(f"Redis connection failed: {e}")
    return r
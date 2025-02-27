from fastapi import Depends
from app.utils.redis import get_redis

class RedisService:
    def __init__(self, redis_client):
        self.redis = redis_client

    def get(self, key):
        value = self.redis.get(key)
        if value:
            return value.decode()
        return []

    def set(self, key, value, expiry=600):
        self.redis.setex(key, expiry, value)

    def lpush_trim(self, key, value, limit=10):
        self.redis.lpush(key, value)
        self.redis.ltrim(key, 0, limit - 1)
    
    def lrange(self, key, start, end):
        return self.redis.lrange(key, start, end)

    def get_recent_list(self, key, limit=10):
        return [item.decode() for item in self.redis.lrange(key, 0, limit - 1)]

def get_redis_service():
    redis = get_redis()
    return RedisService(redis)

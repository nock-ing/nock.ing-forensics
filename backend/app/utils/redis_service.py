from app.utils.redis import get_redis
import json

class RedisService:
    def __init__(self, redis_client):
        self.redis = redis_client

    def get(self, key):
        value = self.redis.get(key)
        if value:
            return value.decode()
        return None

    def set(self, key, value, expiry=None):
        if expiry != None:
            self.redis.setex(key, expiry, value)
        else:
            self.redis.set(key, value)
    
    def delete(self, key):
        self.redis.delete(key)
    
    def lpush_trim(self, key, value, limit=10):
        self.redis.lpush(key, value)
        self.redis.ltrim(key, 0, limit - 1)
    
    def lrange(self, key, start, end):
        return self.redis.lrange(key, start, end)

    def get_recent_list(self, key, limit=10):
        items = self.redis.lrange(key, 0, limit - 1)
        result = []
        for item in items:
            try:
                parsed = json.loads(item.decode())
                if isinstance(parsed, dict):
                    result.append(parsed)
            except json.JSONDecodeError:
                continue
        return result

    def empty_redis(self):
        self.redis.flushdb()

def get_redis_service():
    redis = get_redis()
    return RedisService(redis)

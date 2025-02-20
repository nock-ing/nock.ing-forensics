import redis

# Initialize Redis Connection
pool = redis.ConnectionPool(host='redis', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

def get_redis():
    return r

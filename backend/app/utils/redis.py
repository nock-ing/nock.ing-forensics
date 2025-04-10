import redis

# Initialize Redis Connection
pool = redis.ConnectionPool(host="localhost", port=16379, db=0)
r = redis.Redis(connection_pool=pool)

try:
    r.ping()
    print("Connected to Redis!")
except redis.exceptions.ConnectionError:
    print("Redis connection failed.")


def get_redis():
    return r

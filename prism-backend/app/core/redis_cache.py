import redis
from app.core.config import settings

class RedisCache:
    def __init__(self):
        self.client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def set(self, key, value, ex=None):
        return self.client.set(key, value, ex=ex)

    def get(self, key):
        return self.client.get(key)

    def delete(self, key):
        return self.client.delete(key)

redis_cache = RedisCache()

import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        try:
            self.client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            self.client.ping()
            logger.info("✅ Redis connection established")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}. OTP storage will use in-memory fallback.")
            self.client = None

    def set(self, key, value, ex=None):
        if self.client is None:
            return False
        try:
            return self.client.set(key, value, ex=ex)
        except Exception as e:
            logger.warning(f"Redis SET failed for key {key}: {e}")
            return False

    def get(self, key):
        if self.client is None:
            return None
        try:
            return self.client.get(key)
        except Exception as e:
            logger.warning(f"Redis GET failed for key {key}: {e}")
            return None

    def delete(self, key):
        if self.client is None:
            return 0
        try:
            return self.client.delete(key)
        except Exception as e:
            logger.warning(f"Redis DELETE failed for key {key}: {e}")
            return 0

redis_cache = RedisCache()

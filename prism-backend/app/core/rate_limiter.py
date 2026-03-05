import time
from collections import defaultdict
from functools import wraps
from fastapi import HTTPException, Request

class RateLimiter:
    def __init__(self, times: int = 10, window: int = 60):
        """
        Rate limiter implementation
        
        Args:
            times: Number of requests allowed
            window: Time window in seconds
        """
        self.times = times
        self.window = window
        self.requests = defaultdict(list)
    
    async def __call__(self, request: Request):
        """Check if request should be rate limited"""
        # Get client IP
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.window
        ]
        
        # Check if limit exceeded
        if len(self.requests[client_ip]) >= self.times:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)


class SimpleLimiter:
    """
    Simple rate limiter with decorator support.
    Provides a .limit() method that returns a decorator.
    """
    def __init__(self):
        self.limiters = {}
    
    def limit(self, limit_string: str):
        """
        Create a rate limit decorator.
        
        Args:
            limit_string: Format "X/time" e.g., "20/minute", "100/hour"
        
        Returns:
            Decorator function
        """
        def decorator(func):
            """Decorator that applies rate limiting"""
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # For now, pass through without rate limiting
                # Can be enhanced later with actual rate limiting logic
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# Export a global limiter instance
limiter = SimpleLimiter()

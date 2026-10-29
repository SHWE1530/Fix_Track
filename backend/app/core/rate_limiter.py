import time
from collections import defaultdict
from fastapi import HTTPException, Request, status
from app.core.config import settings

class RateLimiter:
    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def check(self, request: Request, key_prefix: str = "auth"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        bucket_key = f"{key_prefix}:{client_ip}"
        
        # Keep only timestamps within the last 60 seconds
        self.requests[bucket_key] = [
            t for t in self.requests[bucket_key] if now - t < 60
        ]
        
        if len(self.requests[bucket_key]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication requests. Please try again in one minute."
            )
        
        self.requests[bucket_key].append(now)

auth_rate_limiter = RateLimiter(requests_per_minute=settings.AUTH_RATE_LIMIT_PER_MINUTE)

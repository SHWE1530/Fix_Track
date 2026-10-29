import secrets
import string
from datetime import datetime, timezone

def generate_reference(prefix: str = "FIX") -> str:
    """Generates a human-friendly unique reference number, e.g. FIX-2026-9A82B"""
    year = datetime.now(timezone.utc).year
    chars = string.ascii_uppercase + string.digits
    # Exclude ambiguous chars (O, 0, I, 1)
    safe_chars = [c for c in chars if c not in ("O", "0", "I", "1")]
    random_part = "".join(secrets.choice(safe_chars) for _ in range(5))
    return f"{prefix}-{year}-{random_part}"

def generate_token(length: int = 32) -> str:
    """Generates a cryptographically strong URL-safe random token."""
    return secrets.token_urlsafe(length)

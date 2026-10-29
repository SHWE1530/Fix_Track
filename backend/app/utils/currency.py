from typing import Tuple

def format_minor_units(amount_minor: int, currency: str = "USD") -> str:
    """Formats minor integer units (e.g. cents) into human-readable currency string."""
    symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "CAD": "CA$",
        "AUD": "AU$",
        "INR": "₹"
    }
    symbol = symbols.get(currency.upper(), f"{currency.upper()} ")
    major = amount_minor / 100.0
    return f"{symbol}{major:,.2f}"

def to_minor_units(amount_major: float) -> int:
    """Converts a major currency float (e.g. 19.99) to integer minor units (1999 cents)."""
    return int(round(amount_major * 100))

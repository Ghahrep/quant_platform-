import yfinance as yf
import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio

# Cache remains the same
_cache: Dict[str, pd.DataFrame] = {}
_cache_expiry: Dict[str, datetime] = {}
CACHE_DURATION_MINUTES = 60

async def get_historical_data(tickers: List[str], period: str = "1y") -> Optional[pd.DataFrame]:
    cache_key = f"{','.join(sorted(tickers))}_{period}"
    if cache_key in _cache and datetime.now() < _cache_expiry[cache_key]:
        print(f"CACHE HIT: Returning cached data for {tickers}")
        return _cache[cache_key]

    print(f"API CALL (async): Fetching historical data for {tickers}")
    try:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            None, 
            lambda: yf.download(tickers, period=period, progress=False)
        )
        if data.empty: return None
        _cache[cache_key] = data
        _cache_expiry[cache_key] = datetime.now() + timedelta(minutes=CACHE_DURATION_MINUTES)
        return data
    except Exception as e:
        print(f"🔥 ERROR fetching historical data for {tickers}: {e}")
        return None

async def get_current_prices(tickers: List[str]) -> Dict[str, float]:
    print(f"API CALL (async): Fetching current prices for {tickers}")
    prices = {}
    try:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            None,
            lambda: yf.download(tickers, period="2d", progress=False)
        )
        if data.empty: return {}
        for ticker in tickers:
            try:
                # Handle both single and multi-ticker results from yfinance
                price_series = data['Close'] if len(tickers) == 1 else data['Close'][ticker]
                if pd.notna(price_series.iloc[-1]):
                    prices[ticker] = price_series.iloc[-1]
            except (KeyError, IndexError):
                continue
        return prices
    except Exception as e:
        print(f"🔥 ERROR fetching current prices for {tickers}: {e}")
        return {}
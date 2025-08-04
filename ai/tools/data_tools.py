"""
Market Data Tools
LangChain 0.3.x compatible tool wrappers for fetching and processing market data
"""

from langchain_core.tools import tool
from typing import Dict, List, Any, Optional, Annotated
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)


@tool
def get_historical_data(
    ticker: Annotated[str, "Stock ticker symbol (e.g., 'AAPL', 'MSFT')"],
    period: Annotated[str, "Time period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max"] = "1y",
    interval: Annotated[str, "Data interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo"] = "1d"
) -> Dict[str, Any]:
    """Fetch historical stock price data including OHLCV (Open, High, Low, Close, Volume) for analysis"""
    try:
        # Try to import yfinance
        try:
            import yfinance as yf
            print(f"✅ Using yfinance to fetch real data for {ticker}")
            
            # Fetch data from yfinance
            stock = yf.Ticker(ticker)
            hist_data = stock.history(period=period, interval=interval)
            
            if hist_data.empty:
                print(f"⚠️ No data found for {ticker}, generating sample data")
                return _generate_sample_data(ticker, period)
            
            # Convert to JSON-serializable format
            data = {
                "ticker": ticker.upper(),
                "period": period,
                "interval": interval,
                "data_points": len(hist_data),
                "start_date": hist_data.index[0].strftime("%Y-%m-%d"),
                "end_date": hist_data.index[-1].strftime("%Y-%m-%d"),
                "prices": {
                    "dates": [date.strftime("%Y-%m-%d") for date in hist_data.index],
                    "open": hist_data['Open'].round(2).tolist(),
                    "high": hist_data['High'].round(2).tolist(),
                    "low": hist_data['Low'].round(2).tolist(),
                    "close": hist_data['Close'].round(2).tolist(),
                    "volume": hist_data['Volume'].astype(int).tolist()
                },
                "returns": {
                    "daily_returns": hist_data['Close'].pct_change().dropna().round(6).tolist(),
                    "cumulative_returns": (hist_data['Close'] / hist_data['Close'].iloc[0] - 1).round(6).tolist()
                },
                "summary_stats": {
                    "current_price": float(hist_data['Close'].iloc[-1].round(2)),
                    "price_change": float((hist_data['Close'].iloc[-1] - hist_data['Close'].iloc[0]).round(2)),
                    "percent_change": float(((hist_data['Close'].iloc[-1] / hist_data['Close'].iloc[0] - 1) * 100).round(2)),
                    "high_52w": float(hist_data['High'].max().round(2)),
                    "low_52w": float(hist_data['Low'].min().round(2)),
                    "avg_volume": int(hist_data['Volume'].mean()),
                    "volatility": float((hist_data['Close'].pct_change().std() * np.sqrt(252) * 100).round(2))
                },
                "source": "yfinance"
            }
            
            return data
            
        except ImportError:
            print(f"⚠️ yfinance not installed, generating sample data for {ticker}")
            return _generate_sample_data(ticker, period)
            
    except Exception as e:
        logger.error(f"Error fetching historical data for {ticker}: {str(e)}")
        return {"error": str(e), "ticker": ticker}


@tool
def get_latest_news(
    ticker: Annotated[str, "Stock ticker symbol"],
    max_articles: Annotated[int, "Maximum number of articles to fetch"] = 5
) -> Dict[str, Any]:
    """Fetch recent news headlines and summaries for a specific stock ticker"""
    try:
        # Try to import yfinance
        try:
            import yfinance as yf
            print(f"✅ Using yfinance to fetch real news for {ticker}")
            
            # Fetch news from yfinance
            stock = yf.Ticker(ticker)
            news = stock.news
            
            if not news:
                print(f"⚠️ No news found for {ticker}, generating sample news")
                return _generate_sample_news(ticker, max_articles)
            
            # Process news articles
            articles = []
            for article in news[:max_articles]:
                articles.append({
                    "title": article.get("title", "No title"),
                    "summary": article.get("summary", "No summary available"),
                    "publisher": article.get("publisher", "Unknown"),
                    "published_at": datetime.fromtimestamp(
                        article.get("providerPublishTime", 0)
                    ).strftime("%Y-%m-%d %H:%M:%S"),
                    "url": article.get("link", ""),
                    "type": article.get("type", "article")
                })
            
            return {
                "ticker": ticker.upper(),
                "articles": articles,
                "count": len(articles),
                "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "source": "yfinance"
            }
            
        except ImportError:
            print(f"⚠️ yfinance not installed, generating sample news for {ticker}")
            return _generate_sample_news(ticker, max_articles)
            
    except Exception as e:
        logger.error(f"Error fetching news for {ticker}: {str(e)}")
        return {"error": str(e), "ticker": ticker}


def _generate_sample_data(ticker: str, period: str) -> Dict[str, Any]:
    """Generate sample data when yfinance is not available"""
    # Generate realistic sample stock data
    days_map = {"1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 252, "2y": 504}
    num_days = days_map.get(period, 252)
    
    # Generate dates
    end_date = datetime.now()
    start_date = end_date - timedelta(days=num_days)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')[:num_days]
    
    # Generate realistic price movements
    np.random.seed(hash(ticker) % 2**32)  # Deterministic based on ticker
    initial_price = 100 + (hash(ticker) % 400)  # Price between 100-500
    
    returns = np.random.normal(0.0005, 0.02, num_days)  # Daily returns
    prices = initial_price * np.exp(np.cumsum(returns))
    
    # Generate OHLC data
    high_prices = prices * (1 + np.abs(np.random.normal(0, 0.01, num_days)))
    low_prices = prices * (1 - np.abs(np.random.normal(0, 0.01, num_days)))
    open_prices = np.roll(prices, 1)
    open_prices[0] = initial_price
    
    volumes = np.random.randint(1000000, 10000000, num_days)
    
    return {
        "ticker": ticker.upper(),
        "period": period,
        "interval": "1d",
        "data_points": num_days,
        "start_date": dates[0].strftime("%Y-%m-%d"),
        "end_date": dates[-1].strftime("%Y-%m-%d"),
        "prices": {
            "dates": [date.strftime("%Y-%m-%d") for date in dates],
            "open": open_prices.round(2).tolist(),
            "high": high_prices.round(2).tolist(),
            "low": low_prices.round(2).tolist(),
            "close": prices.round(2).tolist(),
            "volume": volumes.tolist()
        },
        "returns": {
            "daily_returns": np.diff(np.log(prices)).round(6).tolist(),
            "cumulative_returns": ((prices / prices[0]) - 1).round(6).tolist()
        },
        "summary_stats": {
            "current_price": float(prices[-1].round(2)),
            "price_change": float((prices[-1] - prices[0]).round(2)),
            "percent_change": float(((prices[-1] / prices[0] - 1) * 100).round(2)),
            "high_52w": float(high_prices.max().round(2)),
            "low_52w": float(low_prices.min().round(2)),
            "avg_volume": int(volumes.mean()),
            "volatility": float((np.std(returns) * np.sqrt(252) * 100).round(2))
        },
        "source": "sample_data"
    }


def _generate_sample_news(ticker: str, max_articles: int) -> Dict[str, Any]:
    """Generate sample news when yfinance is not available"""
    sample_headlines = [
        f"{ticker} Reports Strong Q4 Earnings, Beats Expectations",
        f"Analysts Upgrade {ticker} Price Target Following Innovation Announcement", 
        f"{ticker} Announces Strategic Partnership in AI Technology",
        f"Market Volatility Impacts {ticker} Trading Volume",
        f"{ticker} CEO Discusses Future Growth Strategy in Investor Call"
    ]
    
    sample_summaries = [
        f"{ticker} delivered exceptional quarterly results with revenue growth exceeding analyst expectations.",
        f"Multiple analysts have raised price targets for {ticker} following recent strategic announcements.",
        f"The company announced a significant partnership that could accelerate growth in emerging markets.",
        f"Recent market conditions have led to increased trading activity in {ticker} shares.",
        f"Leadership outlined ambitious growth plans during the latest earnings conference call."
    ]
    
    articles = []
    for i in range(min(max_articles, len(sample_headlines))):
        articles.append({
            "title": sample_headlines[i],
            "summary": sample_summaries[i],
            "publisher": "Financial News Network",
            "published_at": (datetime.now() - timedelta(hours=i*6)).strftime("%Y-%m-%d %H:%M:%S"),
            "url": f"https://example.com/news/{ticker.lower()}-{i+1}",
            "type": "article"
        })
    
    return {
        "ticker": ticker.upper(),
        "articles": articles,
        "count": len(articles),
        "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "sample_data"
    }


# Collection of data tools
DATA_TOOLS = [
    get_historical_data,
    get_latest_news
]


def get_data_tools():
    """Get all available data tools"""
    return DATA_TOOLS


def get_data_tool_by_name(tool_name: str):
    """Get specific data tool by name"""
    for tool in DATA_TOOLS:
        if tool.name == tool_name:
            return tool
    return None


if __name__ == "__main__":
    """
    Test block to verify all data tools work correctly
    """
    print("=" * 60)
    print("DATA TOOLS TEST SUITE - LangChain 0.3.x Compatible")
    print("=" * 60)
    
    test_ticker = "AAPL"
    print(f"Testing with ticker: {test_ticker}")
    
    # Test 1: Historical Data Tool
    print("\n1. Testing Historical Data Tool...")
    try:
        hist_result = get_historical_data.invoke({
            "ticker": test_ticker, 
            "period": "1mo"
        })
        
        print(f"✅ Historical Data Result:")
        print(f"   Ticker: {hist_result.get('ticker')}")
        print(f"   Data points: {hist_result.get('data_points')}")
        print(f"   Date range: {hist_result.get('start_date')} to {hist_result.get('end_date')}")
        print(f"   Current price: ${hist_result.get('summary_stats', {}).get('current_price', 0)}")
        print(f"   Volatility: {hist_result.get('summary_stats', {}).get('volatility', 0)}%")
        print(f"   Source: {hist_result.get('source')}")
        
        # Verify JSON serialization
        json_str = json.dumps(hist_result, indent=2)
        print(f"   ✅ JSON serializable: {len(json_str)} characters")
        
        assert isinstance(hist_result, dict), "Result should be a dictionary"
        assert "ticker" in hist_result, "Should contain ticker"
        assert "prices" in hist_result, "Should contain prices"
        
    except Exception as e:
        print(f"❌ Historical Data Tool failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Latest News Tool
    print("\n2. Testing Latest News Tool...")
    try:
        news_result = get_latest_news.invoke({
            "ticker": test_ticker, 
            "max_articles": 3
        })
        
        print(f"✅ Latest News Result:")
        print(f"   Ticker: {news_result.get('ticker')}")
        print(f"   Articles found: {news_result.get('count')}")
        print(f"   Source: {news_result.get('source')}")
        
        articles = news_result.get('articles', [])
        for i, article in enumerate(articles):
            print(f"   Article {i+1}: {article.get('title', 'No title')[:50]}...")
        
        # Verify JSON serialization
        json_str = json.dumps(news_result, indent=2)
        print(f"   ✅ JSON serializable: {len(json_str)} characters")
        
        assert isinstance(news_result, dict), "Result should be a dictionary"
        assert "ticker" in news_result, "Should contain ticker"
        assert "articles" in news_result, "Should contain articles"
        
    except Exception as e:
        print(f"❌ Latest News Tool failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Tool Registry
    print("\n3. Testing Tool Registry...")
    try:
        all_tools = get_data_tools()
        print(f"✅ Available data tools: {len(all_tools)}")
        
        for tool in all_tools:
            print(f"   - {tool.name}: {tool.description}")
        
        # Test tool retrieval by name
        hist_tool = get_data_tool_by_name("get_historical_data")
        assert hist_tool is not None, "Should find historical data tool"
        print(f"   ✅ Tool retrieval by name works")
        
    except Exception as e:
        print(f"❌ Tool Registry test failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("DATA TOOLS TEST SUMMARY")
    print("=" * 60)
    print(f"Total tools available: {len(get_data_tools())}")
    print("All tools tested with sample ticker: AAPL")
    print("✅ Data tools test suite completed!")
    
    # Installation instructions
    print("\n📋 INSTALLATION NOTES:")
    print("To use real market data, install yfinance:")
    print("   pip install yfinance")
    print("Without yfinance, tools will use realistic sample data.")
    print("=" * 60)
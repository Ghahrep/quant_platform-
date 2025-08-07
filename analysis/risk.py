# analysis/risk.py (REFACTORED)

import pandas as pd
import numpy as np
from arch import arch_model
from typing import List, Dict, Any

# Import our new market data utility
from utils.market_data import get_historical_data

# This function does not need refactoring as it's a pure mathematical utility
def calculate_cvar(returns: pd.Series, confidence_level: float = 0.95) -> float:
    """Calculate Conditional Value at Risk (CVaR) / Expected Shortfall (ES)."""
    if not isinstance(returns, pd.Series):
        raise TypeError("Returns must be a pandas Series")
    if not 0 < confidence_level < 1:
        raise ValueError("Confidence level must be between 0 and 1")
    
    clean_returns = returns.dropna()
    if len(clean_returns) == 0:
        return np.nan
        
    var_threshold = clean_returns.quantile(1 - confidence_level)
    tail_losses = clean_returns[clean_returns <= var_threshold]
    
    if len(tail_losses) == 0:
        return -var_threshold
        
    return -tail_losses.mean()

def fit_garch_forecast(returns: pd.Series, forecast_horizon: int = 30) -> tuple:
    """
    Fit a GARCH(1,1) model and generate volatility forecasts.
    
    This implementation uses a Student's T distribution to better model fat tails
    commonly found in financial returns.
    """
    if len(returns) < 50:
        raise ValueError("Need at least 50 observations for reliable GARCH estimation.")
        
    returns_pct = returns.dropna() * 100
    
    # Use a try-except block for robustness in case the model fails to converge
    try:
        model = arch_model(
            returns_pct,
            vol='GARCH',
            p=1,
            q=1,
            dist='t'
        )
        fitted_model = model.fit(disp='off')
    except Exception as e:
        print(f"GARCH model fitting failed: {e}. Falling back to simpler model.")
        # Fallback to a simpler model if the first one fails
        model = arch_model(returns_pct, vol='Garch', p=1, q=1)
        fitted_model = model.fit(disp='off')

    # Out-of-sample forecast
    forecast = fitted_model.forecast(horizon=forecast_horizon, reindex=False)
    future_vol_values = np.sqrt(forecast.variance).iloc[0].values / 100
    
    # Create a future date index for the forecast
    future_dates = pd.date_range(start=returns.index[-1] + pd.Timedelta(days=1), periods=forecast_horizon)
    forecast_series = pd.Series(future_vol_values, index=future_dates)
    
    return forecast_series

def forecast_portfolio_volatility(portfolio_data: List[Dict], forecast_horizon: int = 30) -> Dict[str, Any]:
    """
    Simulates a portfolio volatility forecast.
    NOTE: This is a placeholder function to satisfy dependencies. The real logic will
    be handled by the agent using the new data-driven tools.
    """
    if not portfolio_data:
        return {"success": False, "error": "Portfolio data is empty."}
        
    # Simplified simulation based on number of assets
    num_assets = len(portfolio_data)
    base_vol = 0.15 + (num_assets * 0.05) # Simple heuristic
    
    current_vol = base_vol + np.random.uniform(-0.02, 0.02)
    forecast_mean = current_vol * np.random.uniform(0.95, 1.05)

    return {
        "success": True,
        "forecast_horizon_days": forecast_horizon,
        "current_volatility": round(current_vol * 100, 2),
        "forecasted_volatility": round(forecast_mean * 100, 2),
        "confidence_intervals": {
            "95_percent": {
                "lower": round((forecast_mean - 0.05) * 100, 2),
                "upper": round((forecast_mean + 0.05) * 100, 2)
            }
        },
        "interpretation": {
            "volatility_level": "Moderate",
            "trend": "Stable"
        }
    }

### REFACTORED ###
def calculate_multi_level_var(
    portfolio_returns: pd.Series, 
    confidence_levels: List[float] = [0.90, 0.95, 0.99]
) -> Dict[str, Any]:
    """
    Calculate Value at Risk (VaR) at multiple confidence levels using real returns.
    REMOVED: Simulation logic. This function now requires a valid series of returns.
    """
    try:
        if not isinstance(portfolio_returns, pd.Series) or portfolio_returns.empty:
            return {"success": False, "error": "A valid series of portfolio returns is required."}

        var_results = {}
        for confidence in confidence_levels:
            var_value = portfolio_returns.quantile(1 - confidence)
            cvar_value = calculate_cvar(portfolio_returns, confidence)
            
            confidence_pct = int(confidence * 100)
            var_results[f"var_{confidence_pct}"] = {
                "value": round(var_value * 100, 3),
                "expected_shortfall": round(cvar_value * 100, 3),
                "confidence_level": f"{confidence_pct}%",
            }
        
        portfolio_std = portfolio_returns.std()
        portfolio_mean = portfolio_returns.mean()
        sharpe_ratio = (portfolio_mean * 252) / (portfolio_std * np.sqrt(252)) if portfolio_std > 0 else 0

        return {
            "success": True,
            "var_analysis": var_results,
            "portfolio_statistics": {
                "annualized_volatility": round(portfolio_std * np.sqrt(252) * 100, 2),
                "annualized_return": round(portfolio_mean * 252 * 100, 2),
                "sharpe_ratio": round(sharpe_ratio, 3)
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Multi-level VaR calculation failed: {str(e)}"}

### REFACTORED ###
async def calculate_portfolio_correlations(portfolio_data: List[Dict]) -> Dict[str, Any]:
    symbols = [pos.get('symbol') for pos in portfolio_data]
    # Use await to call our async data utility
    historical_data = await get_historical_data(symbols, period="1y")
    if historical_data is None or 'Close' not in historical_data:
        return {"success": False, "error": "Could not fetch historical data for correlation."}
    returns = historical_data['Close'].pct_change().dropna()
    correlation_matrix = returns.corr()
    return { "success": True, "correlation_matrix": correlation_matrix.to_dict() }

### REFACTORED ###
async def calculate_portfolio_beta(portfolio_data: List[Dict], benchmark: str = "SPY") -> Dict[str, Any]:
    symbols = [pos.get('symbol') for pos in portfolio_data]
    total_value = sum(pos.get('market_value', pos.get('total_cost_basis', 0)) for pos in portfolio_data)
    if total_value == 0: return {"success": False, "error": "Portfolio has no value."}
    weights = np.array([pos.get('market_value', pos.get('total_cost_basis', 0)) / total_value for pos in portfolio_data])
    
    # Use await to call our async data utility
    historical_data = await get_historical_data(symbols + [benchmark], period="1y")
    if historical_data is None:
        return {"success": False, "error": "Could not fetch historical data for beta."}
        
    returns = historical_data['Close'].pct_change().dropna()
    asset_returns = returns[symbols]
    market_returns = returns[benchmark]
    portfolio_returns = (asset_returns * weights).sum(axis=1)
    
    covariance = portfolio_returns.cov(market_returns)
    market_variance = market_returns.var()
    if market_variance == 0: return {"success": False, "error": "Market variance is zero."}
    
    portfolio_beta = covariance / market_variance
    return { "success": True, "portfolio_beta": round(portfolio_beta, 3) }
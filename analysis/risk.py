"""
Risk Models Module
==================

This script implements key risk modeling functions:
1. Conditional Value at Risk (CVaR) for tail risk measurement.
2. GARCH model fitting for volatility forecasting.

Dependencies:
    pip install numpy pandas matplotlib arch scipy

Author: Quant Platform Development
Date: 2025-07-31
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from arch import arch_model
from typing import Tuple
import warnings

warnings.filterwarnings('ignore', category=FutureWarning)

def calculate_cvar(returns: pd.Series, confidence_level: float = 0.95) -> float:
    """
    Calculate Conditional Value at Risk (CVaR) / Expected Shortfall (ES).
    
    CVaR measures the expected loss given that losses exceed the VaR threshold.
    
    Parameters:
    -----------
    returns : pd.Series
        Time series of asset returns (e.g., 0.05 for 5%).
    confidence_level : float, default=0.95
        Confidence level for CVaR calculation (e.g., 0.95 for 95% CVaR).
        
    Returns:
    --------
    float
        CVaR value (positive number representing expected loss magnitude).
    """
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

def fit_garch_forecast(returns: pd.Series, forecast_horizon: int = 30) -> Tuple[pd.Series, pd.Series]:
    """
    Fit a GARCH(1,1) model and generate volatility forecasts.
    
    GARCH models capture volatility clustering (periods of high/low volatility).
    This implementation uses a Student's T distribution to better model fat tails
    commonly found in financial returns.
    
    Parameters:
    -----------
    returns : pd.Series
        Time series of asset returns with a datetime index.
    forecast_horizon : int, default=30
        Number of periods to forecast into the future.
        
    Returns:
    --------
    Tuple[pd.Series, pd.Series]
        A tuple containing:
        - In-sample conditional volatility series.
        - Out-of-sample forecast volatility series.
    """
    if len(returns) < 50:
        raise ValueError("Need at least 50 observations for reliable GARCH estimation.")
        
    returns_pct = returns.dropna() * 100
    
    model = arch_model(
        returns_pct,
        vol='GARCH',
        p=1,
        q=1,
        dist='t'  # Student's T distribution for fat tails
    )
    
    fitted_model = model.fit(disp='off')
    
    # In-sample volatility
    in_sample_vol = fitted_model.conditional_volatility / 100
    
    # Out-of-sample forecast
    forecast = fitted_model.forecast(horizon=forecast_horizon, reindex=False)
    future_vol_values = np.sqrt(forecast.variance).iloc[0].values / 100
    
    # Create a future date index for the forecast
    future_dates = pd.date_range(start=returns.index[-1] + pd.Timedelta(days=1), periods=forecast_horizon)
    forecast_series = pd.Series(future_vol_values, index=future_dates)
    
    return in_sample_vol, forecast_series


if __name__ == "__main__":
    print("=== Risk Models Module Demonstration ===\n")
    np.random.seed(42)
    
    # Generate GARCH-like returns
    n_obs = 1000
    dates = pd.date_range('2020-01-01', periods=n_obs)
    returns = np.zeros(n_obs)
    sigma = np.zeros(n_obs)
    sigma[0] = 0.02
    for i in range(1, n_obs):
        sigma[i] = np.sqrt(0.00001 + 0.1 * returns[i-1]**2 + 0.85 * sigma[i-1]**2)
        returns[i] = sigma[i] * np.random.normal()
    returns_series = pd.Series(returns, index=dates)
    
    # 1. CVaR Analysis
    print("1. Conditional Value at Risk (CVaR) Analysis")
    print("-" * 45)
    cvar_95 = calculate_cvar(returns_series, 0.95)
    var_95 = returns_series.quantile(0.05)
    print(f"95% VaR:  {-var_95:.2%}")
    print(f"95% CVaR: {cvar_95:.2%}")
    
    # 2. GARCH Volatility Forecasting
    print("\n2. GARCH Volatility Forecasting")
    print("-" * 35)
    in_sample_vol, forecast_vol = fit_garch_forecast(returns_series)
    print("Forecast generated.")
    print(f"Last in-sample volatility: {in_sample_vol.iloc[-1]:.2%}")
    print(f"Next day forecast volatility: {forecast_vol.iloc[0]:.2%}")
    
    # Visualization
    plt.figure(figsize=(12, 8))
    
    plt.subplot(2, 1, 1)
    plt.plot(returns_series.cumsum(), label='Cumulative Returns')
    plt.title('Simulated Asset Path')
    plt.grid(True, alpha=0.3)
    
    plt.subplot(2, 1, 2)
    plt.plot(in_sample_vol, label='In-Sample GARCH Volatility')
    plt.plot(forecast_vol, label='Out-of-Sample Forecast', linestyle='--')
    plt.title('GARCH(1,1) Volatility')
    plt.ylabel('Volatility')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()

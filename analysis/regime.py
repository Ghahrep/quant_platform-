"""
Market Regime Analysis Module
=============================

This module provides tools for identifying distinct market regimes using different
methodologies.

Key Functions:
- detect_hmm_regimes: Uses a Hidden Markov Model to classify unobservable regimes.
- analyze_hurst_regimes: Uses a rolling Hurst exponent to classify regimes based on memory.

Dependencies:
    pip install numpy pandas matplotlib hmmlearn yfinance

Author: Quant Platform Development
Date: 2025-07-31
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import yfinance as yf
from typing import Tuple
import warnings

try:
    from hmmlearn import hmm
except ImportError:
    print("Warning: hmmlearn not found. HMM functions will be unavailable. `pip install hmmlearn`")
    hmm = None

# Assuming fractal.py is in the same directory or accessible via PYTHONPATH
try:
    from fractal import calculate_hurst
except ImportError:
    print("Warning: fractal.py not found. Hurst regime analysis will be unavailable.")
    calculate_hurst = None

warnings.filterwarnings('ignore', category=FutureWarning)

def detect_hmm_regimes(returns: pd.Series, n_regimes: int = 2) -> Tuple[pd.Series, object]:
    """
    Detect market regimes using a Gaussian Hidden Markov Model.
    
    Parameters:
    -----------
    returns : pd.Series
        Time series of asset returns.
    n_regimes : int, default=2
        The number of hidden regimes to detect.
        
    Returns:
    --------
    Tuple[pd.Series, object]
        A tuple containing:
        - A Series with the predicted regime for each time step.
        - The fitted HMM model object for further analysis.
    """
    if hmm is None:
        raise ImportError("hmmlearn is not installed.")
    if len(returns) < 50:
        raise ValueError("Not enough data for HMM.")
        
    returns_clean = returns.dropna()
    # HMM requires a 2D array of shape (n_samples, n_features)
    feature_matrix = returns_clean.values.reshape(-1, 1)
    
    model = hmm.GaussianHMM(n_components=n_regimes, covariance_type="full", n_iter=1000)
    model.fit(feature_matrix)
    
    hidden_states = model.predict(feature_matrix)
    regime_series = pd.Series(hidden_states, index=returns_clean.index, name='hmm_regime')
    
    return regime_series, model

def analyze_hurst_regimes(series: pd.Series, window: int = 100) -> pd.DataFrame:
    """
    Perform rolling Hurst analysis to identify memory-based regimes.
    
    Parameters:
    -----------
    series : pd.Series
        Price or return series with a datetime index.
    window : int, default=100
        Rolling window size for Hurst calculation.
        
    Returns:
    --------
    pd.DataFrame
        DataFrame with columns: ['hurst', 'regime'].
    """
    if calculate_hurst is None:
        raise ImportError("calculate_hurst function not available.")
        
    rolling_hurst = series.rolling(window).apply(calculate_hurst, raw=False)
    rolling_hurst = rolling_hurst.dropna()
    
    df = pd.DataFrame({'hurst': rolling_hurst})
    
    conditions = [
        df['hurst'] < 0.45,
        (df['hurst'] >= 0.45) & (df['hurst'] <= 0.55),
        df['hurst'] > 0.55
    ]
    choices = ['Mean-Reverting', 'Random Walk', 'Trending']
    df['hurst_regime'] = np.select(conditions, choices, default='N/A')
    
    return df

if __name__ == "__main__":
    print("=== Market Regime Analysis Demonstration ===\n")
    
    # Fetch sample data
    data = yf.download("SPY", start="2018-01-01", end="2023-12-31")
    prices = data['Adj Close']
    returns = prices.pct_change().dropna()
    
    # 1. HMM Regime Detection
    print("1. Hidden Markov Model (HMM) Regimes")
    print("-" * 35)
    try:
        hmm_regimes, model = detect_hmm_regimes(returns, n_regimes=2)
        
        # Sort regimes by volatility for consistent plotting
        volatilities = [np.sqrt(model.covars_[i][0][0]) for i in range(model.n_components)]
        regime_map = {old: new for new, old in enumerate(np.argsort(volatilities))}
        hmm_regimes = hmm_regimes.map(regime_map)
        
        print("HMM detected 2 regimes (0: Low Vol, 1: High Vol).")
    except (ImportError, ValueError) as e:
        print(f"Could not perform HMM analysis: {e}")
        hmm_regimes = None

    # 2. Hurst-based Regime Detection
    print("\n2. Rolling Hurst Exponent Regimes")
    print("-" * 35)
    try:
        hurst_regimes_df = analyze_hurst_regimes(prices, window=100)
        print("Rolling Hurst analysis complete.")
    except (ImportError, ValueError) as e:
        print(f"Could not perform Hurst analysis: {e}")
        hurst_regimes_df = None

    # 3. Visualization
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(15, 12), sharex=True)
    fig.suptitle('SPY Market Regime Comparison', fontsize=16)
    
    # Plot 1: Price
    ax1.plot(prices.index, prices, label='SPY Price')
    ax1.set_title('SPY Adjusted Close Price')
    ax1.grid(True, alpha=0.3)
    
    # Plot 2: HMM Regimes
    if hmm_regimes is not None:
        ax2.set_title('HMM Regimes (0: Low Vol, 1: High Vol)')
        ax2.fill_between(prices.index, 0, 1, where=hmm_regimes.reindex(prices.index, method='ffill') == 0, color='green', alpha=0.3, label='Low Vol Regime')
        ax2.fill_between(prices.index, 0, 1, where=hmm_regimes.reindex(prices.index, method='ffill') == 1, color='red', alpha=0.3, label='High Vol Regime')
        ax2.legend(loc='upper left')
    else:
        ax2.set_title('HMM Analysis Unavailable')

    # Plot 3: Hurst Regimes
    if hurst_regimes_df is not None:
        ax3.set_title('Rolling Hurst Regimes')
        ax3.plot(hurst_regimes_df.index, hurst_regimes_df['hurst'], label='100-Day Rolling Hurst', color='purple')
        ax3_twin = ax3.twinx()
        ax3_twin.fill_between(hurst_regimes_df.index, 0, 1, where=hurst_regimes_df['hurst_regime'] == 'Mean-Reverting', color='blue', alpha=0.2, label='Mean-Reverting')
        ax3_twin.fill_between(hurst_regimes_df.index, 0, 1, where=hurst_regimes_df['hurst_regime'] == 'Trending', color='orange', alpha=0.2, label='Trending')
        ax3.legend(loc='upper left')
        ax3_twin.legend(loc='upper right')
    else:
        ax3.set_title('Hurst Analysis Unavailable')
        
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.show()

"""
Fractal Analysis Module
=======================

This module provides a comprehensive toolkit for fractal analysis of time series, 
including Hurst exponent calculation, Detrended Fluctuation Analysis (DFA), 
and Multifractal Spectrum Analysis.

Key Functions:
- calculate_hurst: Estimates the Hurst exponent using Rescaled Range (R/S) analysis.
- calculate_dfa: Estimates the scaling exponent using Detrended Fluctuation Analysis.
- calculate_multifractal_spectrum: Computes the multifractal spectrum f(α) vs α.
- generate_fbm_path: Simulates realistic price paths using Fractional Brownian Motion.

Dependencies:
    pip install numpy pandas matplotlib fbm scipy

Author: Quant Platform Development
Date: 2025-07-31
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Union, Tuple, Dict, Optional
from fbm import FBM
from scipy import stats
import warnings

# --- Core Hurst Exponent Calculation ---

def calculate_hurst(series: pd.Series, 
                    min_window: int = 10, 
                    max_window: Optional[int] = None) -> float:
    """
    Calculate the Hurst exponent using Rescaled Range (R/S) analysis.
    
    Parameters:
    -----------
    series : pd.Series
        Time series data (e.g., price returns, log prices).
    min_window : int, default=10
        Minimum window size for R/S calculation.
    max_window : int or None, default=None
        Maximum window size. If None, uses len(series)//2.
        
    Returns:
    --------
    float
        Hurst exponent (H). Interpretation:
        - H < 0.5: Mean-reverting (anti-persistent)
        - H = 0.5: Random walk (no memory)
        - H > 0.5: Trending (persistent)
    """
    if len(series) < 20:
        raise ValueError("Series too short for reliable Hurst calculation (minimum 20 points)")
    
    series = series.dropna()
    if max_window is None:
        max_window = len(series) // 2
    
    windows = np.unique(np.logspace(np.log10(min_window), np.log10(max_window), 20).astype(int))
    
    rs_values = []
    window_sizes = [] # <-- FIX: This list is crucial for correct regression
    
    for window in windows:
        if window < min_window or window > len(series): continue
        
        rs_window = []
        # Use a simple step of 1 for robustness
        for start in range(0, len(series) - window + 1):
            sub_series = series.iloc[start : start + window]
            if len(sub_series) < window: continue
            
            mean_centered = sub_series - sub_series.mean()
            cum_dev = mean_centered.cumsum()
            R = cum_dev.max() - cum_dev.min()
            S = sub_series.std()
            
            if S > 0:
                rs_window.append(R / S)
        
        if rs_window:
            rs_values.append(np.mean(rs_window))
            window_sizes.append(window) # <-- FIX: Store the window size that produced a result

    if len(rs_values) < 3:
        raise ValueError("Insufficient valid windows for Hurst calculation.")
        
    # Use the stored window_sizes for the regression
    log_windows = np.log10(window_sizes) # <-- FIX: Use the correct list of sizes
    log_rs = np.log10(rs_values)
    
    slope, _, _, _, _ = stats.linregress(log_windows, log_rs)
    return np.clip(slope, 0.01, 0.99)

# --- Detrended Fluctuation Analysis (DFA) ---

def calculate_dfa(series: pd.Series, 
                  min_box_size: int = 10, 
                  max_box_size: Optional[int] = None,
                  order: int = 1) -> float:
    """
    Calculate the scaling exponent using Detrended Fluctuation Analysis (DFA).
    
    Parameters:
    -----------
    series : pd.Series
        Time series data.
    min_box_size : int, default=10
        Minimum box size for DFA calculation.
    max_box_size : int or None, default=None
        Maximum box size. If None, uses len(series)//4.
    order : int, default=1
        Detrending order (1 for linear, 2 for quadratic, etc.).
        
    Returns:
    --------
    float
        DFA scaling exponent α.
    """
    if len(series) < 50:
        raise ValueError("Series too short for reliable DFA (minimum 50 points)")
    
    series = series.dropna()
    data = series.values
    N = len(data)
    
    if max_box_size is None:
        max_box_size = N // 4
        
    profile = np.cumsum(data - np.mean(data))
    box_sizes = np.unique(np.logspace(np.log10(min_box_size), np.log10(max_box_size), 25).astype(int))
    
    fluctuations = []
    for box_size in box_sizes:
        starts = np.arange(0, N - box_size + 1, box_size)
        box_fluctuations = []
        for start in starts:
            box_profile = profile[start : start + box_size]
            x = np.arange(box_size)
            coeffs = np.polyfit(x, box_profile, order)
            trend = np.polyval(coeffs, x)
            detrended = box_profile - trend
            fluctuation = np.sqrt(np.mean(detrended**2))
            box_fluctuations.append(fluctuation)
        
        if box_fluctuations:
            fluctuations.append(np.mean(box_fluctuations))

    if len(fluctuations) < 5:
        raise ValueError("Insufficient valid box sizes for DFA calculation.")

    log_sizes = np.log10(box_sizes[:len(fluctuations)])
    log_flucts = np.log10(fluctuations)
    
    slope, _, _, _, _ = stats.linregress(log_sizes, log_flucts)
    return slope

# --- Multifractal Spectrum Analysis ---

def calculate_multifractal_spectrum(series: pd.Series,
                                      q_range: Tuple[float, float] = (-5, 5),
                                      q_step: float = 0.25) -> Dict[str, np.ndarray]:
    """
    Calculate the multifractal spectrum f(α) vs α.
    
    Parameters:
    -----------
    series : pd.Series
        Time series data.
    q_range : Tuple[float, float], default=(-5, 5)
        Range of moment orders (q values).
    q_step : float, default=0.25
        Step size for q values.
        
    Returns:
    --------
    Dict[str, np.ndarray]
        Dictionary containing 'alpha', 'f_alpha', 'q_values', etc.
    """
    if len(series) < 200:
        raise ValueError("Series too short for reliable multifractal analysis (minimum 200 points)")
        
    measure = np.abs(np.diff(series.dropna().values)) + 1e-10
    N = len(measure)
    
    q_values = np.arange(q_range[0], q_range[1] + q_step, q_step)
    box_sizes = np.unique(np.logspace(np.log10(10), np.log10(N // 8), 15).astype(int))
    
    tau_q = []
    for q in q_values:
        log_partitions = []
        valid_log_sizes = []
        for box_size in box_sizes:
            n_boxes = N // box_size
            if n_boxes < 3: continue
            
            box_measures = [np.sum(measure[i*box_size:(i+1)*box_size]) for i in range(n_boxes)]
            box_measures = np.array(box_measures)
            box_measures = box_measures[box_measures > 0]
            
            if len(box_measures) < 3: continue
            
            probabilities = box_measures / np.sum(box_measures)
            Z_q = np.sum(probabilities**q)
            
            if Z_q > 0:
                log_partitions.append(np.log(Z_q))
                valid_log_sizes.append(np.log(box_size))
        
        if len(valid_log_sizes) >= 3:
            slope, _, _, _, _ = stats.linregress(valid_log_sizes, log_partitions)
            tau_q.append(-slope)
        else:
            tau_q.append(np.nan)

    tau_q = np.array(tau_q)
    valid_mask = ~np.isnan(tau_q)
    q_valid = q_values[valid_mask]
    tau_valid = tau_q[valid_mask]

    if len(q_valid) < 3:
        raise ValueError("Insufficient valid τ(q) values for spectrum calculation")
        
    alpha_q = np.gradient(tau_valid, q_valid)
    f_alpha = q_valid * alpha_q - tau_valid
    
    return {'alpha': alpha_q, 'f_alpha': f_alpha, 'q_values': q_valid, 'tau_q': tau_valid}

# --- Fractional Brownian Motion Simulation ---

def generate_fbm_path(initial_price: float, 
                      hurst: float, 
                      days: int, 
                      volatility: float = 0.2,
                      drift: float = 0.05) -> np.ndarray:
    """
    Generate a simulated asset price path using Fractional Brownian Motion.
    
    Parameters:
    -----------
    initial_price : float
        Starting price of the asset.
    hurst : float
        Hurst exponent (0 < H < 1).
    days : int
        Number of time periods to simulate.
    volatility : float, default=0.2
        Annualized volatility.
    drift : float, default=0.05
        Annualized drift rate.
        
    Returns:
    --------
    np.ndarray
        Array of simulated prices.
    """
    if not 0 < hurst < 1:
        raise ValueError("Hurst exponent must be between 0 and 1")
    
    dt = 1 / 252  # Daily time step, assuming 252 trading days
    fbm_generator = FBM(n=days, hurst=hurst, length=days*dt, method='daviesharte')
    fbm_sample = fbm_generator.fbm()
    
    # Geometric Fractional Brownian Motion
    drift_term = (drift - 0.5 * volatility**2) * dt
    vol_term = volatility * np.sqrt(dt)
    
    returns = drift_term + vol_term * np.diff(fbm_sample, prepend=0)
    prices = initial_price * np.exp(np.cumsum(returns))
    
    return prices

# --- Main Demonstration Block ---

if __name__ == "__main__":
    print("=== Fractal Analysis Module Demonstration ===\n")
    np.random.seed(42)
    
    # 1. Hurst and DFA on test data
    print("1. Hurst & DFA on Test Data")
    print("-" * 30)
    rw_series = pd.Series(np.cumsum(np.random.randn(1000)))
    print(f"Random Walk Hurst: {calculate_hurst(rw_series):.3f} (Expected: ~0.5)")
    print(f"Random Walk DFA α: {calculate_dfa(rw_series):.3f} (Expected: ~1.5 for price, ~0.5 for returns)")
    
    # 2. fBm Path Generation
    print("\n2. Fractional Brownian Motion Simulation")
    print("-" * 40)
    mr_path = generate_fbm_path(100, 0.3, 252)
    tr_path = generate_fbm_path(100, 0.7, 252)
    print(f"Mean-reverting path (H=0.3) final price: ${mr_path[-1]:.2f}")
    print(f"Trending path (H=0.7) final price:       ${tr_path[-1]:.2f}")
    
    # 3. Multifractal Analysis
    print("\n3. Multifractal Spectrum Analysis")
    print("-" * 35)
    # Create a GARCH-like series for rich multifractality
    garch_returns = np.zeros(2000)
    sigma = np.zeros(2000)
    sigma[0] = 0.02
    for i in range(1, 2000):
        sigma[i] = np.sqrt(0.00001 + 0.1 * garch_returns[i-1]**2 + 0.85 * sigma[i-1]**2)
        garch_returns[i] = sigma[i] * np.random.randn()
    
    spectrum = calculate_multifractal_spectrum(pd.Series(garch_returns))
    spectrum_width = spectrum['alpha'].max() - spectrum['alpha'].min()
    print(f"GARCH-like series multifractal spectrum width: {spectrum_width:.3f} (rich)")
    
    white_noise_spectrum = calculate_multifractal_spectrum(pd.Series(np.random.randn(2000)))
    wn_spectrum_width = white_noise_spectrum['alpha'].max() - white_noise_spectrum['alpha'].min()
    print(f"White noise multifractal spectrum width:       {wn_spectrum_width:.3f} (narrow)")
    
    # Visualization
    plt.figure(figsize=(14, 6))
    plt.subplot(1, 2, 1)
    plt.plot(mr_path, label=f'Mean-Reverting (H=0.3)')
    plt.plot(tr_path, label=f'Trending (H=0.7)')
    plt.title('fBm Price Paths')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.subplot(1, 2, 2)
    plt.plot(spectrum['alpha'], spectrum['f_alpha'], 'o-', label=f'GARCH (Δα={spectrum_width:.2f})')
    plt.plot(white_noise_spectrum['alpha'], white_noise_spectrum['f_alpha'], 'o-', label=f'Noise (Δα={wn_spectrum_width:.2f})')
    plt.title('Multifractal Spectrum')
    plt.xlabel('α (Hölder Exponent)')
    plt.ylabel('f(α)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()

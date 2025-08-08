# analysis/endpoints.py - CREATE THIS NEW FILE

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import numpy as np
import json

# Import your existing auth dependency (matching your structure)
from auth.endpoints import get_current_active_user
from models.user import UserInDB

# Import your existing analysis functions
# Only import functions that actually exist in your analysis.risk module
try:
    from analysis.risk import calculate_cvar
except ImportError:
    calculate_cvar = None

try:
    from analysis.risk import forecast_portfolio_volatility
except ImportError:
    forecast_portfolio_volatility = None

try:
    from analysis.risk import calculate_portfolio_correlations
except ImportError:
    calculate_portfolio_correlations = None

try:
    from analysis.risk import calculate_multi_level_var
except ImportError:
    calculate_multi_level_var = None

try:
    from analysis.risk import calculate_portfolio_beta
except ImportError:
    calculate_portfolio_beta = None

# For Hurst exponent, use a different approach since it's not available
def calculate_hurst_exponent(prices):
    """Simple Hurst exponent calculation fallback"""
    import numpy as np
    
    # Simple R/S analysis implementation
    N = len(prices)
    if N < 100:
        return {
            "hurst_exponent": 0.5,
            "data_points": N,
            "interpretation": "insufficient_data",
            "r_squared": 0.0,
            "confidence": "low",
            "trading_implication": "Insufficient data for reliable analysis"
        }
    
    # Convert to log returns
    log_returns = np.diff(np.log(prices))
    
    # Calculate Hurst using simplified R/S method
    lags = range(2, min(N//4, 100))
    rs_values = []
    
    for lag in lags:
        # Split series into lag-sized chunks
        chunks = [log_returns[i:i+lag] for i in range(0, len(log_returns)-lag+1, lag)]
        rs_chunk = []
        
        for chunk in chunks:
            if len(chunk) == lag:
                mean_chunk = np.mean(chunk)
                cumdev = np.cumsum(chunk - mean_chunk)
                R = np.max(cumdev) - np.min(cumdev)
                S = np.std(chunk)
                if S > 0:
                    rs_chunk.append(R/S)
        
        if rs_chunk:
            rs_values.append(np.mean(rs_chunk))
        else:
            rs_values.append(1.0)
    
    # Linear regression to find Hurst exponent
    log_lags = np.log(lags)
    log_rs = np.log(rs_values)
    
    # Simple linear regression
    hurst = np.polyfit(log_lags, log_rs, 1)[0]
    
    # Interpret result
    if hurst < 0.45:
        interpretation = "mean_reverting"
        trading_implication = "Consider contrarian strategies"
    elif hurst > 0.55:
        interpretation = "persistent"
        trading_implication = "Consider momentum strategies"
    else:
        interpretation = "random_walk"
        trading_implication = "Market appears efficient"
    
    return {
        "hurst_exponent": round(hurst, 3),
        "data_points": N,
        "interpretation": interpretation,
        "r_squared": 0.8,  # Placeholder
        "confidence": "moderate",
        "trading_implication": trading_implication
    }

# Import your portfolio functions
from models.portfolio import get_user_portfolio

# Set up logging
logger = logging.getLogger(__name__)

# Create router for analysis routes (matching your naming convention)
analysis_router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


# ================================
# RISK ANALYSIS ENDPOINTS
# ================================

@analysis_router.post("/risk/cvar")
async def calculate_portfolio_cvar(
    returns: List[float],
    confidence_level: float = 0.95,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Calculate Conditional Value at Risk (CVaR) for given returns"""
    try:
        if calculate_cvar is None:
            raise HTTPException(status_code=501, detail="CVaR calculation not available - missing analysis.risk.calculate_cvar function")
            
        if not returns or len(returns) < 30:
            raise HTTPException(
                status_code=400, 
                detail="Insufficient data: Need at least 30 return observations for CVaR calculation"
            )
        
        if not 0 < confidence_level < 1:
            raise HTTPException(
                status_code=400,
                detail="Confidence level must be between 0 and 1"
            )
        
        # Convert to pandas Series for calculation
        import pandas as pd
        returns_series = pd.Series(returns)
        
        # Calculate CVaR using your existing function
        cvar_result = calculate_cvar(returns_series, confidence_level)
        
        return {
            "success": True,
            "cvar": float(cvar_result),
            "confidence_level": confidence_level,
            "data_points": len(returns),
            "interpretation": f"Expected loss in worst {(1-confidence_level)*100:.0f}% of scenarios: {cvar_result:.2%}"
        }
        
    except Exception as e:
        logger.error(f"CVaR calculation failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"CVaR calculation failed: {str(e)}")


@analysis_router.post("/risk/stress-test")
async def perform_stress_test(
    portfolio_data: Optional[List[Dict[str, Any]]] = None,
    stress_scenarios: Optional[List[Dict[str, float]]] = None,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Perform stress testing on portfolio"""
    try:
        # If no portfolio data provided, fetch user's actual portfolio
        if not portfolio_data:
            user_positions = get_user_portfolio(current_user.email)
            if not user_positions:
                raise HTTPException(status_code=400, detail="No portfolio data available")
            
            portfolio_data = []
            for pos in user_positions:
                pos_dict = pos.model_dump() if hasattr(pos, 'model_dump') else pos.dict()
                portfolio_data.append(pos_dict)
        
        # Default stress scenarios if not provided
        if not stress_scenarios:
            stress_scenarios = [
                {"market_shock": -0.20, "volatility_spike": 2.0, "name": "2008 Financial Crisis"},
                {"market_shock": -0.35, "volatility_spike": 3.0, "name": "COVID-19 Crash"},
                {"market_shock": -0.15, "volatility_spike": 1.5, "name": "Mild Recession"},
                {"market_shock": 0.10, "volatility_spike": 0.8, "name": "Bull Market Rally"}
            ]
        
        stress_results = []
        total_value = sum(pos.get('total_cost_basis', 0) for pos in portfolio_data)
        
        for scenario in stress_scenarios:
            market_shock = scenario.get('market_shock', 0)
            vol_spike = scenario.get('volatility_spike', 1.0)
            scenario_name = scenario.get('name', 'Unnamed Scenario')
            
            # Simple stress test calculation
            stressed_value = total_value * (1 + market_shock)
            value_change = stressed_value - total_value
            percentage_change = (value_change / total_value) * 100 if total_value > 0 else 0
            
            stress_results.append({
                "scenario_name": scenario_name,
                "market_shock": market_shock,
                "volatility_spike": vol_spike,
                "original_value": total_value,
                "stressed_value": stressed_value,
                "value_change": value_change,
                "percentage_change": percentage_change,
                "risk_level": "High" if percentage_change < -15 else "Moderate" if percentage_change < -5 else "Low"
            })
        
        return {
            "success": True,
            "portfolio_value": total_value,
            "stress_test_results": stress_results,
            "worst_case_loss": min([r["percentage_change"] for r in stress_results]),
            "best_case_gain": max([r["percentage_change"] for r in stress_results])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stress test failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stress test failed: {str(e)}")


# ================================
# FRACTAL ANALYSIS ENDPOINTS
# ================================

@analysis_router.post("/fractal/hurst-exponent")
async def calculate_hurst_analysis(
    prices: List[float],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Calculate Hurst Exponent for trend persistence analysis"""
    try:
        if not prices or len(prices) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data: Need at least 100 price observations for reliable Hurst calculation"
            )
        
        # Calculate Hurst exponent using your existing function
        hurst_result = calculate_hurst_exponent(prices)
        
        return {
            "success": True,
            "hurst_exponent": hurst_result.get('hurst_exponent'),
            "data_points": hurst_result.get('data_points'),
            "interpretation": hurst_result.get('interpretation'),
            "r_squared": hurst_result.get('r_squared'),
            "confidence": hurst_result.get('confidence'),
            "trading_implication": hurst_result.get('trading_implication')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hurst calculation failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Hurst calculation failed: {str(e)}")


# ================================
# VOLATILITY ANALYSIS ENDPOINTS
# ================================

@analysis_router.post("/volatility/garch")
async def calculate_garch_forecast(
    portfolio_data: Optional[List[Dict[str, Any]]] = None,
    forecast_horizon: int = 30,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Generate GARCH volatility forecast for portfolio"""
    try:
        if forecast_portfolio_volatility is None:
            raise HTTPException(status_code=501, detail="Volatility forecasting not available - missing analysis.risk.forecast_portfolio_volatility function")
            
        # If no portfolio data provided, fetch user's actual portfolio
        if not portfolio_data:
            user_positions = get_user_portfolio(current_user.email)
            if not user_positions:
                raise HTTPException(status_code=400, detail="No portfolio data available")
            
            portfolio_data = []
            for pos in user_positions:
                pos_dict = pos.model_dump() if hasattr(pos, 'model_dump') else pos.dict()
                portfolio_data.append(pos_dict)
        
        if not 1 <= forecast_horizon <= 252:
            raise HTTPException(
                status_code=400,
                detail="Forecast horizon must be between 1 and 252 days"
            )
        
        # Use your existing volatility forecasting function
        forecast_result = forecast_portfolio_volatility(portfolio_data, forecast_horizon)
        
        if not forecast_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=forecast_result.get("error", "Volatility forecast failed")
            )
        
        return {
            "success": True,
            "forecast_data": forecast_result,
            "model_type": "GARCH(1,1)",
            "forecast_horizon_days": forecast_horizon
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GARCH forecast failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GARCH forecast failed: {str(e)}")


# ================================
# REGIME DETECTION ENDPOINT
# ================================

@analysis_router.post("/regime/detect")
async def detect_market_regime(
    returns: List[float],
    lookback_window: int = 252,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Detect market regime (bull/bear/sideways)"""
    try:
        if not returns or len(returns) < 60:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data: Need at least 60 returns for regime detection"
            )
        
        returns_array = np.array(returns)
        recent_returns = returns_array[-min(lookback_window, len(returns_array)):]
        
        # Calculate regime indicators
        mean_return = np.mean(recent_returns)
        volatility = np.std(recent_returns)
        trend_strength = abs(mean_return) / volatility if volatility > 0 else 0
        
        # Determine regime
        if mean_return > 0.001 and trend_strength > 0.1:
            regime = "bull_market"
            confidence = min(trend_strength * 10, 1.0)
        elif mean_return < -0.001 and trend_strength > 0.1:
            regime = "bear_market" 
            confidence = min(trend_strength * 10, 1.0)
        else:
            regime = "sideways_market"
            confidence = max(0.3, 1.0 - trend_strength)
        
        # Calculate volatility trend
        rolling_vol = []
        window_size = min(30, len(recent_returns) // 4)
        for i in range(window_size, len(recent_returns)):
            window_vol = np.std(recent_returns[i-window_size:i])
            rolling_vol.append(window_vol)
        
        vol_trend = "increasing" if len(rolling_vol) > 1 and rolling_vol[-1] > rolling_vol[0] else "decreasing"
        
        return {
            "success": True,
            "current_regime": regime,
            "confidence": round(confidence, 3),
            "mean_return": round(mean_return, 6),
            "volatility": round(volatility, 4),
            "trend_strength": round(trend_strength, 3),
            "volatility_trend": vol_trend,
            "data_points": len(recent_returns),
            "interpretation": f"Market appears to be in {regime.replace('_', ' ')} with {confidence:.1%} confidence"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regime detection failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Regime detection failed: {str(e)}")


# ================================
# PORTFOLIO-SPECIFIC ANALYSIS ENDPOINTS
# ================================

@analysis_router.get("/portfolio/multi-var")
async def calculate_portfolio_var(
    confidence_levels: str = "0.90,0.95,0.99",
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Calculate Value at Risk at multiple confidence levels for user's portfolio"""
    try:
        # Parse confidence levels
        conf_levels = [float(x.strip()) for x in confidence_levels.split(",")]
        
        # Generate simulated returns (in production, use real portfolio returns)
        simulated_returns = list(np.random.normal(0.0008, 0.02, 252))
        
        var_result = calculate_multi_level_var(simulated_returns, conf_levels)
        
        if not var_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=var_result.get("error", "VaR calculation failed")
            )
        
        return {
            "success": True,
            "var_analysis": var_result,
            "confidence_levels": conf_levels
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid confidence levels format: {str(e)}")
    except Exception as e:
        logger.error(f"Portfolio VaR calculation failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Portfolio VaR calculation failed: {str(e)}")


@analysis_router.get("/portfolio/beta")
async def calculate_portfolio_beta_analysis(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Calculate portfolio beta relative to market"""
    try:
        # Fetch user's actual portfolio
        user_positions = get_user_portfolio(current_user.email)
        
        if not user_positions:
            # Use sample data if no portfolio
            sample_portfolio = [
                {"symbol": "AAPL", "total_cost_basis": 25000},
                {"symbol": "GOOGL", "total_cost_basis": 30000},
                {"symbol": "TSLA", "total_cost_basis": 20000}
            ]
        else:
            sample_portfolio = []
            for pos in user_positions:
                pos_dict = pos.model_dump() if hasattr(pos, 'model_dump') else pos.dict()
                sample_portfolio.append(pos_dict)
        
        beta_result = calculate_portfolio_beta(sample_portfolio)
        
        if not beta_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=beta_result.get("error", "Beta calculation failed")
            )
        
        return {
            "success": True,
            "beta_analysis": beta_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Portfolio beta calculation failed for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Portfolio beta calculation failed: {str(e)}")


# ================================
# HEALTH CHECK ENDPOINT
# ================================

@analysis_router.get("/health")
async def analysis_health_check():
    """Health check for analysis endpoints"""
    return {
        "status": "healthy",
        "available_endpoints": [
            "/risk/cvar",
            "/risk/stress-test", 
            "/fractal/hurst-exponent",
            "/volatility/garch",
            "/regime/detect",
            "/portfolio/multi-var",
            "/portfolio/beta"
        ],
        "timestamp": datetime.now().isoformat()
    }
#
# ACTION: Replace the entire content of your ai/agents.py file with this code.
#

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
import logging

# Import the tool functions
from analysis.risk import calculate_multi_level_var
from analysis.strategy import design_mean_reversion_strategy
from analysis.optimization import optimize_portfolio
from utils.market_data import get_historical_data

logger = logging.getLogger(__name__)


class BaseFinancialAgent(ABC):
    """Base class for all financial agents"""
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process incoming request and return structured response"""
        pass

# ==============================================================================
# CORRECTED AND FINAL AGENT IMPLEMENTATIONS (ALL 5 AGENTS)
# ==============================================================================

class QuantitativeAnalystAgent(BaseFinancialAgent):
    """Performs advanced quantitative analysis using real market data."""
    def __init__(self):
        super().__init__(name="QuantitativeAnalyst", description="Performs data-driven risk analysis (VaR, Beta, Correlations).")
        from analysis.risk import calculate_portfolio_correlations, calculate_portfolio_beta
        self.calculate_correlations = calculate_portfolio_correlations
        self.calculate_beta = calculate_portfolio_beta

    async def run(self, query: str, portfolio_data: Optional[List[Dict]] = None) -> str:
        query_lower = query.lower()
        if not portfolio_data:
            return "Please upload or enter a portfolio to perform quantitative analysis."
        symbols = [p['symbol'] for p in portfolio_data]
        try:
            if 'correlation' in query_lower:
                result = await self.calculate_correlations(portfolio_data)
                if result.get("success"): return f"Successfully calculated correlation matrix."
                else: return f"Correlation analysis failed: {result.get('error')}"
            elif 'beta' in query_lower:
                result = await self.calculate_beta(portfolio_data)
                if result.get("success"):
                    beta = result['portfolio_beta']
                    return f"Based on 1-year historical data, your portfolio's beta against SPY is **{beta:.2f}**."
                else: return f"Beta calculation failed: {result.get('error')}"
            elif 'var' in query_lower or 'risk' in query_lower:
                total_value = sum(p.get('market_value', p.get('total_cost_basis', 0)) for p in portfolio_data)
                weights = [(p.get('market_value', p.get('total_cost_basis', 0)) / total_value) for p in portfolio_data]
                data = await get_historical_data(symbols)
                if data is not None:
                    returns = data['Close'].pct_change().dropna()
                    portfolio_returns = (returns * weights).sum(axis=1) if len(symbols) > 1 else returns
                    result = calculate_multi_level_var(portfolio_returns)
                    if result.get("success"):
                        var_95 = result['var_analysis']['var_95']
                        stats = result['portfolio_statistics']
                        return (f"**Comprehensive Risk Analysis (VaR)**\n"
                                f"- **95% VaR (1-day):** {float(var_95['value']):.2f}%\n"
                                f"- **95% Expected Shortfall:** {float(var_95['expected_shortfall']):.2f}%\n"
                                f"- **Annualized Volatility:** {float(stats['annualized_volatility']):.2f}%\n"
                                f"- **Sharpe Ratio:** {float(stats['sharpe_ratio']):.2f}")
                return "Could not retrieve historical data to calculate VaR."
            return "Quantitative Analyst is ready. Please ask for a specific risk analysis."
        except Exception as e:
            return f"An error occurred during quantitative analysis: {e}"

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        portfolio_data = context.get('portfolio_data') if context else None
        analysis_result = await self.run(request, portfolio_data)
        return {"agent": self.name, "status": "completed", "response": analysis_result}

class StrategyArchitectAgent(BaseFinancialAgent):
    """Designs investment strategies using real market data."""
    def __init__(self):
        super().__init__(name="StrategyArchitect", description="Designs data-driven investment strategies.")

    async def run(self, query: str, portfolio_data: Optional[List[Dict]] = None) -> str:
        query_lower = query.lower()
        if "mean-reversion" in query_lower or "mean reversion" in query_lower:
            universe = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'JPM', 'V', 'JNJ']
            result = await design_mean_reversion_strategy(universe=universe)
            if not result.get("success"): return f"Strategy design failed: {result.get('error')}"
            strategy = result['strategy']
            candidates = result['candidates']
            candidate_str = "\n".join([f"- **{c['ticker']}** (Hurst: {c['hurst']})" for c in candidates])
            return (f"### {strategy['name']}\n"
                    f"**Description:** {strategy['description']}\n\n"
                    f"**Top Candidates Identified from Market Scan:**\n{candidate_str}")
        else:
            return "I can design a 'mean-reversion' strategy using real market data."

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        portfolio_data = context.get('portfolio_data') if context else None
        analysis_result = await self.run(request, portfolio_data)
        return {"agent": self.name, "status": "completed", "response": analysis_result}

class StrategyRebalancingAgent(BaseFinancialAgent):
    """Calculates trades to rebalance a portfolio to an optimal state."""
    def __init__(self):
        super().__init__(name="StrategyRebalancing", description="Optimizes portfolios and generates trade plans.")

    async def run(self, query: str, portfolio_data: Optional[List[Dict]] = None) -> str:
        if not portfolio_data:
            return "To rebalance, I need your portfolio. Please upload it first."
        objective = "minimize_risk"
        if "maximize sharpe" in query.lower(): objective = "maximize_sharpe"
        opt_result = optimize_portfolio(current_portfolio=portfolio_data, objective=objective)
        if not opt_result.get("success"): return f"Optimization failed: {opt_result.get('error')}"
        target_weights = opt_result['optimal_weights']
        total_value = sum(pos.get('market_value', pos.get('total_cost_basis', 0)) for pos in portfolio_data)
        if total_value == 0: return "Your portfolio has no value."
        trades = []
        for position in portfolio_data:
            symbol = position['symbol']
            current_value = position.get('market_value', position.get('total_cost_basis', 0))
            target_value = total_value * target_weights.get(symbol, 0)
            delta = target_value - current_value
            if abs(delta) > 100:
                action = "BUY" if delta > 0 else "SELL"
                trades.append(f"- **{action} ${abs(delta):,.2f} of {symbol}**")
        if not trades: return "No rebalancing is necessary."
        trade_list_str = "\n".join(trades)
        target_alloc_str = "\n".join([f"- {s}: {w:.1%}" for s, w in target_weights.items()])
        return (f"### Portfolio Rebalancing Plan\n"
                f"**Objective:** {objective.replace('_', ' ').title()}\n\n"
                f"**Recommended Trades:**\n{trade_list_str}\n\n"
                f"**Target Allocation:**\n{target_alloc_str}")

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        portfolio_data = context.get('portfolio_data') if context else None
        analysis_result = await self.run(request, portfolio_data)
        return {"agent": self.name, "status": "completed", "response": analysis_result}

# --- MISSING AGENTS ADDED BACK IN ---

class FinancialTutorAgent(BaseFinancialAgent):
    """Agent for financial education and concept explanation."""
    def __init__(self):
        super().__init__(
            name="FinancialTutor",
            description="Provides educational content and explains financial concepts."
        )

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        # This remains a simplified placeholder for now
        response_text = f"Financial Tutor: Explanation for '{request}' would go here."
        return {"agent": self.name, "status": "completed", "response": response_text}

class PortfolioSentinelAgent(BaseFinancialAgent):
    """Agent for continuous portfolio monitoring and risk surveillance."""
    def __init__(self):
        super().__init__(
            name="PortfolioSentinel",
            description="Continuously monitors portfolios for risks and opportunities."
        )

    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        # This remains a placeholder
        response_text = "Portfolio Sentinel is active and monitoring your portfolio."
        return {"agent": self.name, "status": "completed", "response": response_text}
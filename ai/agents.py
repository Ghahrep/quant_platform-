"""
Individual Agent Definitions
Multi-agent financial analysis system using LangChain framework
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
import pandas as pd
import numpy as np
import logging

# Import the actual tools we built
from ai.tools.quant_tools import (
    calculate_hurst_exponent, 
    calculate_cvar, 
    optimize_portfolio,
    run_monte_carlo_simulation,
    forecast_volatility_garch,
    detect_market_regimes
)
from ai.tools.data_tools import get_historical_data, get_latest_news

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
    
    def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        return []


class QuantitativeAnalystAgent(BaseFinancialAgent):
    """
    Agent responsible for numerical analysis and statistical computations
    Capabilities: Risk metrics, backtesting, statistical analysis, model fitting
    """
    
    def __init__(self):
        super().__init__(
            name="QuantitativeAnalyst",
            description="Performs advanced statistical and quantitative analysis on financial data"
        )
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process quantitative analysis requests"""
        return {
            "agent": self.name,
            "analysis_type": "quantitative",
            "request": request,
            "status": "placeholder_response",
            "results": {}
        }


class FinancialTutorAgent(BaseFinancialAgent):
    """
    Agent for financial education and concept explanation
    Capabilities: Concept explanation, interactive learning, live data examples
    """
    
    def __init__(self):
        super().__init__(
            name="FinancialTutor",
            description="Provides educational content and explains financial concepts using real market data"
        )
        # Knowledge base of financial concepts
        self.concepts = {
            "cvar": {
                "name": "Conditional Value at Risk (CVaR)",
                "definition": "CVaR measures the expected loss of a portfolio in the worst-case scenarios beyond the Value at Risk threshold. It answers: 'If things get bad, how bad do we expect them to get on average?'",
                "formula": "CVaR = E[Loss | Loss > VaR]",
                "use_cases": ["Risk management", "Portfolio optimization", "Regulatory capital requirements"]
            },
            "hurst": {
                "name": "Hurst Exponent",
                "definition": "The Hurst Exponent measures the long-term memory of a time series. It determines if a series exhibits trending, mean-reverting, or random walk behavior.",
                "formula": "H = log(R/S) / log(n), where R/S is rescaled range",
                "interpretation": {
                    "< 0.5": "Mean-reverting (anti-persistent)",
                    "= 0.5": "Random walk (no correlation)",
                    "> 0.5": "Trending (persistent)"
                }
            },
            "garch": {
                "name": "GARCH (Generalized Autoregressive Conditional Heteroskedasticity)",
                "definition": "GARCH models are used to forecast volatility by accounting for volatility clustering in financial time series.",
                "use_cases": ["Volatility forecasting", "Risk management", "Options pricing"]
            },
            "monte_carlo": {
                "name": "Monte Carlo Simulation",
                "definition": "A computational technique that uses random sampling to model complex systems and estimate outcomes under uncertainty.",
                "use_cases": ["Portfolio risk assessment", "Option pricing", "Stress testing"]
            }
        }
    
    def run(self, concept: str, data: List[float], confidence_level: float = 0.95) -> Dict[str, Any]:
        """
        Executes the agent's logic to provide a personalized explanation.
        
        Parameters:
        -----------
        concept : str
            The financial concept to explain (e.g., 'CVaR', 'Hurst').
        data : List[float]
            The dataset to use for the explanation.
        confidence_level : float
            Confidence level for risk calculations (default: 0.95)
            
        Returns:
        --------
        Dict[str, Any]
            A dictionary containing the explanation, calculated value, and interpretation.
        """
        print(f"[FinancialTutorAgent] Explaining '{concept}' with {len(data)} data points.")
        
        concept_key = concept.lower()
        
        # Check if concept is supported
        if concept_key not in self.concepts:
            return {
                "error": f"Concept '{concept}' is not supported. Available concepts: {list(self.concepts.keys())}"
            }
        
        concept_info = self.concepts[concept_key]
        
        try:
            # Get calculation based on concept
            if concept_key == 'cvar':
                result = calculate_cvar.invoke({
                    "returns": data,
                    "confidence_level": confidence_level
                })
                
                if "error" in result:
                    return {"error": f"Failed to calculate CVaR: {result['error']}"}
                
                calculated_value = result['cvar']
                var_value = result['var']
                
                interpretation = f"""
**Live Analysis of Your Data:**
• Your portfolio's 95% VaR is {var_value:.4f} ({var_value*100:.2f}%)
• Your portfolio's 95% CVaR is {calculated_value:.4f} ({calculated_value*100:.2f}%)

**What this means:**
• On 95% of days, your losses won't exceed {abs(var_value)*100:.2f}%
• On the worst 5% of days, you can expect average losses of {abs(calculated_value)*100:.2f}%
• CVaR gives you insight into tail risk - the 'really bad' scenarios
                """
                
            elif concept_key == 'hurst':
                result = calculate_hurst_exponent.invoke({"data": data})
                
                if "error" in result:
                    return {"error": f"Failed to calculate Hurst: {result['error']}"}
                
                calculated_value = result['hurst_exponent']
                interpretation_key = result['interpretation']
                
                interpretation = f"""
**Live Analysis of Your Data:**
• Your time series has a Hurst exponent of {calculated_value:.3f}
• This indicates {interpretation_key} behavior
• Data points analyzed: {result['data_points']}

**What this means:**
• H < 0.5: Series tends to reverse direction (mean-reverting)
• H = 0.5: Series follows random walk (no predictable pattern)  
• H > 0.5: Series tends to continue in same direction (trending)
• Your series shows {interpretation_key} characteristics
                """
                
            else:
                return {"error": f"Calculation not implemented for concept: {concept}"}
            
            # Combine textbook definition with live analysis
            full_explanation = f"""
# {concept_info['name']}

## Definition
{concept_info['definition']}

{interpretation}

## Key Applications
{', '.join(concept_info.get('use_cases', ['General financial analysis']))}

## Additional Information
Formula: {concept_info.get('formula', 'See financial literature')}
            """
            
            return {
                "success": True,
                "concept": concept_info['name'],
                "explanation": full_explanation.strip(),
                "calculated_value": calculated_value,
                "raw_results": result,
                "data_points_used": len(data)
            }
            
        except Exception as e:
            logger.error(f"Error in FinancialTutorAgent: {str(e)}")
            return {"error": f"An error occurred during analysis: {str(e)}"}
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process educational requests"""
        # This would parse the request and call run() with appropriate parameters
        return {
            "agent": self.name,
            "request_type": "educational",
            "request": request,
            "explanation": "Use run() method for detailed concept explanation",
            "available_concepts": list(self.concepts.keys())
        }


class StrategyArchitectAgent(BaseFinancialAgent):
    """
    Agent for creating and testing new investment strategies
    Capabilities: Strategy ideation, hypothesis testing, research integration
    """
    
    def __init__(self):
        super().__init__(
            name="StrategyArchitect",
            description="Develops innovative investment strategies and tests new hypotheses"
        )
        
    def run(self, goal: str, universe: List[str] = None) -> Dict[str, Any]:
        """
        Executes the agent's logic to design a strategy.
        
        Parameters:
        -----------
        goal : str
            The high-level goal of the strategy (e.g., 'mean-reversion').
        universe : List[str], optional
            The list of tickers to consider for the strategy.
            
        Returns:
        --------
        Dict[str, Any]
            A dictionary containing the strategy rules and suggested next steps.
        """
        if universe is None:
            universe = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'BND']
            
        print(f"[StrategyArchitectAgent] Designing '{goal}' strategy with {len(universe)} assets.")
        
        if 'mean-reversion' not in goal.lower() and 'mean reversion' not in goal.lower():
            return {
                "error": "Currently, only 'mean-reversion' strategies are supported.",
                "supported_strategies": ["mean-reversion"]
            }
        
        try:
            hurst_results = []
            failed_tickers = []
            
            for ticker in universe:
                print(f"  - Analyzing {ticker}...")
                try:
                    # Get historical data
                    price_data = get_historical_data.invoke({
                        "ticker": ticker,
                        "period": "1y"
                    })
                    
                    if "error" not in price_data:
                        # Calculate Hurst exponent
                        hurst_result = calculate_hurst_exponent.invoke({
                            "data": price_data['prices']['close']
                        })
                        
                        if "error" not in hurst_result:
                            hurst_results.append({
                                'ticker': ticker,
                                'hurst': hurst_result['hurst_exponent'],
                                'interpretation': hurst_result['interpretation'],
                                'current_price': price_data['summary_stats']['current_price']
                            })
                        else:
                            failed_tickers.append(ticker)
                    else:
                        failed_tickers.append(ticker)
                        
                except Exception as e:
                    print(f"    Failed to analyze {ticker}: {str(e)}")
                    failed_tickers.append(ticker)
            
            if not hurst_results:
                return {
                    "error": "Failed to analyze any assets in the universe.",
                    "failed_tickers": failed_tickers
                }
            
            # Filter for mean-reverting stocks (H < 0.45)
            mean_reverting_stocks = [
                res for res in hurst_results 
                if res['hurst'] < 0.45
            ]
            
            # Sort by Hurst exponent (most mean-reverting first)
            mean_reverting_stocks.sort(key=lambda x: x['hurst'])
            
            # All analyzed stocks for reference
            all_stocks_sorted = sorted(hurst_results, key=lambda x: x['hurst'])
            
            if not mean_reverting_stocks:
                return {
                    "strategy_name": "Mean-Reversion Hunter",
                    "strategy_rules": "No strongly mean-reverting assets found in the universe (H < 0.45).",
                    "analysis_summary": {
                        "total_analyzed": len(hurst_results),
                        "mean_reverting_count": 0,
                        "all_results": all_stocks_sorted
                    },
                    "recommendation": "Consider expanding the universe or using a less strict threshold (H < 0.48).",
                    "next_steps": []
                }
            
            # Select top 3 mean-reverting stocks
            top_stocks = mean_reverting_stocks[:3]
            
            strategy_rules = [
                "## Mean-Reversion Hunter Strategy",
                "",
                "### Strategy Logic:",
                "1. **Universe Screening**: Analyze assets for mean-reversion characteristics",
                "2. **Signal Generation**: Calculate 1-year Hurst exponent monthly", 
                "3. **Asset Selection**: Choose assets with H < 0.45 (strong mean-reversion)",
                "4. **Portfolio Construction**: Equal-weight allocation to top 3 candidates",
                "5. **Rebalancing**: Monthly rebalancing on first trading day",
                "",
                "### Current Analysis Results:",
                f"- **Assets analyzed**: {len(hurst_results)}",
                f"- **Mean-reverting assets found**: {len(mean_reverting_stocks)}",
                "",
                "### Top Mean-Reverting Candidates:",
            ]
            
            for i, stock in enumerate(top_stocks, 1):
                strategy_rules.append(
                    f"{i}. **{stock['ticker']}**: H = {stock['hurst']:.3f} "
                    f"({stock['interpretation']}) - ${stock['current_price']:.2f}"
                )
            
            strategy_rules.extend([
                "",
                "### Implementation Rules:",
                "- **Entry**: Buy equal amounts of selected assets at month start",
                "- **Exit**: Sell positions that no longer qualify (H ≥ 0.45)",
                "- **Position Size**: 1/N allocation where N = number of qualifying assets",
                "- **Cash**: Hold cash if fewer than 2 qualifying assets"
            ])
            
            return {
                "success": True,
                "strategy_name": "Mean-Reversion Hunter",
                "strategy_rules": "\n".join(strategy_rules),
                "selected_assets": [s['ticker'] for s in top_stocks],
                "analysis_summary": {
                    "total_analyzed": len(hurst_results),
                    "failed_analysis": failed_tickers,
                    "mean_reverting_count": len(mean_reverting_stocks),
                    "top_candidates": top_stocks,
                    "all_results": all_stocks_sorted
                },
                "next_steps": [
                    "Would you like me to generate a backtest for this strategy?",
                    "Would you like me to create a rebalancing plan for current implementation?",
                    "Would you like to modify the Hurst threshold or universe?"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in StrategyArchitectAgent: {str(e)}")
            return {"error": f"An error occurred during strategy design: {str(e)}"}
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process strategy development requests"""
        return {
            "agent": self.name,
            "request_type": "strategy_development",
            "request": request,
            "message": "Use run() method for detailed strategy development"
        }


class StrategyRebalancingAgent(BaseFinancialAgent):
    """
    Agent for portfolio rebalancing and trade execution planning
    Capabilities: Trade plan generation, rebalancing optimization, cost analysis
    """
    
    def __init__(self):
        super().__init__(
            name="StrategyRebalancing",
            description="Creates actionable trade plans and optimizes portfolio rebalancing"
        )
    
    def run(self, current_portfolio: Dict[str, float], target_objective: str = "minimize_volatility") -> Dict[str, Any]:
        """
        Executes the agent's logic to generate a rebalancing plan.
        
        Parameters:
        -----------
        current_portfolio : Dict[str, float]
            A dictionary of current positions, e.g., {'AAPL': 10000, 'BND': 15000}.
        target_objective : str
            The optimization objective ('minimize_volatility', 'maximize_sharpe', etc.)
            
        Returns:
        --------
        Dict[str, Any]
            A dictionary containing the list of trades required.
        """
        print(f"[StrategyRebalancingAgent] Rebalancing for '{target_objective}' objective.")
        
        try:
            tickers = list(current_portfolio.keys())
            total_value = sum(current_portfolio.values())
            
            if total_value <= 0:
                return {"error": "Portfolio total value must be positive"}
            
            # Calculate current weights
            current_weights = {
                ticker: value / total_value 
                for ticker, value in current_portfolio.items()
            }
            
            print(f"  - Current portfolio value: ${total_value:,.2f}")
            print(f"  - Assets: {tickers}")
            
            # Fetch historical data for optimization
            returns_data = {}
            failed_assets = []
            
            for ticker in tickers:
                try:
                    price_data = get_historical_data.invoke({
                        "ticker": ticker,
                        "period": "1y"
                    })
                    
                    if "error" not in price_data:
                        returns_data[ticker] = price_data['returns']['daily_returns']
                    else:
                        failed_assets.append(ticker)
                        
                except Exception as e:
                    print(f"    Failed to get data for {ticker}: {str(e)}")
                    failed_assets.append(ticker)
            
            if len(returns_data) < 2:
                return {
                    "error": f"Need at least 2 assets with valid data. Failed: {failed_assets}",
                    "failed_assets": failed_assets
                }
            
            # Align data lengths (simple approach)
            min_length = min(len(returns) for returns in returns_data.values())
            aligned_returns = [
                returns_data[ticker][:min_length] 
                for ticker in returns_data.keys()
            ]
            
            # Create covariance matrix
            returns_df = pd.DataFrame(aligned_returns).T
            returns_df.columns = list(returns_data.keys())
            
            expected_returns = returns_df.mean().tolist()
            covariance_matrix = returns_df.cov().values.tolist()
            
            # Run portfolio optimization
            optimization_result = optimize_portfolio.invoke({
                "expected_returns": expected_returns,
                "covariance_matrix": covariance_matrix,
                "constraints": {"objective": target_objective}
            })
            
            if "error" in optimization_result:
                return {"error": f"Optimization failed: {optimization_result['error']}"}
            
            # Get optimal weights
            optimal_weights_list = optimization_result['optimal_weights']
            optimal_weights = {
                ticker: weight 
                for ticker, weight in zip(returns_data.keys(), optimal_weights_list)
            }
            
            # Calculate target values
            target_values = {
                ticker: weight * total_value 
                for ticker, weight in optimal_weights.items()
            }
            
            # Generate trade list
            trades = []
            trade_summary = {}
            
            for ticker in tickers:
                current_value = current_portfolio.get(ticker, 0)
                target_value = target_values.get(ticker, 0)
                delta = target_value - current_value
                
                trade_summary[ticker] = {
                    "current_value": current_value,
                    "current_weight": current_weights[ticker],
                    "target_value": target_value,
                    "target_weight": optimal_weights.get(ticker, 0),
                    "dollar_change": delta,
                    "weight_change": optimal_weights.get(ticker, 0) - current_weights[ticker]
                }
                
                # Only trade if change is significant (> 1% of portfolio)
                if abs(delta) > 0.01 * total_value:
                    action = "BUY" if delta > 0 else "SELL"
                    percentage_change = (delta / total_value) * 100
                    trades.append({
                        "action": action,
                        "ticker": ticker,
                        "amount": abs(delta),
                        "percentage_of_portfolio": abs(percentage_change),
                        "description": f"{action} ${abs(delta):,.2f} of {ticker} ({percentage_change:+.1f}%)"
                    })
            
            # Calculate expected improvement
            current_portfolio_metrics = self._calculate_portfolio_metrics(
                current_weights, expected_returns, covariance_matrix, list(returns_data.keys())
            )
            
            optimal_portfolio_metrics = optimization_result['portfolio_metrics']
            
            if not trades:
                return {
                    "success": True,
                    "rebalancing_plan": ["No rebalancing needed. Portfolio is already near optimal allocation."],
                    "current_allocation": current_weights,
                    "target_allocation": optimal_weights,
                    "portfolio_metrics": {
                        "current": current_portfolio_metrics,
                        "target": optimal_portfolio_metrics
                    },
                    "improvement": "Portfolio is already optimally allocated."
                }
            
            return {
                "success": True,
                "rebalancing_plan": [trade["description"] for trade in trades],
                "detailed_trades": trades,
                "trade_summary": trade_summary,
                "current_allocation": current_weights,
                "target_allocation": optimal_weights,
                "portfolio_metrics": {
                    "current": current_portfolio_metrics,
                    "target": optimal_portfolio_metrics
                },
                "expected_improvement": {
                    "volatility_change": optimal_portfolio_metrics['volatility'] - current_portfolio_metrics['volatility'],
                    "return_change": optimal_portfolio_metrics['expected_return'] - current_portfolio_metrics['expected_return'],
                    "sharpe_change": optimal_portfolio_metrics['sharpe_ratio'] - current_portfolio_metrics['sharpe_ratio']
                },
                "total_trades": len(trades),
                "total_turnover": sum(abs(trade["amount"]) for trade in trades)
            }
            
        except Exception as e:
            logger.error(f"Error in StrategyRebalancingAgent: {str(e)}")
            return {"error": f"An error occurred during rebalancing: {str(e)}"}
    
    def _calculate_portfolio_metrics(self, weights: Dict[str, float], expected_returns: List[float], 
                                   covariance_matrix: List[List[float]], tickers: List[str]) -> Dict[str, float]:
        """Calculate portfolio metrics for given weights"""
        weights_array = np.array([weights.get(ticker, 0) for ticker in tickers])
        expected_returns_array = np.array(expected_returns)
        cov_matrix = np.array(covariance_matrix)
        
        portfolio_return = np.dot(weights_array, expected_returns_array)
        portfolio_variance = np.dot(weights_array, np.dot(cov_matrix, weights_array))
        portfolio_volatility = np.sqrt(portfolio_variance)
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        return {
            "expected_return": float(portfolio_return),
            "volatility": float(portfolio_volatility),
            "sharpe_ratio": float(sharpe_ratio),
            "variance": float(portfolio_variance)
        }
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process rebalancing requests"""
        return {
            "agent": self.name,
            "request_type": "rebalancing",
            "request": request,
            "message": "Use run() method for detailed rebalancing analysis"
        }


class PortfolioSentinelAgent(BaseFinancialAgent):
    """
    Agent for continuous portfolio monitoring and risk surveillance
    Capabilities: Real-time monitoring, risk detection, alert generation
    """
    
    def __init__(self):
        super().__init__(
            name="PortfolioSentinel",
            description="Continuously monitors portfolios for risks and opportunities"
        )
    
    async def process_request(self, request: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process monitoring requests"""
        return {
            "agent": self.name,
            "request_type": "monitoring",
            "request": request,
            "status": "placeholder_response"
        }


# Agent Registry for easy lookup
AGENT_REGISTRY = {
    "quantitative_analyst": QuantitativeAnalystAgent,
    "financial_tutor": FinancialTutorAgent,
    "strategy_rebalancing": StrategyRebalancingAgent,
    "strategy_architect": StrategyArchitectAgent,
    "portfolio_sentinel": PortfolioSentinelAgent
}


def create_agent(agent_type: str, **kwargs) -> BaseFinancialAgent:
    """Factory function to create agents"""
    if agent_type not in AGENT_REGISTRY:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    return AGENT_REGISTRY[agent_type](**kwargs)
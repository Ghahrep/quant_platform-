"""
AI Package - Multi-Agent Financial Analysis System
Hybrid LangChain + AutoGen Implementation
"""

from .orchestrator import FinancialOrchestrator
from .agents import (
    QuantitativeAnalystAgent,
    FinancialTutorAgent,
    StrategyRebalancingAgent,
    StrategyArchitectAgent,
    PortfolioSentinelAgent
)
from .conversation_manager import AutoGenConversationManager

__version__ = "1.0.0"
__all__ = [
    "FinancialOrchestrator",
    "QuantitativeAnalystAgent", 
    "FinancialTutorAgent",
    "StrategyRebalancingAgent",
    "StrategyArchitectAgent",
    "PortfolioSentinelAgent",
    "AutoGenConversationManager"
]
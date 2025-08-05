"""
Financial Orchestrator Agent
Central coordination agent for the multi-agent financial system
Combines pattern-based routing with hybrid LangChain + AutoGen capability
"""

import re
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
import asyncio
import numpy as np

from .agents import (
    FinancialTutorAgent,
    StrategyArchitectAgent,
    StrategyRebalancingAgent,
    QuantitativeAnalystAgent,
    PortfolioSentinelAgent,
    BaseFinancialAgent
)

logger = logging.getLogger(__name__)


class QueryClassificationResult:
    """Result of query classification"""
    def __init__(self, query_type: str, complexity: str, required_agents: List[str],
                 confidence: float, reasoning: str, entities: Dict[str, Any] = None):
        self.query_type = query_type
        self.complexity = complexity
        self.required_agents = required_agents
        self.confidence = confidence
        self.reasoning = reasoning
        self.entities = entities or {}


class FinancialOrchestrator:
    """
    Central orchestrator agent that coordinates all other agents
    """

    def __init__(self):
        self.name = "FinancialOrchestrator"
        self.description = "Central coordination agent that routes queries to appropriate specialists"
        
        self.agents: Dict[str, BaseFinancialAgent] = {}
        self._initialize_agents()
        
        self.query_history = []
        
        self._setup_routing_logic()
        self._setup_classification_patterns()

    def _initialize_agents(self):
        """Initialize all financial agents"""
        logger.info("Initializing financial agents...")
        self.agents = {
            "financial_tutor": FinancialTutorAgent(),
            "strategy_architect": StrategyArchitectAgent(),
            "strategy_rebalancing": StrategyRebalancingAgent(),
            "quantitative_analyst": QuantitativeAnalystAgent(),
            "portfolio_sentinel": PortfolioSentinelAgent()
        }
        logger.info(f"Successfully initialized {len(self.agents)} agents")

    def _setup_routing_logic(self):
        """Setup query routing and classification logic"""
        self.routing_rules = {
            "educational": ["financial_tutor"],
            "strategy_design": ["strategy_architect"],
            "rebalancing": ["strategy_rebalancing"],
            "analysis": ["quantitative_analyst"],
            "monitoring": ["portfolio_sentinel"],
        }

    def _setup_classification_patterns(self):
        """Setup pattern-based query classification"""
        self.classification_patterns = {
            "educational": [r"explain|what is|define|teach|learn|understand|concept|cvar|hurst|garch"],
            "strategy_design": [r"design.*strategy|create.*strategy|build.*strategy"],
            "rebalancing": [r"rebalance|optimize.*portfolio|allocation|weights"],
            "analysis": [r"analyze|calculate|compute|measure|assess|evaluate"],
            "monitoring": [r"monitor|watch|alert|track|surveillance|observe"]
        }

    def classify_query(self, query: str) -> QueryClassificationResult:
        """Classify the user query to determine appropriate agent routing"""
        query_lower = query.lower()
        category_scores = {}
        entities = {}

        if "cvar" in query_lower: entities["concept"] = "cvar"
        elif "hurst" in query_lower: entities["concept"] = "hurst"
        elif "garch" in query_lower: entities["concept"] = "garch"
        
        if "mean-reversion" in query_lower or "mean reversion" in query_lower:
            entities["strategy_goal"] = "mean-reversion"

        for category, patterns in self.classification_patterns.items():
            score = sum(len(re.findall(pattern, query_lower)) for pattern in patterns)
            if score > 0:
                category_scores[category] = score

        if not category_scores:
            best_category = "general"
            required_agents = ["quantitative_analyst"]
            confidence = 0.3
            reasoning = "No specific patterns matched, defaulting to general analysis"
        else:
            best_category = max(category_scores, key=category_scores.get)
            required_agents = self.routing_rules.get(best_category, ["quantitative_analyst"])
            confidence = 0.5 + (category_scores[best_category] / len(query_lower.split())) * 0.5
            reasoning = f"Matched patterns in '{best_category}' category"

        complexity = "simple"

        return QueryClassificationResult(
            query_type=best_category,
            complexity=complexity,
            required_agents=required_agents,
            confidence=confidence,
            reasoning=reasoning,
            entities=entities
        )

    async def process_query(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Main entry point for processing user queries"""
        print(f"[FinancialOrchestrator] Processing query: '{query[:50]}...'")
        
        classification = self.classify_query(query)
        print(f"[FinancialOrchestrator] Classification: {classification.query_type} "
              f"(confidence: {classification.confidence:.2f}, complexity: {classification.complexity})")

        response = await self._handle_query(query, classification, context)
        
        self.query_history.append({"query": query, "response": response})
        return response

    def _get_intelligent_fallback(self, query: str) -> str:
        """
        Simulates an intelligent response for general queries.
        In a real application, this would call a generative AI model.
        """
        if "strategy" in query:
            return "To evaluate if your strategy is appropriate, I need more information. Could you tell me about its goals, risk tolerance, and the assets involved? Or, I can help you design a new one based on objectives like 'mean-reversion'."
        elif "risk" in query:
            return "I can analyze risk in several ways, such as calculating Value at Risk (VaR), running stress tests, or forecasting volatility with a GARCH model. What specific risk analysis would be most helpful for you?"
        else:
            return "That's an interesting question. While I can't answer that directly, I can help you with tasks like explaining financial concepts (CVaR, Hurst), designing trading strategies, or rebalancing your portfolio. How can I assist you?"

    async def _handle_query(self, query: str, classification: QueryClassificationResult,
                                   context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handles all queries, routing to specific agents or a smart fallback."""
        primary_agent_name = classification.required_agents[0]
        agent = self.agents.get(primary_agent_name)

        if not agent:
            return {"success": False, "message": f"Agent '{primary_agent_name}' not found."}

        try:
            final_message = ""
            result = {}
            
            # --- MODIFIED LOGIC ---
            # Route to specific, powerful agent methods if the query type is clear
            if classification.query_type == "educational":
                concept = classification.entities.get("concept")
                if not concept:
                    final_message = "I can explain concepts like CVaR, Hurst, and GARCH. Which one are you interested in?"
                else:
                    sample_data = np.random.normal(0.001, 0.02, 252).tolist()
                    result = agent.run(concept=concept, data=sample_data)
                    final_message = result.get("explanation", "Could not generate explanation.")
            
            # --- NEW: Handle "general" queries with the intelligent fallback ---
            elif classification.query_type == "general":
                final_message = self._get_intelligent_fallback(query)
                result = {"status": "general_inquiry"}

            # You can add elif blocks for other specific query types here
            # elif classification.query_type == "strategy_design": ...
            
            else:
                # Fallback for other defined but not yet implemented routes
                result = await agent.process_request(query, context)
                final_message = result.get("message", "Request processed.")

            return {
                "success": True,
                "message": final_message,
                "agent_used": primary_agent_name,
                "classification": classification.__dict__,
                "raw_result": result
            }
        except Exception as e:
            logger.error(f"Error in agent '{primary_agent_name}': {str(e)}")
            return {"success": False, "message": f"An error occurred with the {primary_agent_name} agent."}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get status of all agents and system health"""
        return {
            "orchestrator": "active",
            "timestamp": datetime.now().isoformat(),
            "agents": {name: {"status": "active"} for name in self.agents.keys()},
        }

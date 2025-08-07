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
import anthropic

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

        # Rule 1: Check if verbs from multiple categories are present.
        matched_categories = list(category_scores.keys())
        
        # Rule 2: Check for keywords that link actions.
        connector_keywords = [' and ', ' then ', ' after that ', ' once that is done ']
        
        has_connector = any(keyword in query_lower for keyword in connector_keywords)

        if len(matched_categories) > 1 and has_connector:
            complexity = "multi-step"
            reasoning += f" | Detected multi-step query with {len(matched_categories)} topics and a connector keyword."
        # --- END: Complexity Detection Logic ---

        return QueryClassificationResult(
            query_type=best_category,
            complexity=complexity,
            required_agents=required_agents,
            confidence=confidence,
            reasoning=reasoning,
            entities=entities
        )

    async def process_query(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Upgraded hybrid approach with sequential workflow routing."""
        import os
        print(f"🔑 DEBUG: ANTHROPIC_API_KEY exists: {'ANTHROPIC_API_KEY' in os.environ}")
        
        context = context or {}
        portfolio_context = context.get("portfolio_context")
        
        # 1. Classify the query
        classification = self.classify_query(query)
        print(f"[FinancialOrchestrator] Classification: {classification.query_type} (confidence: {classification.confidence:.2f}, complexity: {classification.complexity})")
        
        # 2. --- NEW TOP-LEVEL ROUTER ---
        # First, check if this is a multi-step query that requires a workflow.
        if classification.complexity == 'multi-step':
            return await self._handle_sequential_workflow(query, classification, context)
        
        # If not multi-step, proceed with the previous single-step routing logic.
        else:
            has_portfolio_context = portfolio_context is not None
            portfolio_specialist_agents = ["rebalancing", "analysis"]
            general_specialist_agents = ["educational", "strategy_design"]

            if classification.query_type in portfolio_specialist_agents:
                print(f"🤖 ROUTING TO PORTFOLIO AGENT: {classification.required_agents[0]}")
                if has_portfolio_context:
                    import json
                    context['portfolio_data'] = json.loads(portfolio_context)
                return await self._handle_query(query, classification, context)

            elif classification.query_type in general_specialist_agents:
                print(f"🤖 ROUTING TO GENERAL AGENT: {classification.required_agents[0]}")
                return await self._handle_query(query, classification, context)
                
            else:
                print(f"🧠 ROUTING TO CLAUDE (Default): Portfolio context={has_portfolio_context}, Query type={classification.query_type}")
                return await self._process_with_claude(query, context.get("chat_history", []), portfolio_context, classification)

    async def _process_with_claude(self, query: str, chat_history: List[Dict], portfolio_context: Optional[str], classification: QueryClassificationResult) -> Dict[str, Any]:
        """Process query using Claude with enhanced prompts that include agent expertise"""
        
        # Enhanced system prompt that incorporates agent knowledge
        system_prompt = (
            "You are Gertie, an expert financial AI assistant with specialized knowledge in multiple areas:\n"
            "- Portfolio Analysis: Calculate metrics like CVaR, Hurst exponent, GARCH volatility\n"
            "- Strategy Design: Create mean-reversion and other trading strategies\n" 
            "- Risk Assessment: Evaluate portfolio risk and provide recommendations\n"
            "- Financial Education: Explain complex concepts clearly\n\n"
            "Your tone is professional, helpful, and concise. Analyze the user's request and use the provided context "
            "to answer accurately. When you have portfolio data, provide specific analysis. Do not make up information."
        )
        
        # Build user prompt with classification insights
        user_prompt_parts = []
        
        # Add query classification context
        user_prompt_parts.append(f"Query Type: {classification.query_type} (confidence: {classification.confidence:.2f})")
        if classification.entities:
            user_prompt_parts.append(f"Key Concepts: {classification.entities}")
        
        # Add Portfolio Context Block (if available)
        if portfolio_context:
            user_prompt_parts.append(
                "--- USER PORTFOLIO DATA ---\n"
                f"{portfolio_context}\n"
                "--- END PORTFOLIO DATA ---\n"
                "Use this data to provide specific, personalized analysis."
            )

        # Add Conversation History Block (if available)
        if chat_history:
            history_str = "--- CONVERSATION HISTORY ---\n"
            for turn in chat_history:
                role = "Human" if turn.get("role") == "user" else "AI"
                history_str += f"{role}: {turn.get('content')}\n"
            history_str += "--- END HISTORY ---"
            user_prompt_parts.append(history_str)

        # Add the Final User Query
        user_prompt_parts.append(f"Current Question: {query}")
        
        user_prompt = "\n\n".join(user_prompt_parts)
        
        print(f"--- System Prompt ---\n{system_prompt}\n----------------------")
        print(f"--- User Prompt ---\n{user_prompt}\n----------------------")
        
        try:
            client = anthropic.AsyncAnthropic()
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            ai_message = message.content[0].text
            print(f"Claude Response: {ai_message}")
            
            return {
                "success": True, 
                "message": ai_message,
                "classification": classification.__dict__,
                "processing_method": "claude_with_context"
            }

        except Exception as e:
            print(f"🔥 Claude Call Failed: {e}")
            return {"success": False, "message": "I'm having trouble connecting to my AI brain. Please try again later."}
    
    def _build_llm_prompt(self, query: str, history: List[Dict], portfolio_json: Optional[str]) -> tuple[str, str]:
        """Assembles a system prompt and a user prompt for Claude."""
        
        # 1. The System Persona goes in a dedicated prompt
        system_prompt = (
            "You are Gertie, an expert financial AI assistant for a platform where users manage their investment portfolios. "
            "Your tone is professional, helpful, and concise. Analyze the user's request and use the provided context "
            "to answer accurately. Do not make up information. If the answer is not in the provided context, say so."
        )

        # 2. The rest of the context becomes the user prompt
        user_prompt_parts = []

        # Add Portfolio Context Block (if available)
        if portfolio_json:
            user_prompt_parts.append(
                "--- USER PORTFOLIO DATA ---\n"
                f"{portfolio_json}\n"
                "--- END PORTFOLIO DATA ---\n"
                "Use the data above to answer any questions about the user's holdings."
            )

        # Add Conversation History Block (if available)
        if history:
            history_str = "--- CONVERSATION HISTORY ---\n"
            for turn in history:
                role = "Human" if turn.get("role") == "user" else "AI"
                history_str += f"{role}: {turn.get('content')}\n"
            history_str += "--- END HISTORY ---"
            user_prompt_parts.append(history_str)

        # Add the Final User Query
        user_prompt_parts.append(f"Current Question: {query}")
        
        user_prompt = "\n\n".join(user_prompt_parts)
        
        return system_prompt, user_prompt

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
                final_message = result.get("response", "Request processed.")

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
    
    # In ai/orchestrator.py, replace the existing _handle_sequential_workflow method

    async def _handle_sequential_workflow(self, query: str, classification: QueryClassificationResult,
                                          context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handles complex, multi-step queries by chaining agents together.
        """
        print("🚀 KICKING OFF SEQUENTIAL WORKFLOW...")
        
        # In a more advanced version, we would dynamically determine the sequence.
        # For now, we hardcode it for our target query.
        agent_sequence = ['strategy_architect', 'quantitative_analyst']
        
        step_results = []
        current_context = context.copy()
        
        # --- FIX #1: Use targeted queries for each step ---
        # We can infer the queries for each agent from the user's original request.
        user_query_parts = re.split(r'\s+and then\s+|\s+and\s+', query, flags=re.IGNORECASE)
        agent_queries = {
            'strategy_architect': user_query_parts[0] if len(user_query_parts) > 0 else query,
            'quantitative_analyst': user_query_parts[1] if len(user_query_parts) > 1 else "perform a risk analysis"
        }

        for i, agent_name in enumerate(agent_sequence):
            agent = self.agents.get(agent_name)
            if not agent:
                # ... (error handling remains the same)
                return {"success": False, "message": f"Agent '{agent_name}' not found."}

            current_query = agent_queries.get(agent_name, query)
            print(f"  -> Workflow Step {i+1}: Calling {agent_name} with query: '{current_query}'")
            
            result = await agent.process_request(current_query, current_context)
            step_response = result.get("response")
            
            if not result.get("status") == "completed" or not step_response:
                # ... (error handling remains the same)
                return {"success": False, "message": f"Workflow failed at step {i+1}."}

            step_results.append(step_response)
            
            # --- FIX #2: More robust context parsing ---
            if agent_name == 'strategy_architect':
                mock_portfolio = []
                for line in step_response.splitlines():
                    # Find lines that start with "- **" and extract the ticker
                    if line.strip().startswith('- **'):
                        try:
                            # A simple regex to find an all-caps ticker symbol
                            symbol_match = re.search(r'\*\*([A-Z]{1,5})\*\*', line)
                            if symbol_match:
                                symbol = symbol_match.group(1)
                                mock_portfolio.append({"symbol": symbol, "total_cost_basis": 10000})
                        except (IndexError, AttributeError):
                            continue # Ignore lines that don't parse correctly
                
                current_context['portfolio_data'] = mock_portfolio
                print(f"  -> Context Updated: Passed mock portfolio {mock_portfolio} to next step.")

        # --- Response Synthesis ---
        final_message = "\n\n---\n\n".join(step_results)
        print("✅ WORKFLOW COMPLETED. Synthesizing final response.")

        return {
            "success": True,
            "message": final_message,
            "agent_used": "Sequential Workflow",
            "classification": classification.__dict__,
        }

    async def get_system_status(self) -> Dict[str, Any]:
        """Get status of all agents and system health"""
        return {
            "orchestrator": "active",
            "timestamp": datetime.now().isoformat(),
            "agents": {name: {"status": "active"} for name in self.agents.keys()},
        }

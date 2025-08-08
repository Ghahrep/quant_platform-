"""
AutoGen Conversation Manager
Manages multi-agent conversations using AutoGen framework
"""

from typing import Dict, List, Any, Optional
import logging
import os 
import asyncio
from datetime import datetime

# Placeholder for AutoGen imports - install autogen when ready
try:
    import autogen
    AUTOGEN_AVAILABLE = True
except ImportError:
    AUTOGEN_AVAILABLE = False
    autogen = None

logger = logging.getLogger(__name__)


class AutoGenConversationManager:
    """
    Manages AutoGen conversations for complex multi-agent workflows
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, Any] = {}
        self.session_history: List[Dict[str, Any]] = []
        self.config = self._load_autogen_config()
    
    def _load_autogen_config(self) -> Dict[str, Any]:
        """
        Load AutoGen configuration to use the ANTHROPIC_API_KEY from environment variables.
        """
        # This is the configuration list format AutoGen expects.
        # It allows for multiple models, but we will configure one for Claude.
        config_list = [
            {
                "model": "claude-3-5-sonnet-20240620", # The specific Claude model to use
                "api_key": os.getenv("ANTHROPIC_API_KEY"), # Load the key from your .env file
                "api_type": "anthropic", # Specify that this is an Anthropic model
            }
        ]

        return {
            "config_list": config_list,
            "temperature": 0.1,
            "timeout": 300, # 5 minutes
        }

    # In ai/conversation_manager.py, replace the start_conversation method

    async def start_conversation(self, participants: List[str], initial_query: str, 
                                 context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Starts a multi-agent conversation using AutoGen to solve a complex query.
        """
        if not AUTOGEN_AVAILABLE:
            return {"success": False, "message": "AutoGen library is not installed."}
        
        try:
            llm_config = self.config

            user_proxy = autogen.UserProxyAgent(
                name="User_Proxy",
                human_input_mode="NEVER",
                max_consecutive_auto_reply=0,
                code_execution_config={"work_dir": "autogen_workspace", "use_docker": False}
            )

            quant = autogen.AssistantAgent(name="QuantitativeAnalyst", llm_config=llm_config, system_message="You are a quantitative analyst...")
            architect = autogen.AssistantAgent(name="StrategyArchitect", llm_config=llm_config, system_message="You are a strategy architect...")
            rebalancer = autogen.AssistantAgent(name="StrategyRebalancing", llm_config=llm_config, system_message="You are a rebalancing specialist...")
            
            planner = autogen.AssistantAgent(
                name="Planner",
                llm_config=llm_config,
                system_message="""You are the Planner. Your job is to review the entire conversation...
                Your response MUST be structured with three sections: '1. Risk Assessment', '2. New Strategic Allocation', and '3. Actionable Trade Plan'.
                After presenting the complete plan, you MUST end your message with the single word: TERMINATE"""
            )

            group_chat = autogen.GroupChat(
                agents=[user_proxy, quant, architect, rebalancer, planner],
                messages=[],
                max_round=15 
            )
            
            # --- THIS IS THE FINAL FIX ---
            # The termination condition is now much more specific.
            manager = autogen.GroupChatManager(
                groupchat=group_chat, 
                llm_config=llm_config,
                # The chat only terminates if the SENDER is the Planner AND the message contains TERMINATE.
                is_termination_msg=lambda x: x.get("name") == "Planner" and "TERMINATE" in x.get("content", "").upper()
            )

            initial_message = f"""
            The user has the following complex request: "{initial_query}"
            Current portfolio context (with live market values):
            {context.get('portfolio_context', 'No portfolio data provided.')}

            Please work together as a team to formulate a complete, actionable plan, following this exact sequence:
            1. The QuantitativeAnalyst will first assess the risk of the current portfolio.
            2. The StrategyArchitect will then propose a new target allocation.
            3. The StrategyRebalancing agent will calculate the specific trades needed.
            4. Finally, the Planner will summarize the complete plan and terminate the mission.
            Begin.
            """

            await user_proxy.a_initiate_chat(
                manager,
                message=initial_message,
            )
            
            final_response = "The AI team has completed their analysis."
            for msg in reversed(group_chat.messages):
                # We now look for the message from the "Planner"
                if msg.get('name') == 'Planner' and msg['content'].strip():
                    final_response = msg['content'].replace("TERMINATE", "").strip()
                    break

            return {
                "success": True,
                "message": final_response,
                "full_conversation": group_chat.messages
            }
            
        except Exception as e:
            logger.error(f"Error in AutoGen conversation: {e}")
            return {"success": False, "message": f"An error occurred during the multi-agent conversation: {e}"}
    
    async def _create_autogen_agents(self, participants: List[str]) -> List[Any]:
        """
        Create AutoGen agents based on participant names
        """
        agents = []
        
        agent_configs = {
            "quantitative_analyst": {
                "name": "QuantitativeAnalyst",
                "system_message": "You are a quantitative analyst specializing in financial risk analysis and portfolio optimization."
            },
            "financial_tutor": {
                "name": "FinancialTutor", 
                "system_message": "You are a financial educator who explains complex concepts in simple terms."
            },
            "strategy_rebalancing": {
                "name": "StrategyRebalancing",
                "system_message": "You are a portfolio manager focused on rebalancing and trade execution."
            },
            "strategy_architect": {
                "name": "StrategyArchitect",
                "system_message": "You are a strategy developer who creates innovative investment approaches."
            },
            "portfolio_sentinel": {
                "name": "PortfolioSentinel",
                "system_message": "You are a risk monitor focused on portfolio surveillance and alerts."
            }
        }
        
        for participant in participants:
            if participant in agent_configs:
                config = agent_configs[participant]
                agent = autogen.AssistantAgent(
                    name=config["name"],
                    llm_config=self.config,
                    system_message=config["system_message"]
                )
                agents.append(agent)
        
        # Add user proxy agent
        user_proxy = autogen.UserProxyAgent(
            name="UserProxy",
            human_input_mode="NEVER",
            # --- MODIFIED LINE ---
            # This tells AutoGen to execute code locally instead of in Docker.
            code_execution_config={
                "work_dir": "autogen_workspace",
                "use_docker": False 
            }
        )
        agents.append(user_proxy)
        
        return agents
    
    async def _run_conversation(self, manager: Any, initial_query: str, 
                              context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute the AutoGen conversation
        """
        # This would contain the actual AutoGen conversation logic
        # For now, placeholder implementation
        
        messages = [
            {"role": "user", "content": initial_query},
            {"role": "assistant", "content": "Beginning multi-agent analysis..."}
        ]
        
        # Simulate conversation rounds
        for round_num in range(3):
            messages.append({
                "role": "agent", 
                "content": f"Round {round_num + 1} analysis from agents",
                "round": round_num + 1
            })
        
        return {
            "messages": messages,
            "final_answer": "Collaborative analysis completed",
            "rounds": 3,
            "consensus_reached": True
        }
    
    async def _placeholder_conversation(self, participants: List[str], initial_query: str,
                                     context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Placeholder conversation when AutoGen is not available
        """
        logger.info(f"Running placeholder conversation with participants: {participants}")
        
        return {
            "session_id": "placeholder_session",
            "result": {
                "messages": [
                    {"role": "system", "content": "AutoGen conversation placeholder"},
                    {"role": "user", "content": initial_query},
                    {"role": "assistant", "content": f"Simulated collaboration between {', '.join(participants)}"}
                ],
                "final_answer": f"Placeholder response to: {initial_query}",
                "participants": participants,
                "mode": "fallback"
            },
            "participants": participants,
            "status": "placeholder_mode"
        }
    
    def get_session_history(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation history for a specific session"""
        return self.active_sessions.get(session_id)
    
    def list_active_sessions(self) -> List[str]:
        """List all active conversation sessions"""
        return list(self.active_sessions.keys())
    
    async def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Cleanup old conversation sessions"""
        current_time = datetime.now()
        sessions_to_remove = []
        
        for session_id, session_data in self.active_sessions.items():
            session_time = datetime.fromisoformat(session_data["created_at"])
            age_hours = (current_time - session_time).total_seconds() / 3600
            
            if age_hours > max_age_hours:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up old session: {session_id}")
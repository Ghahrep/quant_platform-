"""
Financial Risk Management System - FastAPI Backend Skeleton
Main application file with complete API endpoint structure
Enhanced with robust WebSocket connection management
"""

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union, Any, Set
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID, uuid4
import json
import asyncio
import pandas as pd
import numpy as np
import time
import logging
from websockets.exceptions import ConnectionClosed

# ADD THESE LINES - Environment Loading
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv("core/.env")  # Since your .env is in the core/ directory
print("🔑 Environment Loading Debug:")
print(f"✅ .env file exists: {os.path.exists('core/.env')}")
api_key = os.getenv("ANTHROPIC_API_KEY")
if api_key:
    print(f"✅ ANTHROPIC_API_KEY loaded: {api_key[:15]}...")
else:
    print("❌ ANTHROPIC_API_KEY not found after loading .env")
from auth.endpoints import auth_router
from auth.endpoints import get_current_active_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import analysis functions
from analysis.fractal import calculate_hurst
from analysis.risk import calculate_cvar, fit_garch_forecast
from analysis.regime import detect_hmm_regimes
from analysis.fractal import generate_fbm_path

# import database functions
from models.user import User # The Pydantic model for your use

#import Portfolio functions
from portfolio.endpoints import portfolio_router
from models.portfolio import get_user_portfolio

# AI System Integration
from ai.orchestrator import FinancialOrchestrator
ai_orchestrator = FinancialOrchestrator()

# Initialize FastAPI app
app = FastAPI(
    title="Financial Risk Management System",
    description="Advanced portfolio risk analysis and management platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
chat_history_cache: Dict[str, List[Dict[str, Any]]] = {}

# ================================
# ROBUST WEBSOCKET CONNECTION MANAGER
# ================================

class ConnectionManager:
    """Enhanced WebSocket connection manager with robust error handling"""
    
    def __init__(self):
        # Store active connections
        self.active_connections: Set[WebSocket] = set()
        # Track connection metadata for debugging
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_info: str = "Unknown"):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_info[websocket] = {
            "client_info": client_info,
            "connected_at": asyncio.get_event_loop().time()
        }
        logger.info(f"Client connected: {client_info}. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            client_info = self.connection_info.pop(websocket, {}).get("client_info", "Unknown")
            logger.info(f"Client disconnected: {client_info}. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        if websocket not in self.active_connections:
            logger.warning("Attempted to send message to disconnected client")
            return False
        
        try:
            if websocket.client_state.value == 1:  # WebSocketState.CONNECTED
                await websocket.send_text(message)
                return True
            else:
                logger.warning(f"WebSocket not in connected state: {websocket.client_state}")
                self.disconnect(websocket)
                return False
        except (ConnectionClosed, RuntimeError, Exception) as e:
            logger.warning(f"Failed to send personal message: {e}")
            self.disconnect(websocket)
            return False
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients with robust error handling"""
        if not self.active_connections:
            logger.debug("No active connections to broadcast to")
            return
        
        # Create a copy of connections to iterate over
        connections_to_broadcast = self.active_connections.copy()
        failed_connections = set()
        successful_broadcasts = 0
        
        for connection in connections_to_broadcast:
            try:
                # Check if connection is still valid
                if connection.client_state.value == 1:  # WebSocketState.CONNECTED
                    await connection.send_text(message)
                    successful_broadcasts += 1
                else:
                    logger.debug(f"Skipping connection in state: {connection.client_state}")
                    failed_connections.add(connection)
            
            except ConnectionClosed:
                logger.debug("Connection closed during broadcast")
                failed_connections.add(connection)
            
            except RuntimeError as e:
                if "close message has been sent" in str(e).lower():
                    logger.debug("Connection already closed - close message sent")
                else:
                    logger.warning(f"Runtime error during broadcast: {e}")
                failed_connections.add(connection)
            
            except Exception as e:
                logger.error(f"Unexpected error broadcasting to client: {e}")
                failed_connections.add(connection)
        
        # Clean up failed connections
        for failed_connection in failed_connections:
            self.disconnect(failed_connection)
        
        if failed_connections:
            logger.info(f"Broadcast completed: {successful_broadcasts} successful, {len(failed_connections)} failed connections removed")
        else:
            logger.debug(f"Broadcast successful to {successful_broadcasts} connections")
    
    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcast JSON data to all connected clients"""
        try:
            message = json.dumps(data)
            await self.broadcast(message)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to serialize broadcast data: {e}")

# Create global connection manager instance
manager = ConnectionManager()

# ================================
# PYDANTIC MODELS
# ================================

# Base Models
class BaseResponse(BaseModel):
    success: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ErrorResponse(BaseModel):
    success: bool = False
    error: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AsyncTaskResponse(BaseModel):
    task_id: str
    status: str = "pending"
    estimated_completion: Optional[datetime] = None
    progress: int = 0
    result_url: Optional[str] = None

# Analysis Models
class HurstExponentRequest(BaseModel):
    data: List[float] = Field(..., min_items=50, description="Time series data")

class HurstExponentResponse(BaseResponse):
    hurst_exponent: float
    interpretation: str

class GARCHRequest(BaseModel):
    returns: List[float] = Field(..., min_items=100, description="Return series")
    forecast_horizon: int = Field(30, ge=1, le=252)

class GARCHResponse(BaseResponse):
    data: Dict[str, Any]

class CVarRequest(BaseModel):
    portfolio_returns: List[float] = Field(..., min_items=100)
    confidence_level: float = Field(0.95, ge=0.9, le=0.99)

class CVarResponse(BaseResponse):
    data: Dict[str, Any]

class StressTestRequest(BaseModel):
    portfolio_positions: Dict[str, float] = Field(..., description="Asset positions")
    stress_scenarios: List[Dict[str, Any]] = Field(..., min_items=1)

class RegimeDetectionRequest(BaseModel):
    market_data: Dict[str, List[float]] = Field(..., description="Market time series")
    n_regimes: int = Field(3, ge=2, le=10)
    covariance_type: str = Field("full", description="Covariance structure")

class RegimeDetectionResponse(BaseResponse):
    data: Dict[str, Any]

class FbmSimulationRequest(BaseModel):
    initial_price: float = Field(100, gt=0)
    hurst: float = Field(0.5, gt=0, lt=1)
    days: int = Field(252, gt=0)
    volatility: float = Field(0.2, ge=0)
    drift: float = Field(0.05)
    num_paths: int = Field(10, gt=0, le=100)

class FbmSimulationResponse(BaseResponse):
    data: Dict[str, Any]

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None

# ================================
# UTILITY FUNCTIONS
# ================================

def create_metadata(computation_time_ms: int = 245, cache_hit: bool = False) -> Dict[str, Any]:
    """Create standard response metadata"""
    return {
        "request_id": f"req_{uuid4().hex[:6]}",
        "computation_time_ms": computation_time_ms,
        "cache_hit": cache_hit,
        "api_version": "v1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# ================================
# ANALYSIS API ENDPOINTS
# ================================

@app.post("/api/v1/analysis/fractal/hurst-exponent", response_model=HurstExponentResponse)
async def calculate_hurst_exponent_endpoint(request: HurstExponentRequest):
    """Calculate Hurst exponent for trend persistence analysis"""
    try:
        series = pd.Series(request.data)
        hurst_value = calculate_hurst(series)
        
        if hurst_value < 0.45:
            interpretation = "mean-reverting"
        elif hurst_value > 0.55:
            interpretation = "persistent"
        else:
            interpretation = "random_walk"

        return HurstExponentResponse(
            hurst_exponent=hurst_value,
            interpretation=interpretation,
            metadata=create_metadata()
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/api/v1/analysis/volatility/garch", response_model=GARCHResponse)
async def estimate_garch_model(request: GARCHRequest):
    """GARCH model estimation and forecasting"""
    try:
        dates = pd.to_datetime(pd.date_range(end=datetime.now(), periods=len(request.returns)))
        series = pd.Series(request.returns, index=dates)
        
        in_sample_vol, forecast_vol = fit_garch_forecast(series, forecast_horizon=request.forecast_horizon)
        
        response_data = {
            "in_sample_volatility": in_sample_vol.dropna().tolist(),
            "forecast_volatility": [{"day": f"D+{i+1}", "vol": v} for i, v in enumerate(forecast_vol.dropna().tolist())],
        }
        
        return GARCHResponse(data=response_data, metadata=create_metadata())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analysis/risk/cvar", response_model=CVarResponse)
async def calculate_cvar_endpoint(request: CVarRequest):
    """Conditional Value at Risk calculation"""
    try:
        series = pd.Series(request.portfolio_returns)
        cvar_value = calculate_cvar(series, confidence_level=request.confidence_level)
        response_data = {
            "cvar_estimate": cvar_value,
            "confidence_level": request.confidence_level
        }
        return CVarResponse(data=response_data, metadata=create_metadata())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analysis/risk/stress-test")
async def perform_stress_test(request: StressTestRequest):
    """Portfolio stress testing under various scenarios"""
    # This is a placeholder implementation
    return {
        "success": True,
        "data": {
            "scenario_results": [
                {
                    "scenario_name": "market_crash_2008",
                    "portfolio_loss": -285000,
                }
            ]
        },
        "metadata": create_metadata()
    }

@app.post("/api/v1/analysis/regime/detect", response_model=RegimeDetectionResponse)
async def detect_market_regimes_endpoint(request: RegimeDetectionRequest):
    """Hidden Markov Model regime detection"""
    try:
        first_key = list(request.market_data.keys())[0]
        series = pd.Series(request.market_data[first_key])

        regimes, model = detect_hmm_regimes(series, n_regimes=request.n_regimes)

        regime_chars = {}
        for i in range(model.n_components):
            regime_chars[f"regime_{i}"] = {
                "name": f"Regime {i}",
                "mean_return": model.means_[i][0],
                "volatility": np.sqrt(model.covars_[i][0][0])
            }

        response_data = {
            "regime_labels": regimes.tolist(),
            "regime_characteristics": regime_chars,
            "transition_matrix": model.transmat_.tolist()
        }
        return RegimeDetectionResponse(data=response_data, metadata=create_metadata())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/simulation/fbm", response_model=FbmSimulationResponse)
async def run_fbm_simulation(request: FbmSimulationRequest):
    """Run a Monte Carlo simulation using Fractional Brownian Motion"""
    try:
        paths = [generate_fbm_path(**request.dict()).tolist() for _ in range(request.num_paths)]
        final_prices = [p[-1] for p in paths]
        response_data = {
            "num_paths": request.num_paths,
            "simulation_days": request.days,
            "summary_statistics": {
                "mean_final_value": np.mean(final_prices),
                "median_final_value": np.median(final_prices),
                "std_final_value": np.std(final_prices),
            },
            "paths": paths
        }
        return FbmSimulationResponse(data=response_data, metadata=create_metadata())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def is_portfolio_query(query: str) -> bool:
    """Simple keyword-based intent detection for portfolio queries."""
    keywords = [
        "my portfolio", "my holdings", "my positions", "what is my", 
        "in my account", "my largest", "my smallest", "how many shares"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in keywords)


@app.post("/api/v1/ai/orchestrator/query")
async def ai_orchestrator_query(
    request: ChatRequest,
    # We only need the current_user dependency, no 'db' session is required.
    current_user: User = Depends(get_current_active_user)
):
    query = request.query
    conversation_id = request.conversation_id
    
    portfolio_context_str = None
    if is_portfolio_query(query):
        print("📈 PORTFOLIO INTENT DETECTED. Fetching portfolio...")
        
        # Call your existing CRUD function directly, passing the user's email.
        portfolio_positions = get_user_portfolio(current_user.email)
        
        if portfolio_positions:
            # Convert list of Pydantic models to a list of dictionaries
            # Note: Your model might use .dict() or .model_dump() depending on Pydantic version
            try:
                positions_list = [pos.model_dump() for pos in portfolio_positions]
            except AttributeError:
                positions_list = [pos.dict() for pos in portfolio_positions]

            # Convert the list of dictionaries to a JSON string for the AI
            portfolio_context_str = json.dumps(positions_list, default=str)
            print(f"📊 PORTFOLIO FETCHED. Size: {len(portfolio_context_str)} bytes.")
        else:
            print("📭 No portfolio found for this user.")

    # This logic for state management remains the same
    history = chat_history_cache.get(conversation_id, [])
    
    context = {
        "chat_history": history,
        "portfolio_context": portfolio_context_str 
    }

    print(f"✅ BACKEND RECEIVED: query='{query}', conversation_id='{conversation_id}'")
    response = await ai_orchestrator.process_query(query, context)
    ai_message = response.get("message", "Response processed.")

    if conversation_id:
        current_history = chat_history_cache.get(conversation_id, [])
        current_history.append({"role": "user", "content": query})
        current_history.append({"role": "assistant", "content": ai_message})
        chat_history_cache[conversation_id] = current_history
        print(f"💾 CACHE UPDATED for conversation {conversation_id}. History now has {len(current_history)} messages.")

    return { "message": ai_message }

@app.get("/api/v1/ai/system/status")
async def get_ai_system_status():
    """Get AI system status and health"""
    status = await ai_orchestrator.get_system_status()
    return { "success": True, "system_status": status, "metadata": create_metadata() }

@app.get("/api/v1/health")
async def health_check():
    """Application health check"""
    return { "status": "healthy", "timestamp": datetime.now().isoformat() }

# ================================
# ENHANCED WEBSOCKET ENDPOINTS
# ================================

@app.websocket("/api/v1/ws/alerts/risk-breaches")
async def risk_alerts_websocket(websocket: WebSocket):
    """Real-time risk threshold breach alerts with robust connection handling"""
    client_host = websocket.client.host if websocket.client else "Unknown"
    client_info = f"{client_host}:{websocket.client.port}" if websocket.client else "Unknown"
    
    try:
        # Accept the connection using enhanced manager
        await manager.connect(websocket, client_info)
        
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "connection_established", 
                "message": "Connected to Gertie.ai real-time risk alerts"
            }), 
            websocket
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (or disconnection)
                data = await websocket.receive_text()
                logger.debug(f"Received message from {client_info}: {data}")
                
                # Echo back or handle client messages as needed
                await manager.send_personal_message(
                    json.dumps({"type": "message_received", "echo": data}), 
                    websocket
                )
                
            except WebSocketDisconnect:
                logger.info(f"Client {client_info} disconnected normally")
                break
            
            except ConnectionClosed:
                logger.info(f"Connection to {client_info} was closed")
                break
                
            except Exception as e:
                logger.error(f"Error handling message from {client_info}: {e}")
                break
    
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint for {client_info}: {e}")
    
    finally:
        # Always clean up the connection
        manager.disconnect(websocket)

# Additional WebSocket endpoints for different data types
@app.websocket("/ws")
async def general_websocket(websocket: WebSocket):
    """General WebSocket endpoint for real-time updates"""
    client_host = websocket.client.host if websocket.client else "Unknown"
    client_info = f"{client_host}:{websocket.client.port}" if websocket.client else "Unknown"
    
    try:
        await manager.connect(websocket, client_info)
        
        await manager.send_personal_message(
            json.dumps({
                "type": "connection_established", 
                "message": "Connected to Gertie.ai real-time updates"
            }), 
            websocket
        )
        
        while True:
            try:
                data = await websocket.receive_text()
                logger.debug(f"Received message from {client_info}: {data}")
                
                await manager.send_personal_message(
                    json.dumps({"type": "message_received", "echo": data}), 
                    websocket
                )
                
            except WebSocketDisconnect:
                logger.info(f"Client {client_info} disconnected normally")
                break
            except ConnectionClosed:
                logger.info(f"Connection to {client_info} was closed")
                break
            except Exception as e:
                logger.error(f"Error handling message from {client_info}: {e}")
                break
    
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint for {client_info}: {e}")
    
    finally:
        manager.disconnect(websocket)

# ================================
# ENHANCED BACKGROUND TASKS
# ================================

async def broadcast_alerts():
    """Enhanced alert broadcaster with robust error handling"""
    while True:
        try:
            await asyncio.sleep(10)
            
            if not manager.active_connections:
                logger.debug("No active connections for alert broadcast")
                continue

            alert_data = {
                "id": f"alert_{uuid4().hex[:6]}",
                "timestamp": datetime.now().isoformat(),
                "portfolio_id": "port_123",
                "title": "REAL-TIME: Portfolio VaR Breach",
                "description": "Live data shows VaR has exceeded the configured threshold.",
                "severity": "critical",
                "current_value": 26500 + (hash(datetime.now().isoformat()) % 1000),
                "threshold_value": 25000,
            }
            
            logger.info(f"Broadcasting alert to {len(manager.active_connections)} clients...")
            await manager.broadcast_json(alert_data)
            
        except Exception as e:
            logger.error(f"Error in alert broadcaster: {e}")
            await asyncio.sleep(10)  # Continue even if there's an error

async def send_portfolio_updates():
    """Send periodic portfolio updates to connected clients"""
    while True:
        try:
            await asyncio.sleep(30)  # Every 30 seconds
            
            if not manager.active_connections:
                continue
                
            portfolio_update = {
                "type": "portfolio_update",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "total_value": 1250000 + (hash(datetime.now().isoformat()) % 50000),
                    "daily_change": -0.025 + (hash(datetime.now().isoformat()) % 100) / 10000,
                    "positions": [
                        {"symbol": "AAPL", "value": 125000, "change": 0.012},
                        {"symbol": "GOOGL", "value": 98000, "change": -0.008},
                        {"symbol": "MSFT", "value": 156000, "change": 0.015}
                    ]
                }
            }
            
            await manager.broadcast_json(portfolio_update)
            
        except Exception as e:
            logger.error(f"Error in portfolio updates: {e}")
            await asyncio.sleep(30)

# ================================
# API ENDPOINTS FOR WEBSOCKET MANAGEMENT
# ================================

@app.get("/api/v1/connections/status")
async def connection_status():
    """Get current WebSocket connection status"""
    return {
        "active_connections": len(manager.active_connections),
        "status": "healthy",
        "metadata": create_metadata()
    }

@app.post("/api/v1/test/broadcast")
async def test_broadcast(message: dict):
    """Test endpoint to send a broadcast message"""
    try:
        await manager.broadcast_json({
            "type": "test_message",
            "data": message,
            "timestamp": datetime.now().isoformat()
        })
        return {
            "status": "success", 
            "message": f"Broadcast sent to {len(manager.active_connections)} connections",
            "metadata": create_metadata()
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "metadata": create_metadata()}

# ================================
# STARTUP/SHUTDOWN EVENTS
# ================================

@app.on_event("startup")
async def startup_event():
    """Enhanced application startup tasks"""
    print("🚀 Financial Risk Management System starting up...")
    
    # Start background tasks
    asyncio.create_task(broadcast_alerts())
    asyncio.create_task(send_portfolio_updates())
    
    print("📢 Enhanced WebSocket alert broadcaster started.")
    print("📈 Portfolio update broadcaster started.")
    print("✅ System ready with robust WebSocket support!")

@app.on_event("shutdown")
async def shutdown_event():
    """Graceful shutdown with proper WebSocket cleanup"""
    if manager.active_connections:
        disconnect_message = {
            "type": "server_shutdown",
            "message": "Server is shutting down. Please reconnect shortly.",
            "timestamp": datetime.now().isoformat()
        }
        await manager.broadcast_json(disconnect_message)
        
        # Give a moment for the message to be sent
        await asyncio.sleep(0.5)
    
    print("🛑 Financial Risk Management System shutting down gracefully")

# ================================
# MAIN ENTRY POINT
# ================================
if __name__ == "__main__":
    import uvicorn
    print("Starting Financial Risk Management System API Server...")
    print("📚 API Documentation available at: http://localhost:8000/api/docs")
    print("🔄 Health Check available at: http://localhost:8000/api/v1/health")
    print("🔌 WebSocket Status available at: http://localhost:8000/api/v1/connections/status")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
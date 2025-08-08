"""
Main FastAPI application with database initialization
Updated to use persistent SQLite database
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn
import os


# Import database and models
from core.database import initialize_database, close_database, get_database_info, check_database_health

# Import routers
from auth.endpoints import router as auth_router
from portfolio.endpoints import router as portfolio_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# APPLICATION LIFECYCLE
# ================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    logger.info("🚀 Starting Gertie.ai application...")
    
    try:
        # Initialize database
        logger.info("📊 Initializing database...")
        initialize_database()
        
        # Log database info
        db_info = get_database_info()
        logger.info(f"📊 Database initialized: {db_info}")
        
        # Check database health
        health = check_database_health()
        logger.info(f"💚 Database health: {health}")
        
        logger.info("✅ Application startup complete!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down Gertie.ai application...")
    try:
        close_database()
        logger.info("✅ Application shutdown complete!")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")

# ================================
# CREATE FASTAPI APPLICATION
# ================================

app = FastAPI(
    title="Gertie.ai API",
    description="AI-powered investment portfolio management platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ================================
# CORS CONFIGURATION
# ================================

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite development server
        "http://127.0.0.1:5173",
        # Add your production domain here
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
        "X-CSRF-Token"
    ],
    expose_headers=["*"]
)

# ================================
# GLOBAL EXCEPTION HANDLERS
# ================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else None
        }
    )

# ================================
# INCLUDE ROUTERS
# ================================

# Authentication routes
app.include_router(auth_router)

# Portfolio routes
app.include_router(portfolio_router)

# ================================
# ROOT ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Gertie.ai API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Application health check"""
    try:
        # Check database health
        db_health = check_database_health()
        
        return {
            "status": "healthy",
            "service": "gertie-ai-api",
            "version": "1.0.0",
            "database": db_health,
            "components": {
                "authentication": "operational",
                "database": "operational" if db_health["status"] == "healthy" else "degraded"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/api/v1/info")
async def api_info():
    """API information and available endpoints"""
    try:
        db_info = get_database_info()
        
        return {
            "api_version": "v1",
            "service": "gertie-ai",
            "database": db_info,
            "endpoints": {
                "authentication": "/api/v1/auth",
                "portfolios": "/api/v1/portfolios",
                "health": "/health",
                "docs": "/docs"
            },
            "features": {
                "multi_agent_ai": "enabled",
                "real_time_data": "enabled",
                "portfolio_management": "enabled",
                "authentication": "enabled"
            }
        }
    except Exception as e:
        logger.error(f"API info error: {e}")
        return {
            "error": "Failed to get API information",
            "detail": str(e)
        }

# ================================
# DEBUG ENDPOINTS (Development Only)
# ================================

if os.getenv("ENVIRONMENT", "development") == "development":
    
    @app.get("/debug/database")
    async def debug_database():
        """Debug endpoint for database information"""
        try:
            return {
                "database_info": get_database_info(),
                "database_health": check_database_health()
            }
        except Exception as e:
            return {"error": str(e)}
    
    @app.post("/debug/reset-database")
    async def debug_reset_database():
        """Debug endpoint to reset database (DANGER: Deletes all data!)"""
        try:
            from core.database import reset_database
            logger.warning("🚨 RESETTING DATABASE - ALL DATA WILL BE LOST!")
            reset_database()
            return {
                "message": "Database reset successfully",
                "warning": "All data has been deleted!"
            }
        except Exception as e:
            logger.error(f"Database reset failed: {e}")
            return {"error": str(e)}

# ================================
# STARTUP MESSAGE
# ================================

@app.on_event("startup")
async def startup_message():
    """Log startup message"""
    logger.info("🎯 Gertie.ai API is ready!")
    logger.info("📚 API Documentation: http://localhost:8000/docs")
    logger.info("🔍 Alternative Docs: http://localhost:8000/redoc")
    logger.info("🏥 Health Check: http://localhost:8000/health")

# ================================
# RUN APPLICATION
# ================================

if __name__ == "__main__":
    # Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    
    logger.info(f"🚀 Starting server on {HOST}:{PORT}")
    
    # Run with uvicorn
    uvicorn.run(
    "core.main:app",  # CORRECT - this looks for core/main.py
    host=HOST,
    port=PORT,
    reload=DEBUG,
    log_level="info" if DEBUG else "warning",
    access_log=DEBUG
)
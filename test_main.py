
"""Test FastAPI app with authentication"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import authentication router
from auth.endpoints import auth_router

# Create test app
app = FastAPI(title="Test Gertie.ai API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Test Gertie.ai API with Authentication"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

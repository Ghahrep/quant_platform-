"""
Authentication endpoints with database persistence
Updated to use SQLAlchemy instead of in-memory storage
"""

from datetime import datetime, timedelta
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging

# Import database and models
from core.database import get_db
from models.user import (
    User, UserCreate, UserLogin, UserResponse, UserUpdate,
    Token, TokenData, LoginResponse, RegisterResponse, AuthError,
    get_user_by_email, get_user_by_id, get_user_by_username, create_user_in_db, 
    update_user_login_time, user_exists, verify_user_password,
    convert_user_to_response, get_database_users_info
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# SECURITY CONFIGURATION
# ================================

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security scheme
security = HTTPBearer()

# Create router
router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

# ================================
# UTILITY FUNCTIONS
# ================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        exp: datetime = datetime.fromtimestamp(payload.get("exp", 0))
        
        if email is None or user_id is None:
            return None
            
        token_data = TokenData(email=email, user_id=user_id, exp=exp)
        return token_data
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None

# ================================
# DEPENDENCY FUNCTIONS
# ================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    This is the function that was failing before!
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        logger.info(f"Validating token: {token[:20]}...")
        
        # Verify and decode token
        token_data = verify_token(token)
        if token_data is None:
            logger.error("Token verification failed")
            raise credentials_exception
        
        logger.info(f"Token valid for user: {token_data.email}")
        
        # Get user from database using the email from token
        user = get_user_by_email(db, token_data.email)
        if user is None:
            logger.error(f"User not found in database: {token_data.email}")
            raise credentials_exception
        
        logger.info(f"User found in database: {user.email}")
        return user
        
    except JWTError as e:
        logger.error(f"JWT error in get_current_user: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {e}")
        raise credentials_exception

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@router.post("/register", response_model=RegisterResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user already exists
        if user_exists(db, user_data.email, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create user in database
        db_user = create_user_in_db(db, user_data, hashed_password)
        
        # Convert to response format
        user_response = convert_user_to_response(db_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email, "user_id": db_user.id},
            expires_delta=access_token_expires
        )
        
        # Create token response
        token = Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
        logger.info(f"User registered successfully: {db_user.email}")
        
        return RegisterResponse(
            message="User registered successfully",
            user=user_response,
            token=token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=LoginResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    try:
        # Verify user credentials
        user = verify_user_password(db, login_data.email, login_data.password, pwd_context)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )
        
        # Update last login time
        update_user_login_time(db, user.id)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        # Convert user to response format
        user_response = convert_user_to_response(user)
        
        # Create token response
        token = Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return LoginResponse(
            message="Login successful",
            token=token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

# ================================
# USER PROFILE ENDPOINTS
# ================================

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return convert_user_to_response(current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Check if email/username already exists (if being updated)
        if update_data.email and update_data.email != current_user.email:
            if get_user_by_email(db, update_data.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
        
        if update_data.username and update_data.username != current_user.username:
            if get_user_by_username(db, update_data.username):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already in use"
                )
        
        # Update user
        from models.user import update_user_in_db
        updated_user = update_user_in_db(db, current_user.id, update_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
        
        logger.info(f"User profile updated: {updated_user.email}")
        return convert_user_to_response(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )

# ================================
# DEBUG ENDPOINTS (for troubleshooting)
# ================================

@router.get("/debug-database-info")
async def debug_database_info(db: Session = Depends(get_db)):
    """Debug endpoint to check database state"""
    try:
        info = get_database_users_info(db)
        return {
            "database_info": info,
            "message": "Database connection successful"
        }
    except Exception as e:
        logger.error(f"Database debug error: {e}")
        return {
            "error": str(e),
            "message": "Database connection failed"
        }

@router.get("/debug-token")
async def debug_token_validation(current_user: User = Depends(get_current_active_user)):
    """Debug endpoint to test token validation"""
    return {
        "message": "Token validation successful",
        "user": convert_user_to_response(current_user),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/debug-auth-flow")
async def debug_auth_flow(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Debug endpoint to analyze authentication flow step by step"""
    try:
        result = {
            "step_1_token_extraction": "PASS",
            "step_2_token_format": "FAIL",
            "step_3_token_decode": "FAIL",
            "step_4_user_lookup": "FAIL",
            "step_5_user_active": "FAIL"
        }
        
        # Step 1: Token extraction
        token = credentials.credentials
        if not token:
            return {"error": "No token provided", "steps": result}
        
        # Step 2: Token format check
        result["step_2_token_format"] = "PASS"
        
        # Step 3: Token decode
        token_data = verify_token(token)
        if not token_data:
            return {"error": "Token decode failed", "steps": result}
        
        result["step_3_token_decode"] = "PASS"
        result["token_data"] = {
            "email": token_data.email,
            "user_id": token_data.user_id,
            "expires": token_data.exp.isoformat() if token_data.exp else None
        }
        
        # Step 4: User lookup
        user = get_user_by_email(db, token_data.email)
        if not user:
            return {
                "error": f"User not found in database: {token_data.email}",
                "steps": result,
                "debug_info": get_database_users_info(db)
            }
        
        result["step_4_user_lookup"] = "PASS"
        result["user_found"] = {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active
        }
        
        # Step 5: User active check
        if user.is_active:
            result["step_5_user_active"] = "PASS"
        
        return {
            "message": "Authentication flow analysis complete",
            "steps": result,
            "overall_status": "SUCCESS" if all(v == "PASS" for v in result.values()) else "FAILED"
        }
        
    except Exception as e:
        logger.error(f"Debug auth flow error: {e}")
        return {
            "error": str(e),
            "steps": result
        }

@router.post("/debug-create-test-user")
async def debug_create_test_user(db: Session = Depends(get_db)):
    """Debug endpoint to create a test user"""
    try:
        # Check if test user already exists
        existing_user = get_user_by_email(db, "test@gertie.ai")
        if existing_user:
            return {
                "message": "Test user already exists",
                "user": convert_user_to_response(existing_user)
            }
        
        # Create test user
        test_user_data = UserCreate(
            email="test@gertie.ai",
            username="testuser",
            full_name="Test User",
            password="TestPassword123",
            confirm_password="TestPassword123"
        )
        
        hashed_password = pwd_context.hash(test_user_data.password)
        db_user = create_user_in_db(db, test_user_data, hashed_password)
        
        return {
            "message": "Test user created successfully",
            "user": convert_user_to_response(db_user),
            "login_credentials": {
                "email": "test@gertie.ai",
                "password": "TestPassword123"
            }
        }
        
    except Exception as e:
        logger.error(f"Test user creation error: {e}")
        return {"error": str(e)}

# ================================
# HEALTH CHECK ENDPOINT
# ================================

@router.get("/health")
async def auth_health_check(db: Session = Depends(get_db)):
    """Health check for authentication system"""
    try:
        # Test database connection
        user_count = db.query(User).count()
        
        return {
            "status": "healthy",
            "database_connection": "connected",
            "user_count": user_count,
            "jwt_config": {
                "algorithm": ALGORITHM,
                "token_expires_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
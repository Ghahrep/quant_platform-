"""
Authentication API endpoints for user registration, login, and token management
FastAPI routes for handling authentication operations
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import ValidationError

# Import our models and security utilities
from models.user import (
    UserCreate, UserLogin, UserResponse, UserInDB, 
    Token, AuthResponse, LoginResponse, RegisterResponse, AuthError,
    get_user_by_email, get_user_by_username, create_user_in_db, 
    user_exists, validate_user_data, update_user_in_db
)
from auth.security import (
    get_password_hash, verify_password, create_user_tokens,
    verify_token, extract_token_data, refresh_access_token,
    validate_password_strength
)
from config import settings

# Create router for authentication routes
auth_router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

# Security scheme for JWT Bearer tokens
security = HTTPBearer()

# ================================
# DEPENDENCY FUNCTIONS
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    """
    Dependency to get the current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Verify and extract token data
        token_data = extract_token_data(token)
        if token_data is None or token_data.get("email") is None:
            raise credentials_exception
        
        # Get user from database
        user = get_user_by_email(token_data["email"])
        if user is None:
            raise credentials_exception
            
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    """
    Dependency to get current active user (additional check)
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        Current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@auth_router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user account
    
    Args:
        user_data: User registration data
        
    Returns:
        Registration response with user info and optional token
        
    Raises:
        HTTPException: If user already exists or validation fails
    """
    try:
        # Validate and clean user data
        user_dict = validate_user_data(user_data.dict())
        
        # Check if user already exists
        if user_exists(user_dict["email"], user_dict["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Validate password strength
        password_validation = validate_password_strength(user_dict["password"])
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet requirements",
                    "errors": password_validation["errors"]
                }
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_dict["password"])
        
        # Create user in database
        new_user = UserInDB(
            email=user_dict["email"],
            username=user_dict["username"],
            full_name=user_dict.get("full_name"),
            hashed_password=hashed_password,
            is_active=True
        )
        
        created_user = create_user_in_db(new_user)
        
        # Create user response (no sensitive data)
        user_response = UserResponse(
            id=created_user.id,
            email=created_user.email,
            username=created_user.username,
            full_name=created_user.full_name,
            is_active=created_user.is_active,
            created_at=created_user.created_at,
            updated_at=created_user.updated_at,
            last_login=created_user.last_login
        )
        
        # Optionally create token for immediate login after registration
        token_data = create_user_tokens({
            "id": created_user.id,
            "email": created_user.email,
            "username": created_user.username,
            "full_name": created_user.full_name
        })
        
        token = Token(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=user_response
        )
        
        return RegisterResponse(
            message="User registered successfully",
            user=user_response,
            token=token
        )
        
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Validation error", "errors": e.errors()}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@auth_router.post("/login", response_model=LoginResponse)
async def login_user(user_credentials: UserLogin):
    """
    Authenticate user and return access token
    
    Args:
        user_credentials: User login credentials (email and password)
        
    Returns:
        Login response with authentication token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    try:
        # Get user by email
        user = get_user_by_email(user_credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login time
        user.update_login_time()
        update_user_in_db(user.email, {"last_login": user.last_login})
        
        # Create tokens
        token_data = create_user_tokens({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name
        })
        
        # Create user response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login
        )
        
        token = Token(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=user_response
        )
        
        return LoginResponse(
            message="Login successful",
            token=token,
            data={"login_time": user.last_login.isoformat() if user.last_login else None}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@auth_router.post("/login/form")
async def login_form(
    email: str = Form(...),
    password: str = Form(...)
):
    """
    Form-based login endpoint (for form data instead of JSON)
    
    Args:
        email: User email from form
        password: User password from form
        
    Returns:
        Same as regular login endpoint
    """
    user_credentials = UserLogin(email=email, password=password)
    return await login_user(user_credentials)

@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user from dependency
        
    Returns:
        Current user information (no sensitive data)
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login
    )

@auth_router.post("/refresh")
async def refresh_token(refresh_token: str = Form(...)):
    """
    Refresh access token using refresh token
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        New access token
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    try:
        new_access_token = refresh_access_token(refresh_token)
        if not new_access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@auth_router.post("/logout")
async def logout_user(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Logout current user (placeholder - token invalidation would happen client-side)
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Logout confirmation
    """
    # In a real implementation, you might:
    # 1. Add token to a blacklist
    # 2. Store logout time in database
    # 3. Clear any server-side sessions
    
    return {
        "message": "Logout successful",
        "user": current_user.username,
        "logout_time": datetime.utcnow().isoformat()
    }

# ================================
# UTILITY ENDPOINTS
# ================================

@auth_router.get("/validate-token")
async def validate_token_endpoint(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Validate if current token is still valid
    
    Args:
        current_user: Current authenticated user from token
        
    Returns:
        Token validation result
    """
    return {
        "valid": True,
        "user": current_user.username,
        "expires_at": "Token expiry info would be here"
    }

@auth_router.get("/check-email/{email}")
async def check_email_availability(email: str):
    """
    Check if email is available for registration
    
    Args:
        email: Email address to check
        
    Returns:
        Email availability status
    """
    user = get_user_by_email(email)
    return {
        "email": email,
        "available": user is None,
        "message": "Email is available" if user is None else "Email is already registered"
    }

@auth_router.get("/check-username/{username}")
async def check_username_availability(username: str):
    """
    Check if username is available for registration
    
    Args:
        username: Username to check
        
    Returns:
        Username availability status
    """
    user = get_user_by_username(username)
    return {
        "username": username,
        "available": user is None,
        "message": "Username is available" if user is None else "Username is already taken"
    }

# ================================
# ERROR HANDLERS
# ================================

@auth_router.get("/debug/users")
async def debug_users(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Debug endpoint to list all users (development only)
    Remove this in production!
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        List of all users (no sensitive data)
    """
    from models.user import get_all_users, get_user_count
    
    all_users = get_all_users()
    user_list = []
    
    for user in all_users:
        user_list.append({
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None
        })
    
    return {
        "total_users": get_user_count(),
        "users": user_list,
        "current_user": current_user.username
    }
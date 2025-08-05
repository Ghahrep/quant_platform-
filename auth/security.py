"""
Authentication security utilities
Password hashing, JWT token creation and verification
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import settings

# ================================
# PASSWORD HASHING CONFIGURATION
# ================================

# Create password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

# ================================
# JWT TOKEN UTILITIES
# ================================

def create_access_token(
    data: Dict[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token (typically user info)
        expires_delta: Token expiration time (optional)
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add expiration to token data
    to_encode.update({"exp": expire})
    
    # Add issued at time
    to_encode.update({"iat": datetime.utcnow()})
    
    # Add token type
    to_encode.update({"type": "access"})
    
    # Encode the token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token (longer expiration)
    
    Args:
        data: Data to encode in the token
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    # Refresh tokens expire in 7 days
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.utcnow()})
    to_encode.update({"type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # JWT library automatically handles expiration validation
        # If we get here, the token is valid and not expired
        return payload
        
    except JWTError as e:
        # Token is invalid or expired
        return None

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token without verification (for debugging)
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload (unverified)
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": False, "verify_exp": False}
        )
        return payload
    except JWTError:
        return None

def extract_token_data(token: str) -> Optional[Dict[str, Any]]:
    """
    Extract user data from a valid token
    
    Args:
        token: JWT token string
        
    Returns:
        User data from token if valid, None if invalid
    """
    payload = verify_token(token)
    if payload is None:
        return None
    
    return {
        "email": payload.get("sub"),
        "user_id": payload.get("user_id"),
        "username": payload.get("username"),
        "exp": payload.get("exp"),
        "iat": payload.get("iat"),
        "type": payload.get("type", "access")
    }

def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired
    
    Args:
        token: JWT token string
        
    Returns:
        True if expired, False if valid
    """
    try:
        # Try to verify the token - if it works, it's not expired
        payload = verify_token(token)
        return payload is None
    except:
        return True

def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token
    
    Args:
        token: JWT token string
        
    Returns:
        Expiration datetime if valid, None if invalid
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    exp = payload.get("exp")
    if exp is None:
        return None
    
    return datetime.fromtimestamp(exp)

# ================================
# TOKEN GENERATION HELPERS
# ================================

def create_user_tokens(user_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user_data: User information to encode in tokens
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    # Prepare token payload
    token_data = {
        "sub": user_data.get("email"),  # Subject (user identifier)
        "user_id": str(user_data.get("id", "")),
        "username": user_data.get("username"),
        "full_name": user_data.get("full_name"),
    }
    
    # Create tokens
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    }

def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Create a new access token from a valid refresh token
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        New access token if refresh token is valid, None otherwise
    """
    payload = verify_token(refresh_token)
    if payload is None:
        return None
    
    # Check if it's a refresh token
    if payload.get("type") != "refresh":
        return None
    
    # Create new access token with same user data
    user_data = {
        "sub": payload.get("sub"),
        "user_id": payload.get("user_id"),
        "username": payload.get("username"),
        "full_name": payload.get("full_name"),
    }
    
    return create_access_token(user_data)

# ================================
# SECURITY HELPERS
# ================================

def generate_reset_token(email: str) -> str:
    """
    Generate a password reset token
    
    Args:
        email: User email address
        
    Returns:
        Password reset token (expires in 1 hour)
    """
    reset_data = {
        "sub": email,
        "purpose": "password_reset",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    
    return jwt.encode(
        reset_data,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def verify_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token
    
    Args:
        token: Password reset token
        
    Returns:
        Email address if token is valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check purpose
        if payload.get("purpose") != "password_reset":
            return None
        
        return payload.get("sub")
        
    except JWTError:
        return None

def hash_sensitive_data(data: str) -> str:
    """
    Hash sensitive data (like API keys) for storage
    
    Args:
        data: Sensitive data to hash
        
    Returns:
        Hashed data string
    """
    return pwd_context.hash(data)

def verify_sensitive_data(plain_data: str, hashed_data: str) -> bool:
    """
    Verify sensitive data against its hash
    
    Args:
        plain_data: Plain text data
        hashed_data: Hashed data to compare against
        
    Returns:
        True if data matches, False otherwise
    """
    return pwd_context.verify(plain_data, hashed_data)

# ================================
# VALIDATION UTILITIES
# ================================

def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength and return detailed feedback
    
    Args:
        password: Password to validate
        
    Returns:
        Dictionary with validation results and feedback
    """
    result = {
        "is_valid": True,
        "errors": [],
        "strength_score": 0,
        "feedback": []
    }
    
    # Check length
    if len(password) < 8:
        result["is_valid"] = False
        result["errors"].append("Password must be at least 8 characters long")
    elif len(password) >= 12:
        result["strength_score"] += 2
        result["feedback"].append("Good length")
    else:
        result["strength_score"] += 1
    
    # Check for uppercase
    if not any(c.isupper() for c in password):
        result["is_valid"] = False
        result["errors"].append("Password must contain at least one uppercase letter")
    else:
        result["strength_score"] += 1
    
    # Check for lowercase
    if not any(c.islower() for c in password):
        result["is_valid"] = False
        result["errors"].append("Password must contain at least one lowercase letter")
    else:
        result["strength_score"] += 1
    
    # Check for digits
    if not any(c.isdigit() for c in password):
        result["is_valid"] = False
        result["errors"].append("Password must contain at least one digit")
    else:
        result["strength_score"] += 1
    
    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if any(c in special_chars for c in password):
        result["strength_score"] += 2
        result["feedback"].append("Contains special characters")
    
    # Overall strength assessment  
    if result["strength_score"] >= 6:
        result["feedback"].append("Strong password")
    elif result["strength_score"] >= 4:
        result["feedback"].append("Moderate password")
    else:
        result["feedback"].append("Weak password")
    
    return result

# ================================
# DEBUGGING UTILITIES
# ================================

def debug_token(token: str) -> Dict[str, Any]:
    """
    Debug a JWT token (for development only)
    
    Args:
        token: JWT token to debug
        
    Returns:
        Token debugging information
    """
    try:
        # Decode without verification
        payload = decode_token(token)
        
        # Verify token
        verified_payload = verify_token(token)
        
        # Get expiry info
        expiry = get_token_expiry(token)
        is_expired = is_token_expired(token)
        
        return {
            "token_valid": verified_payload is not None,
            "is_expired": is_expired,
            "expiry_time": expiry.isoformat() if expiry else None,
            "payload": payload,
            "verified_payload": verified_payload,
            "token_length": len(token)
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "token_valid": False,
            "token_length": len(token) if token else 0
        }
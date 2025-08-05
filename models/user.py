"""
User data models for authentication and user management
Pydantic models for request/response validation
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID, uuid4

# ================================
# BASE USER MODELS
# ================================

class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    full_name: Optional[str] = Field(None, max_length=100, description="Full name")
    is_active: bool = Field(True, description="User active status")
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v.lower()

class UserCreate(UserBase):
    """User creation model with password"""
    password: str = Field(..., min_length=8, max_length=100, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Validate that passwords match"""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, and one digit')
        
        return v

class UserUpdate(BaseModel):
    """User update model (optional fields)"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")

# ================================
# DATABASE MODELS
# ================================

class User(UserBase):
    """User model with database fields"""
    id: UUID = Field(default_factory=uuid4, description="User ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    
    class Config:
        """Pydantic configuration"""
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }

class UserInDB(User):
    """User model with hashed password (for database storage)"""
    hashed_password: str = Field(..., description="Hashed password")
    
    def verify_password(self, plain_password: str, pwd_context) -> bool:
        """Verify password against hashed password"""
        return pwd_context.verify(plain_password, self.hashed_password)
    
    def update_login_time(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        self.updated_at = datetime.utcnow()

# ================================
# RESPONSE MODELS
# ================================

class UserResponse(User):
    """User response model (no sensitive data)"""
    # Inherits all User fields except password-related ones
    pass

class UserListResponse(BaseModel):
    """Response model for user lists"""
    users: list[UserResponse]
    total: int
    page: int = 1
    per_page: int = 10

# ================================
# TOKEN MODELS
# ================================

class Token(BaseModel):
    """JWT token response model"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: UserResponse = Field(..., description="User information")

class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None
    user_id: Optional[str] = None
    exp: Optional[datetime] = None
    
class RefreshToken(BaseModel):
    """Refresh token model"""
    refresh_token: str = Field(..., description="Refresh token")

# ================================
# AUTHENTICATION RESPONSE MODELS
# ================================

class AuthResponse(BaseModel):
    """Authentication response model"""
    success: bool = True
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")

class LoginResponse(AuthResponse):
    """Login response model"""
    token: Token = Field(..., description="Authentication token")

class RegisterResponse(AuthResponse):
    """Registration response model"""
    user: UserResponse = Field(..., description="Created user")
    token: Optional[Token] = Field(None, description="Authentication token (optional)")

# ================================
# ERROR MODELS
# ================================

class AuthError(BaseModel):
    """Authentication error model"""
    success: bool = False
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")

# ================================
# VALIDATION HELPERS
# ================================

def validate_user_data(user_data: dict) -> dict:
    """Validate and clean user data"""
    # Clean and validate email
    if 'email' in user_data:
        user_data['email'] = user_data['email'].lower().strip()
    
    # Clean and validate username
    if 'username' in user_data:
        user_data['username'] = user_data['username'].lower().strip()
    
    # Clean full name
    if 'full_name' in user_data and user_data['full_name']:
        user_data['full_name'] = user_data['full_name'].strip()
    
    return user_data

# ================================
# MOCK DATA FOR TESTING
# ================================

# In-memory user storage for MVP (replace with database later)
fake_users_db: Dict[str, UserInDB] = {}

def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email from fake database"""
    return fake_users_db.get(email.lower())

def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Get user by username from fake database"""
    for user in fake_users_db.values():
        if user.username == username.lower():
            return user
    return None

def create_user_in_db(user_data: UserInDB) -> UserInDB:
    """Create user in fake database"""
    fake_users_db[user_data.email.lower()] = user_data
    return user_data

def update_user_in_db(email: str, update_data: dict) -> Optional[UserInDB]:
    """Update user in fake database"""
    user = get_user_by_email(email)
    if user:
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        user.updated_at = datetime.utcnow()
        return user
    return None

def delete_user_from_db(email: str) -> bool:
    """Delete user from fake database"""
    if email.lower() in fake_users_db:
        del fake_users_db[email.lower()]
        return True
    return False

# ================================
# HELPER FUNCTIONS
# ================================

def user_exists(email: str, username: str = None) -> bool:
    """Check if user exists by email or username"""
    if get_user_by_email(email):
        return True
    if username and get_user_by_username(username):
        return True
    return False

def get_all_users() -> list[UserInDB]:
    """Get all users from fake database"""
    return list(fake_users_db.values())

def get_user_count() -> int:
    """Get total user count"""
    return len(fake_users_db)

# Example test user for development
def create_test_user():
    """Create a test user for development"""
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    test_user = UserInDB(
        email="test@gertie.ai",
        username="testuser",
        full_name="Test User",
        hashed_password=pwd_context.hash("TestPassword123"),
        is_active=True
    )
    
    return create_user_in_db(test_user)
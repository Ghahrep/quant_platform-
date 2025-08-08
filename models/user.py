"""
User data models for authentication and user management
SQLAlchemy models for database persistence + Pydantic models for API validation
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID, uuid4
import uuid

# Import database components
from core.database import Base

# ================================
# SQLALCHEMY DATABASE MODELS
# ================================

class User(Base):
    """SQLAlchemy User model for database storage"""
    __tablename__ = "users"
    
    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid4()), index=True)
    
    # User identification
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # User information
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    portfolio_positions = relationship("PortfolioPosition", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
    
    def to_dict(self) -> dict:
        """Convert SQLAlchemy model to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login
        }

# ================================
# PYDANTIC API MODELS (keep existing)
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

class UserResponse(BaseModel):
    """User response model (no sensitive data)"""
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class UserListResponse(BaseModel):
    """Response model for user lists"""
    users: List[UserResponse]
    total: int
    page: int = 1
    per_page: int = 10

# ================================
# TOKEN MODELS (keep existing)
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
# AUTHENTICATION RESPONSE MODELS (keep existing)
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

class AuthError(BaseModel):
    """Authentication error model"""
    success: bool = False
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")

# ================================
# DATABASE CRUD OPERATIONS
# ================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email from database"""
    return db.query(User).filter(User.email == email.lower()).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username from database"""
    return db.query(User).filter(User.username == username.lower()).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID from database"""
    return db.query(User).filter(User.id == user_id).first()

def create_user_in_db(db: Session, user_data: UserCreate, hashed_password: str) -> User:
    """Create user in database"""
    db_user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_in_db(db: Session, user_id: str, update_data: UserUpdate) -> Optional[User]:
    """Update user in database"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if field in ['email', 'username'] and value:
            value = value.lower()
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_login_time(db: Session, user_id: str) -> Optional[User]:
    """Update user's last login time"""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.last_login = datetime.utcnow()
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user_from_db(db: Session, user_id: str) -> bool:
    """Delete user from database"""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users from database with pagination"""
    return db.query(User).offset(skip).limit(limit).all()

def get_user_count(db: Session) -> int:
    """Get total user count"""
    return db.query(User).count()

def user_exists(db: Session, email: str, username: str = None) -> bool:
    """Check if user exists by email or username"""
    if get_user_by_email(db, email):
        return True
    if username and get_user_by_username(db, username):
        return True
    return False

def verify_user_password(db: Session, email: str, password: str, pwd_context) -> Optional[User]:
    """Verify user password and return user if valid"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    if not pwd_context.verify(password, user.hashed_password):
        return None
    
    return user

# ================================
# HELPER FUNCTIONS
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

def convert_user_to_response(user: User) -> UserResponse:
    """Convert SQLAlchemy User to Pydantic UserResponse"""
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login
    )

# ================================
# DEVELOPMENT/TESTING HELPERS
# ================================

def create_test_user(db: Session, pwd_context) -> User:
    """Create a test user for development"""
    test_user_data = UserCreate(
        email="test@gertie.ai",
        username="testuser",
        full_name="Test User",
        password="TestPassword123",
        confirm_password="TestPassword123"
    )
    
    hashed_password = pwd_context.hash(test_user_data.password)
    return create_user_in_db(db, test_user_data, hashed_password)

def get_database_users_info(db: Session) -> dict:
    """Get information about users in database for debugging"""
    users = get_all_users(db)
    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ]
    }
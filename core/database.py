"""
Database configuration and session management for Gertie.ai
SQLAlchemy setup with SQLite for persistent data storage
"""

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# DATABASE CONFIGURATION
# ================================

# Database URL - SQLite file in the project root
DATABASE_URL = "sqlite:///./gertie.db"

# SQLAlchemy engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,  # Set to True for SQL query logging during development
    pool_pre_ping=True  # Validate connections before use
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for SQLAlchemy models
Base = declarative_base()

# Metadata for table creation
metadata = MetaData()

# ================================
# DATABASE SESSION DEPENDENCY
# ================================

def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI
    
    Usage in endpoints:
    @app.get("/users/me")
    def get_current_user(db: Session = Depends(get_db)):
        # Use db session here
        return db.query(User).filter(User.id == user_id).first()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# ================================
# DATABASE INITIALIZATION
# ================================

def create_tables():
    """
    Create all database tables
    Call this once when setting up the application
    """
    try:
        # Import all models to ensure they're registered with Base
        from models.user import User as SQLUser
        from models.portfolio import PortfolioPosition as SQLPortfolio
        
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Create test user if in development
        if os.getenv("ENVIRONMENT", "development") == "development":
            create_development_test_user()
            
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def drop_tables():
    """
    Drop all database tables (useful for development reset)
    WARNING: This will delete all data!
    """
    logger.warning("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("All tables dropped")

def reset_database():
    """
    Reset database by dropping and recreating all tables
    WARNING: This will delete all data!
    """
    logger.warning("Resetting database...")
    drop_tables()
    create_tables()
    logger.info("Database reset complete")

# ================================
# DEVELOPMENT HELPERS
# ================================

def create_development_test_user():
    """
    Create a test user for development
    Only runs in development environment
    """
    try:
        from models.user import User as SQLUser
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        db = SessionLocal()
        
        # Check if test user already exists
        existing_user = db.query(SQLUser).filter(SQLUser.email == "test@gertie.ai").first()
        if existing_user:
            logger.info("Development test user already exists")
            db.close()
            return
        
        # Create test user
        test_user = SQLUser(
            email="test@gertie.ai",
            username="testuser",
            full_name="Test User",
            hashed_password=pwd_context.hash("TestPassword123"),
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        logger.info(f"Development test user created: {test_user.email}")
        db.close()
        
    except Exception as e:
        logger.error(f"Error creating development test user: {e}")

def get_database_info():
    """
    Get information about the database
    Useful for debugging
    """
    db = SessionLocal()
    try:
        from models.user import User as SQLUser
        from models.portfolio import Portfolio as SQLPortfolio
        
        user_count = db.query(SQLUser).count()
        portfolio_count = db.query(SQLPortfolio).count()
        
        info = {
            "database_url": DATABASE_URL,
            "database_file_exists": os.path.exists("./gertie.db"),
            "user_count": user_count,
            "portfolio_count": portfolio_count,
            "tables": list(Base.metadata.tables.keys())
        }
        
        return info
        
    except Exception as e:
        logger.error(f"Error getting database info: {e}")
        return {"error": str(e)}
    finally:
        db.close()

# ================================
# DATABASE HEALTH CHECK
# ================================

def check_database_health() -> dict:
    """
    Check database connectivity and health
    Returns status information
    """
    try:
        db = SessionLocal()
        
        # Try a simple query
        result = db.execute("SELECT 1").fetchone()
        db.close()
        
        return {
            "status": "healthy",
            "database_file_exists": os.path.exists("./gertie.db"),
            "connection_test": "passed" if result else "failed"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database_file_exists": os.path.exists("./gertie.db")
        }

# ================================
# STARTUP FUNCTION
# ================================

def initialize_database():
    """
    Initialize database on application startup
    Call this in your main.py or app startup
    """
    logger.info("Initializing database...")
    
    # Create tables if they don't exist
    create_tables()
    
    # Log database info
    info = get_database_info()
    logger.info(f"Database initialized: {info}")
    
    return True

# ================================
# TRANSACTION HELPERS
# ================================

def with_transaction(func):
    """
    Decorator for functions that need database transactions
    Automatically handles commit/rollback
    """
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            result = func(db, *args, **kwargs)
            db.commit()
            return result
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction failed: {e}")
            raise
        finally:
            db.close()
    
    return wrapper

# ================================
# CLEANUP
# ================================

def close_database():
    """
    Close database connections
    Call this on application shutdown
    """
    logger.info("Closing database connections...")
    engine.dispose()
    logger.info("Database connections closed")

if __name__ == "__main__":
    # For testing - initialize database
    initialize_database()
    
    # Print database info
    info = get_database_info()
    print("Database Info:", info)
    
    # Check health
    health = check_database_health()
    print("Database Health:", health)
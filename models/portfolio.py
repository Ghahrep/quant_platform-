"""
Portfolio data models for investment management
SQLAlchemy models for database persistence + Pydantic models for API validation
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, validator
import uuid
import json

# Import database components
from core.database import Base

# ================================
# SQLALCHEMY DATABASE MODELS
# ================================

class PortfolioPosition(Base):
    """SQLAlchemy PortfolioPosition model for database storage"""
    __tablename__ = "portfolio_positions"
    
    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Foreign key to users table - THIS IS CRUCIAL!
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Position identification
    symbol = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    
    # Position data
    quantity = Column(Numeric(precision=18, scale=8), nullable=False)
    average_cost = Column(Numeric(precision=18, scale=2), nullable=False)
    current_price = Column(Numeric(precision=18, scale=2), nullable=True)
    
    # Market data
    market_value = Column(Numeric(precision=18, scale=2), nullable=True)
    unrealized_gain_loss = Column(Numeric(precision=18, scale=2), nullable=True)
    unrealized_gain_loss_percent = Column(Numeric(precision=8, scale=4), nullable=True)
    
    # Position metadata
    sector = Column(String, nullable=True)
    asset_class = Column(String, nullable=True)
    exchange = Column(String, nullable=True)
    
    # Additional data (stored as JSON string)
    extra_data = Column(Text, nullable=True)  # JSON string for flexible data
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_price_update = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="portfolio_positions")
    
    def __repr__(self):
        return f"<PortfolioPosition(id={self.id}, user_id={self.user_id}, symbol={self.symbol}, quantity={self.quantity})>"
    
    def to_dict(self) -> dict:
        """Convert SQLAlchemy model to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "symbol": self.symbol,
            "name": self.name,
            "quantity": float(self.quantity) if self.quantity else 0,
            "average_cost": float(self.average_cost) if self.average_cost else 0,
            "current_price": float(self.current_price) if self.current_price else 0,
            "market_value": float(self.market_value) if self.market_value else 0,
            "unrealized_gain_loss": float(self.unrealized_gain_loss) if self.unrealized_gain_loss else 0,
            "unrealized_gain_loss_percent": float(self.unrealized_gain_loss_percent) if self.unrealized_gain_loss_percent else 0,
            "sector": self.sector,
            "asset_class": self.asset_class,
            "exchange": self.exchange,
            "extra_data": json.loads(self.extra_data) if self.extra_data else {},
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_price_update": self.last_price_update
        }
    
    def calculate_market_values(self):
        """Calculate market value and gains/losses"""
        if self.current_price and self.quantity:
            self.market_value = self.current_price * self.quantity
            
            total_cost = self.average_cost * self.quantity
            self.unrealized_gain_loss = self.market_value - total_cost
            
            if total_cost > 0:
                self.unrealized_gain_loss_percent = (self.unrealized_gain_loss / total_cost) * 100
            else:
                self.unrealized_gain_loss_percent = 0
            
            self.last_price_update = datetime.utcnow()

# Update User model to include relationship
# This would be added to the User model in models/user.py
"""
# Add this to the User class in models/user.py:
portfolio_positions = relationship("PortfolioPosition", back_populates="user", cascade="all, delete-orphan")
"""

# ================================
# PYDANTIC API MODELS
# ================================

class PositionBase(BaseModel):
    """Base position model with common fields"""
    symbol: str = Field(..., description="Stock/asset symbol")
    name: Optional[str] = Field(None, description="Asset name")
    quantity: float = Field(..., gt=0, description="Number of shares/units")
    average_cost: float = Field(..., ge=0, description="Average cost per share")
    sector: Optional[str] = Field(None, description="Market sector")
    asset_class: Optional[str] = Field(None, description="Asset class")
    exchange: Optional[str] = Field(None, description="Exchange")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        """Validate stock symbol format"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Symbol cannot be empty')
        return v.upper().strip()
    
    @validator('quantity')
    def validate_quantity(cls, v):
        """Validate quantity is positive"""
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('average_cost')
    def validate_average_cost(cls, v):
        """Validate average cost is non-negative"""
        if v < 0:
            raise ValueError('Average cost cannot be negative')
        return v

class PositionCreate(PositionBase):
    """Position creation model"""
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class PositionUpdate(BaseModel):
    """Position update model (optional fields)"""
    name: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    average_cost: Optional[float] = Field(None, ge=0)
    sector: Optional[str] = None
    asset_class: Optional[str] = None
    exchange: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class TransactionInput(BaseModel):
    symbol: str
    quantity: float
    unit_cost: float
    transaction_date: Optional[datetime] = None
    # Add other fields like 'name', 'sector' if you parse them in the frontend

class PositionResponse(BaseModel):
    """Position response model with all calculated fields"""
    id: str
    user_id: str
    symbol: str
    name: Optional[str]
    quantity: float
    average_cost: float
    current_price: Optional[float]
    market_value: Optional[float]
    unrealized_gain_loss: Optional[float]
    unrealized_gain_loss_percent: Optional[float]
    sector: Optional[str]
    asset_class: Optional[str]
    exchange: Optional[str]
    extra_data: Dict[str, Any]
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    last_price_update: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else None
        }

class PortfolioSummary(BaseModel):
    """Portfolio summary with aggregated data"""
    total_positions: int
    total_market_value: float
    total_cost_basis: float
    total_unrealized_gain_loss: float
    total_unrealized_gain_loss_percent: float
    top_holdings: List[PositionResponse]
    sector_allocation: Dict[str, float]
    asset_class_allocation: Dict[str, float]

class PortfolioResponse(BaseModel):
    """Complete portfolio response"""
    user_id: str
    positions: List[PositionResponse]
    summary: PortfolioSummary
    last_updated: Optional[datetime] = None  # FIXED: Made optional with default None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ================================
# DATABASE CRUD OPERATIONS
# ================================

def get_user_portfolio(db: Session, user_id: str) -> List[PortfolioPosition]:
    """Get all portfolio positions for a user"""
    return db.query(PortfolioPosition).filter(
        PortfolioPosition.user_id == user_id,
        PortfolioPosition.is_active == True
    ).all()

def get_position_by_id(db: Session, position_id: str, user_id: str) -> Optional[PortfolioPosition]:
    """Get specific position by ID for a user"""
    return db.query(PortfolioPosition).filter(
        PortfolioPosition.id == position_id,
        PortfolioPosition.user_id == user_id,
        PortfolioPosition.is_active == True
    ).first()

def get_position_by_symbol(db: Session, symbol: str, user_id: str) -> Optional[PortfolioPosition]:
    """Get position by symbol for a user"""
    return db.query(PortfolioPosition).filter(
        PortfolioPosition.symbol == symbol.upper(),
        PortfolioPosition.user_id == user_id,
        PortfolioPosition.is_active == True
    ).first()

def create_position(db: Session, position_data: PositionCreate, user_id: str) -> PortfolioPosition:
    """Create new portfolio position"""
    db_position = PortfolioPosition(
        user_id=user_id,
        symbol=position_data.symbol.upper(),
        name=position_data.name,
        quantity=Decimal(str(position_data.quantity)),
        average_cost=Decimal(str(position_data.average_cost)),
        sector=position_data.sector,
        asset_class=position_data.asset_class,
        exchange=position_data.exchange,
        extra_data=json.dumps(position_data.extra_data) if position_data.extra_data else None,
        is_active=True
    )
    
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

def update_position(db: Session, position_id: str, user_id: str, update_data: PositionUpdate) -> Optional[PortfolioPosition]:
    """Update existing position"""
    db_position = get_position_by_id(db, position_id, user_id)
    if not db_position:
        return None
    
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if field in ['quantity', 'average_cost'] and value is not None:
            value = Decimal(str(value))
        elif field == 'extra_data' and value is not None:
            value = json.dumps(value)
        elif field == 'symbol' and value is not None:
            value = value.upper()
        
        setattr(db_position, field, value)
    
    db_position.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_position)
    return db_position

def delete_position(db: Session, position_id: str, user_id: str) -> bool:
    """Soft delete position (set is_active to False)"""
    db_position = get_position_by_id(db, position_id, user_id)
    if db_position:
        db_position.is_active = False
        db_position.updated_at = datetime.utcnow()
        db.commit()
        return True
    return False

def update_position_prices(db: Session, price_updates: Dict[str, float]) -> int:
    """Update current prices for multiple positions"""
    updated_count = 0
    
    for symbol, price in price_updates.items():
        positions = db.query(PortfolioPosition).filter(
            PortfolioPosition.symbol == symbol.upper(),
            PortfolioPosition.is_active == True
        ).all()
        
        for position in positions:
            position.current_price = Decimal(str(price))
            position.calculate_market_values()
            updated_count += 1
    
    db.commit()
    return updated_count

def upsert_position_from_transaction(db: Session, user_id: str, transaction_data: Dict[str, Any]) -> PortfolioPosition:
    """
    UPDATED: Updates an existing position or prepares a new one WITHOUT committing.
    The commit will be handled by the calling endpoint.
    """
    symbol = transaction_data['symbol'].upper()
    new_quantity = Decimal(str(transaction_data['quantity']))
    new_cost = Decimal(str(transaction_data.get('unit_cost', 0)))

    existing_position = get_position_by_symbol(db, symbol, user_id)

    if existing_position:
        # Update logic
        old_quantity = existing_position.quantity
        old_avg_cost = existing_position.average_cost
        total_quantity = old_quantity + new_quantity
        
        if total_quantity > 0:
            new_average_cost = ((old_quantity * old_avg_cost) + (new_quantity * new_cost)) / total_quantity
        else:
            new_average_cost = Decimal('0.0')

        existing_position.quantity = total_quantity
        existing_position.average_cost = new_average_cost
        existing_position.updated_at = datetime.utcnow()
        # No db.commit() here
        return existing_position
    else:
        # Create logic
        position_create_data = PositionCreate(
            symbol=symbol,
            quantity=float(new_quantity),
            average_cost=float(new_cost)
        )
        # create_position also commits, so we'll replicate its logic without the commit
        db_position = PortfolioPosition(
            user_id=user_id,
            symbol=position_create_data.symbol,
            quantity=Decimal(str(position_create_data.quantity)),
            average_cost=Decimal(str(position_create_data.average_cost))
        )
        db.add(db_position)
        # No db.commit() here
        return db_position

def calculate_portfolio_summary(db: Session, user_id: str) -> PortfolioSummary:
    """Calculate portfolio summary statistics"""
    positions = get_user_portfolio(db, user_id)
    position_responses = [convert_position_to_response(pos) for pos in positions]
    
    if not positions:
        return PortfolioSummary(
            total_positions=0,
            total_market_value=0.0,
            total_cost_basis=0.0,
            total_unrealized_gain_loss=0.0,
            total_unrealized_gain_loss_percent=0.0,
            top_holdings=[],
            sector_allocation={},
            asset_class_allocation={}
        )
    
    # Calculate totals
    total_market_value = sum(float(pos.market_value or 0) for pos in positions)
    total_cost_basis = sum(float(pos.average_cost * pos.quantity) for pos in positions)
    total_unrealized_gain_loss = total_market_value - total_cost_basis
    total_unrealized_gain_loss_percent = (
        (total_unrealized_gain_loss / total_cost_basis * 100) if total_cost_basis > 0 else 0
    )
    
    # Top holdings (by market value)
    top_holdings = sorted(
        position_responses,
        key=lambda x: x.market_value or 0,
        reverse=True
    )[:5]
    
    # Sector allocation
    sector_allocation = {}
    asset_class_allocation = {}
    
    for pos in positions:
        if pos.sector and pos.market_value:
            sector_allocation[pos.sector] = sector_allocation.get(pos.sector, 0) + float(pos.market_value)
        
        if pos.asset_class and pos.market_value:
            asset_class_allocation[pos.asset_class] = asset_class_allocation.get(pos.asset_class, 0) + float(pos.market_value)
    
    # Convert to percentages
    if total_market_value > 0:
        sector_allocation = {k: (v / total_market_value * 100) for k, v in sector_allocation.items()}
        asset_class_allocation = {k: (v / total_market_value * 100) for k, v in asset_class_allocation.items()}
    
    return PortfolioSummary(
        total_positions=len(positions),
        total_market_value=total_market_value,
        total_cost_basis=total_cost_basis,
        total_unrealized_gain_loss=total_unrealized_gain_loss,
        total_unrealized_gain_loss_percent=total_unrealized_gain_loss_percent,
        top_holdings=top_holdings,
        sector_allocation=sector_allocation,
        asset_class_allocation=asset_class_allocation
    )

# ================================
# HELPER FUNCTIONS
# ================================

def convert_position_to_response(position: PortfolioPosition) -> PositionResponse:
    """Convert SQLAlchemy Position to Pydantic PositionResponse"""
    return PositionResponse(
        id=position.id,
        user_id=position.user_id,
        symbol=position.symbol,
        name=position.name,
        quantity=float(position.quantity),
        average_cost=float(position.average_cost),
        current_price=float(position.current_price) if position.current_price else None,
        market_value=float(position.market_value) if position.market_value else None,
        unrealized_gain_loss=float(position.unrealized_gain_loss) if position.unrealized_gain_loss else None,
        unrealized_gain_loss_percent=float(position.unrealized_gain_loss_percent) if position.unrealized_gain_loss_percent else None,
        sector=position.sector,
        asset_class=position.asset_class,
        exchange=position.exchange,
        extra_data=json.loads(position.extra_data) if position.extra_data else {},
        is_active=position.is_active,
        created_at=position.created_at,
        updated_at=position.updated_at,
        last_price_update=position.last_price_update
    )

def get_portfolio_symbols(db: Session, user_id: str) -> List[str]:
    """Get list of symbols in user's portfolio"""
    positions = db.query(PortfolioPosition).filter(
        PortfolioPosition.user_id == user_id,
        PortfolioPosition.is_active == True
    ).all()
    
    return [pos.symbol for pos in positions]

# ================================
# LEGACY SUPPORT FUNCTIONS
# ================================

def save_user_portfolio(db: Session, user_id: str, portfolio_data: List[Dict]) -> List[PortfolioPosition]:
    """
    Legacy function to save entire portfolio
    Maintains compatibility with existing code
    """
    # Clear existing positions (soft delete)
    existing_positions = get_user_portfolio(db, user_id)
    for pos in existing_positions:
        pos.is_active = False
    
    # Create new positions
    new_positions = []
    for pos_data in portfolio_data:
        position_create = PositionCreate(
            symbol=pos_data['symbol'],
            name=pos_data.get('name'),
            quantity=pos_data['quantity'],
            average_cost=pos_data['average_cost'],
            sector=pos_data.get('sector'),
            asset_class=pos_data.get('asset_class'),
            exchange=pos_data.get('exchange'),
            extra_data=pos_data.get('extra_data')
        )
        
        new_position = create_position(db, position_create, user_id)
        new_positions.append(new_position)
    
    return new_positions

# ================================
# DEVELOPMENT/TESTING HELPERS
# ================================

def create_sample_portfolio(db: Session, user_id: str) -> List[PortfolioPosition]:
    """Create sample portfolio for testing"""
    sample_positions = [
        PositionCreate(
            symbol="AAPL",
            name="Apple Inc.",
            quantity=10.0,
            average_cost=150.00,
            sector="Technology",
            asset_class="Equity"
        ),
        PositionCreate(
            symbol="GOOGL",
            name="Alphabet Inc.",
            quantity=5.0,
            average_cost=2500.00,
            sector="Technology",
            asset_class="Equity"
        ),
        PositionCreate(
            symbol="TSLA",
            name="Tesla Inc.",
            quantity=8.0,
            average_cost=800.00,
            sector="Consumer Discretionary",
            asset_class="Equity"
        )
    ]
    
    created_positions = []
    for pos_data in sample_positions:
        position = create_position(db, pos_data, user_id)
        created_positions.append(position)
    
    return created_positions
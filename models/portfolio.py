"""
Portfolio data models for user portfolio management

Handles portfolio positions, transactions, and aggregated holdings
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from uuid import uuid4
from pydantic import BaseModel, Field, validator
from decimal import Decimal

# ===================================
# PYDANTIC MODELS
# ===================================

class TransactionLot(BaseModel):
    """
    Represents a single transaction/lot in a user's portfolio
    Each purchase of a security creates a new transaction lot
    """
    symbol: str = Field(..., description="Stock ticker symbol (e.g., 'AAPL')")
    quantity: int = Field(..., gt=0, description="Number of shares purchased")
    unit_cost: float = Field(..., gt=0, description="Cost per share at time of purchase")
    transaction_date: Optional[str] = Field(None, description="Date of purchase (YYYY-MM-DD)")
    
    @validator('symbol')
    def symbol_must_be_uppercase(cls, v):
        return v.upper().strip()
    
    @validator('transaction_date')
    def validate_date_format(cls, v):
        if v is None:
            return v
        try:
            # Validate date format
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

class PortfolioPosition(BaseModel):
    """
    Represents an aggregated position in a user's portfolio
    Multiple transaction lots are combined into a single position per symbol
    """
    symbol: str
    total_quantity: int
    weighted_average_cost: float
    total_cost_basis: float
    first_purchase_date: Optional[str] = None
    last_purchase_date: Optional[str] = None

class CSVUploadRequest(BaseModel):
    """
    Request model for CSV upload containing multiple transaction lots
    """
    transactions: List[TransactionLot] = Field(..., description="List of transaction lots from CSV")

class PortfolioUploadResponse(BaseModel):
    """
    Response model for portfolio upload operations
    """
    message: str
    positions_created: int
    positions_updated: int
    total_positions: int
    portfolio_summary: List[PortfolioPosition]

# ===================================
# IN-MEMORY DATABASE
# ===================================

# Temporary storage for user portfolios (replace with real database)
user_portfolios: Dict[str, List[PortfolioPosition]] = {}

# ===================================
# BUSINESS LOGIC FUNCTIONS
# ===================================

def calculate_weighted_average_cost(transactions: List[TransactionLot]) -> tuple[int, float, float]:
    """
    Calculate weighted average cost for a list of transactions of the same symbol
    
    Args:
        transactions: List of transaction lots for the same symbol
        
    Returns:
        tuple: (total_quantity, weighted_average_cost, total_cost_basis)
    """
    if not transactions:
        return 0, 0.0, 0.0
    
    total_quantity = sum(t.quantity for t in transactions)
    total_cost_basis = sum(t.quantity * t.unit_cost for t in transactions)
    weighted_average_cost = total_cost_basis / total_quantity if total_quantity > 0 else 0.0
    
    return total_quantity, weighted_average_cost, total_cost_basis

def aggregate_transactions_by_symbol(transactions: List[TransactionLot]) -> List[PortfolioPosition]:
    """
    Group transactions by symbol and calculate aggregated positions
    
    Args:
        transactions: List of individual transaction lots
        
    Returns:
        List of aggregated portfolio positions
    """
    # Group transactions by symbol
    symbol_groups: Dict[str, List[TransactionLot]] = {}
    
    for transaction in transactions:
        symbol = transaction.symbol.upper()
        if symbol not in symbol_groups:
            symbol_groups[symbol] = []
        symbol_groups[symbol].append(transaction)
    
    # Calculate aggregated positions
    positions = []
    
    for symbol, symbol_transactions in symbol_groups.items():
        total_quantity, weighted_avg_cost, total_cost_basis = calculate_weighted_average_cost(symbol_transactions)
        
        # Find date range
        dated_transactions = [t for t in symbol_transactions if t.transaction_date]
        first_date = None
        last_date = None
        
        if dated_transactions:
            dates = [t.transaction_date for t in dated_transactions]
            first_date = min(dates)
            last_date = max(dates)
        
        position = PortfolioPosition(
            symbol=symbol,
            total_quantity=total_quantity,
            weighted_average_cost=weighted_avg_cost,
            total_cost_basis=total_cost_basis,
            first_purchase_date=first_date,
            last_purchase_date=last_date
        )
        
        positions.append(position)
    
    return sorted(positions, key=lambda x: x.symbol)

def save_user_portfolio(user_email: str, positions: List[PortfolioPosition]) -> dict:
    """
    Save aggregated portfolio positions for a user
    
    Args:
        user_email: User's email address
        positions: List of aggregated portfolio positions
        
    Returns:
        Dictionary with operation results
    """
    # Get existing portfolio or create new one
    existing_positions = user_portfolios.get(user_email, [])
    existing_symbols = {pos.symbol for pos in existing_positions}
    
    positions_created = 0
    positions_updated = 0
    
    # Update existing positions dict for easy lookup
    existing_dict = {pos.symbol: pos for pos in existing_positions}
    
    for new_position in positions:
        if new_position.symbol in existing_symbols:
            # Update existing position by combining with new transactions
            existing_pos = existing_dict[new_position.symbol]
            
            # Combine quantities and recalculate weighted average
            combined_quantity = existing_pos.total_quantity + new_position.total_quantity
            combined_cost_basis = existing_pos.total_cost_basis + new_position.total_cost_basis
            new_weighted_avg = combined_cost_basis / combined_quantity if combined_quantity > 0 else 0.0
            
            # Update the existing position
            existing_pos.total_quantity = combined_quantity
            existing_pos.weighted_average_cost = new_weighted_avg
            existing_pos.total_cost_basis = combined_cost_basis
            
            # Update dates if new ones are earlier/later
            if new_position.first_purchase_date:
                if not existing_pos.first_purchase_date or new_position.first_purchase_date < existing_pos.first_purchase_date:
                    existing_pos.first_purchase_date = new_position.first_purchase_date
            
            if new_position.last_purchase_date:
                if not existing_pos.last_purchase_date or new_position.last_purchase_date > existing_pos.last_purchase_date:
                    existing_pos.last_purchase_date = new_position.last_purchase_date
            
            positions_updated += 1
        else:
            # Add new position
            existing_positions.append(new_position)
            positions_created += 1
    
    # Save updated portfolio
    user_portfolios[user_email] = existing_positions
    
    return {
        "positions_created": positions_created,
        "positions_updated": positions_updated,
        "total_positions": len(existing_positions)
    }

def get_user_portfolio(user_email: str) -> List[PortfolioPosition]:
    """
    Retrieve user's complete portfolio
    
    Args:
        user_email: User's email address
        
    Returns:
        List of user's portfolio positions
    """
    return user_portfolios.get(user_email, [])

def delete_user_position(user_email: str, symbol: str) -> bool:
    """
    Delete a specific position from user's portfolio
    
    Args:
        user_email: User's email address
        symbol: Stock symbol to delete
        
    Returns:
        True if position was deleted, False if not found
    """
    if user_email not in user_portfolios:
        return False
    
    positions = user_portfolios[user_email]
    original_length = len(positions)
    
    # Filter out the position with matching symbol
    user_portfolios[user_email] = [pos for pos in positions if pos.symbol != symbol.upper()]
    
    return len(user_portfolios[user_email]) < original_length
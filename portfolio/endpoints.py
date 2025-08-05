"""
Portfolio management API endpoints

Handles portfolio upload, retrieval, and management operations
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from auth.endpoints import get_current_active_user
from models.user import UserInDB
from models.portfolio import (
    CSVUploadRequest, PortfolioUploadResponse, PortfolioPosition,
    TransactionLot, aggregate_transactions_by_symbol, save_user_portfolio,
    get_user_portfolio, delete_user_position
)

# Create router for portfolio routes
portfolio_router = APIRouter(prefix="/api/v1/portfolios", tags=["portfolio"])

# ===================================
# PORTFOLIO ENDPOINTS
# ===================================

@portfolio_router.post("/upload/csv", response_model=PortfolioUploadResponse)
async def upload_csv_portfolio(
    upload_data: CSVUploadRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Upload portfolio data from CSV parsing
    
    Accepts a list of transaction lots, aggregates them by symbol,
    calculates weighted average costs, and saves to user's portfolio
    
    Args:
        upload_data: Parsed CSV data containing transaction lots
        current_user: Currently authenticated user
        
    Returns:
        Upload results and portfolio summary
    """
    try:
        if not upload_data.transactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data provided"
            )
        
        # Validate transaction data
        for transaction in upload_data.transactions:
            if not transaction.symbol or transaction.quantity <= 0 or transaction.unit_cost <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transaction data for symbol {transaction.symbol}"
                )
        
        # Aggregate transactions by symbol and calculate weighted averages
        aggregated_positions = aggregate_transactions_by_symbol(upload_data.transactions)
        
        # Save to user's portfolio
        save_results = save_user_portfolio(current_user.email, aggregated_positions)
        
        # Get updated portfolio for response
        updated_portfolio = get_user_portfolio(current_user.email)
        
        return PortfolioUploadResponse(
            message=f"Successfully processed {len(upload_data.transactions)} transactions",
            positions_created=save_results["positions_created"],
            positions_updated=save_results["positions_updated"],
            total_positions=save_results["total_positions"],
            portfolio_summary=updated_portfolio
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process portfolio upload: {str(e)}"
        )

@portfolio_router.get("/me", response_model=List[PortfolioPosition])
async def get_my_portfolio(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Get current user's complete portfolio
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        List of user's portfolio positions
    """
    try:
        portfolio = get_user_portfolio(current_user.email)
        return portfolio
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve portfolio: {str(e)}"
        )

@portfolio_router.delete("/positions/{symbol}")
async def delete_position(
    symbol: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a specific position from user's portfolio
    
    Args:
        symbol: Stock symbol to delete
        current_user: Currently authenticated user
        
    Returns:
        Deletion confirmation
    """
    try:
        success = delete_user_position(current_user.email, symbol)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Position {symbol} not found in portfolio"
            )
        
        return {
            "message": f"Position {symbol.upper()} successfully deleted",
            "deleted_symbol": symbol.upper()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete position: {str(e)}"
        )

@portfolio_router.post("/positions", response_model=PortfolioUploadResponse)
async def add_manual_positions(
    transactions: List[TransactionLot],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Add positions manually (for manual entry form)
    
    Args:
        transactions: List of transaction lots to add
        current_user: Currently authenticated user
        
    Returns:
        Addition results and updated portfolio summary
    """
    try:
        if not transactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data provided"
            )
        
        # Use the same logic as CSV upload
        upload_data = CSVUploadRequest(transactions=transactions)
        return await upload_csv_portfolio(upload_data, current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add positions: {str(e)}"
        )

# ===================================
# UTILITY ENDPOINTS
# ===================================

@portfolio_router.get("/debug/all-portfolios")
async def debug_all_portfolios(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Debug endpoint to see all portfolios (development only)
    Remove this in production!
    """
    from models.portfolio import user_portfolios
    
    return {
        "total_users_with_portfolios": len(user_portfolios),
        "portfolios": {
            email: [pos.dict() for pos in positions]
            for email, positions in user_portfolios.items()
        },
        "current_user": current_user.email
    }
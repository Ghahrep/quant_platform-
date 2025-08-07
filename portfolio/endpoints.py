#
# ACTION: Replace the content of portfolio/endpoints.py with this
#

from typing import List, Dict
from fastapi import APIRouter, HTTPException, Depends, status

# Your existing dependencies
from auth.endpoints import get_current_active_user
from models.user import UserInDB
from models.portfolio import (
    CSVUploadRequest, PortfolioUploadResponse, PortfolioPosition,
    TransactionLot, aggregate_transactions_by_symbol, save_user_portfolio,
    get_user_portfolio, delete_user_position
)

# ### NEW IMPORT ###
# Import our market data utility to get live prices
from utils.market_data import get_current_prices

# Create router for portfolio routes
portfolio_router = APIRouter(prefix="/api/v1/portfolios", tags=["portfolio"])


# This endpoint remains unchanged
@portfolio_router.post("/upload/csv", response_model=PortfolioUploadResponse)
async def upload_csv_portfolio(
    upload_data: CSVUploadRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Upload portfolio data from CSV parsing. This action MERGES with the existing portfolio.
    """
    # ... (Your existing, correct code for this function remains the same)
    try:
        if not upload_data.transactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data provided"
            )
        
        aggregated_positions = aggregate_transactions_by_symbol(upload_data.transactions)
        save_results = save_user_portfolio(current_user.email, aggregated_positions)
        updated_portfolio = get_user_portfolio(current_user.email)
        
        return PortfolioUploadResponse(
            message=f"Successfully processed {len(upload_data.transactions)} transactions",
            positions_created=save_results["positions_created"],
            positions_updated=save_results["positions_updated"],
            total_positions=save_results["total_positions"],
            portfolio_summary=updated_portfolio
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process portfolio upload: {str(e)}"
        )

# This endpoint remains unchanged
@portfolio_router.post("/positions", response_model=PortfolioUploadResponse)
async def add_manual_positions(
    upload_data: CSVUploadRequest, 
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Add positions manually. This action MERGES them with the user's existing portfolio.
    """
    return await upload_csv_portfolio(upload_data, current_user)


### --- REFACTORED GET PORTFOLIO ENDPOINT --- ###
@portfolio_router.get("/me", response_model=List[Dict])
async def get_my_portfolio(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Get current user's complete portfolio, enriched with real-time market data.
    """
    try:
        # 1. Fetch the user's saved positions from the database
        positions = get_user_portfolio(current_user.email)
        if not positions:
            return []

        # 2. Get a list of all unique symbols in the portfolio
        symbols = list(set([pos.symbol for pos in positions]))
        
        if not symbols:
            return []
            
        # 3. Call our utility to get live prices for all symbols at once
        live_prices = get_current_prices(symbols)
        
        # 4. Loop through saved positions and enrich them with the live data
        enriched_positions = []
        for pos in positions:
            pos_dict = pos.model_dump() if hasattr(pos, 'model_dump') else pos.dict()
            
            current_price = live_prices.get(pos.symbol)
            
            # Calculate new fields if we got a live price
            if current_price:
                market_value = pos.total_quantity * current_price
                unrealized_pnl = market_value - pos.total_cost_basis
                
                pos_dict['current_price'] = round(current_price, 2)
                pos_dict['market_value'] = round(market_value, 2)
                pos_dict['unrealized_pnl'] = round(unrealized_pnl, 2)
            else:
                # If we couldn't fetch a live price, fill with default values
                pos_dict['current_price'] = None
                pos_dict['market_value'] = pos.total_cost_basis # Fallback to cost basis
                pos_dict['unrealized_pnl'] = 0.0

            enriched_positions.append(pos_dict)
            
        return enriched_positions

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve portfolio: {str(e)}"
        )


# This endpoint remains unchanged
@portfolio_router.delete("/positions/{symbol}")
async def delete_position(
    symbol: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a specific position from user's portfolio
    """
    # ... (Your existing, correct code for this function remains the same)
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete position: {str(e)}"
        )
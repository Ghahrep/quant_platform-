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

@portfolio_router.post("/upload/csv", response_model=PortfolioUploadResponse)
async def upload_csv_portfolio(
    upload_data: CSVUploadRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Upload portfolio data from CSV parsing. This action MERGES with the existing portfolio.
    """
    try:
        if not upload_data.transactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data provided"
            )
        
        # Aggregate the new transactions
        aggregated_positions = aggregate_transactions_by_symbol(upload_data.transactions)
        
        # Save to user's portfolio (your save function already handles merging)
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process portfolio upload: {str(e)}"
        )

# --- CORRECTED ENDPOINT FOR MANUAL ENTRY ---
@portfolio_router.post("/positions", response_model=PortfolioUploadResponse)
async def add_manual_positions(
    # This now correctly expects an object with a "transactions" key
    upload_data: CSVUploadRequest, 
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Add positions manually. This action MERGES them with the user's existing portfolio.
    """
    # We can now directly reuse the same robust logic as the CSV upload endpoint.
    return await upload_csv_portfolio(upload_data, current_user)


@portfolio_router.get("/me", response_model=List[PortfolioPosition])
async def get_my_portfolio(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Get current user's complete portfolio
    """
    try:
        return get_user_portfolio(current_user.email)
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete position: {str(e)}"
        )
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..core.auth import get_current_user, AuthenticatedUser
from ..models.warranty import WarrantyCreate, WarrantyResponse
from ..services.db_service import db_service

router = APIRouter(prefix="/warranties", tags=["Warranties"])

@router.get("", response_model=List[WarrantyResponse])
async def get_warranties(
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieves all warranties with traffic-light status:
    - GREEN: Active (> 30 days remaining)
    - YELLOW: Expiring soon (<= 30 days remaining)
    - RED: Expired
    """
    warranties = await db_service.get_warranties(user.user_id)
    return warranties

@router.post("", response_model=WarrantyResponse, status_code=status.HTTP_201_CREATED)
async def create_warranty(
    warranty_data: WarrantyCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Allows manual warranty entry or linking to an existing purchase receipt."""
    created = await db_service.create_warranty(user.user_id, warranty_data)
    return created

@router.delete("/{warranty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warranty(
    warranty_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Deletes a warranty entry."""
    success = await db_service.delete_warranty(user.user_id, warranty_id)
    if not success:
        raise HTTPException(status_code=404, detail="Warranty not found")
    return None

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date
from enum import Enum

class WarrantyStatus(str, Enum):
    ACTIVE = "ACTIVE"          # Green: > 30 days remaining
    EXPIRING_SOON = "EXPIRING_SOON"  # Yellow: <= 30 days remaining
    EXPIRED = "EXPIRED"        # Red: Expired

class WarrantyBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    purchase_date: date
    warranty_duration: Optional[str] = None  # e.g., "1 Year", "24 Months"
    expiry_date: date
    serial_number: Optional[str] = None
    notes: Optional[str] = None

class WarrantyCreate(WarrantyBase):
    receipt_id: Optional[str] = None

class WarrantyResponse(WarrantyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    receipt_id: Optional[str] = None
    status: WarrantyStatus = WarrantyStatus.ACTIVE
    days_remaining: int = 0
    created_at: Optional[str] = None

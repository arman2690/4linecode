from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID

class ReceiptItemBase(BaseModel):
    product_name: str
    quantity: float = Field(default=1.0, ge=0)
    unit_price: float = Field(default=0.0, ge=0)
    total_price: float = Field(default=0.0, ge=0)
    category: str = "Other"

class ReceiptItemCreate(ReceiptItemBase):
    pass

class ReceiptItemResponse(ReceiptItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    receipt_id: Optional[str] = None

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, time
from enum import Enum
from .item import ReceiptItemBase, ReceiptItemResponse

class DocumentStatus(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"

class ReceiptBase(BaseModel):
    merchant_name: str
    merchant_address: Optional[str] = None
    merchant_phone: Optional[str] = None
    invoice_number: Optional[str] = None
    receipt_number: Optional[str] = None
    purchase_date: date
    purchase_time: Optional[time] = None
    currency: str = "INR"
    
    # Financial breakdown
    subtotal: float = Field(default=0.0, ge=0)
    discount: float = Field(default=0.0, ge=0)
    tax: float = Field(default=0.0, ge=0)
    cgst: float = Field(default=0.0, ge=0)
    sgst: float = Field(default=0.0, ge=0)
    igst: float = Field(default=0.0, ge=0)
    additional_charges: float = Field(default=0.0, ge=0)
    delivery_fees: float = Field(default=0.0, ge=0)
    grand_total: float = Field(default=0.0, ge=0)
    payment_method: Optional[str] = None
    document_type: str = "receipt"
    
    # Warranties & policies detected
    warranty_duration: Optional[str] = None
    return_policy: Optional[str] = None
    serial_number: Optional[str] = None
    important_notes: Optional[str] = None

class ReceiptCreate(ReceiptBase):
    items: List[ReceiptItemBase] = []
    original_file_path: Optional[str] = None
    extraction_confidence: float = 1.0
    document_status: DocumentStatus = DocumentStatus.GREEN
    document_status_reason: Optional[str] = None

class ReceiptUpdate(BaseModel):
    merchant_name: Optional[str] = None
    merchant_address: Optional[str] = None
    merchant_phone: Optional[str] = None
    invoice_number: Optional[str] = None
    receipt_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_time: Optional[time] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    additional_charges: Optional[float] = None
    delivery_fees: Optional[float] = None
    grand_total: Optional[float] = None
    payment_method: Optional[str] = None
    document_type: Optional[str] = None
    items: Optional[List[ReceiptItemBase]] = None

class ReceiptResponse(ReceiptBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    original_file_path: Optional[str] = None
    extraction_confidence: float = 1.0
    document_status: DocumentStatus = DocumentStatus.GREEN
    document_status_reason: Optional[str] = None
    items: List[ReceiptItemResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ExtractionResult(BaseModel):
    extracted_data: ReceiptCreate
    document_status: DocumentStatus
    document_status_reason: str
    confidence_score: float
    missing_fields: List[str] = []
    inconsistencies: List[str] = []
    suggested_actions: List[str] = []

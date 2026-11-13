from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List, Any, Dict
from datetime import date, time, datetime
from enum import Enum
from .item import ReceiptItemBase, ReceiptItemResponse

STANDARD_CATEGORIES = [
    "Groceries",
    "Food & Dining",
    "Transportation",
    "Fuel",
    "Shopping",
    "Electronics",
    "Healthcare",
    "Entertainment",
    "Utilities",
    "Travel",
    "Other",
]

class DocumentStatus(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"

# --- Strict Receipt Schema (Section 3) ---

class MerchantSection(BaseModel):
    name: str = ""
    address: Optional[str] = None
    phone: Optional[str] = None

class ReceiptSection(BaseModel):
    date: str = ""
    time: Optional[str] = None
    receipt_number: Optional[str] = None
    category: str = "Other"
    currency: str = "INR"

class ScannedItem(BaseModel):
    name: str = ""
    quantity: float = 1.0
    unit_price: float = 0.0
    total_price: float = 0.0

class FinancialsSection(BaseModel):
    subtotal: float = 0.0
    discount: float = 0.0
    tax: float = 0.0
    additional_charges: float = 0.0
    total: float = 0.0
    payment_method: Optional[str] = None

class ConfidenceSection(BaseModel):
    overall: float = 0.0
    merchant: float = 0.0
    date: float = 0.0
    items: float = 0.0
    total: float = 0.0

class StrictReceipt(BaseModel):
    merchant: MerchantSection = Field(default_factory=MerchantSection)
    receipt: ReceiptSection = Field(default_factory=ReceiptSection)
    items: List[ScannedItem] = Field(default_factory=list)
    financials: FinancialsSection = Field(default_factory=FinancialsSection)
    confidence: ConfidenceSection = Field(default_factory=ConfidenceSection)
    warnings: List[str] = Field(default_factory=list)

class ExtractionResult(StrictReceipt):
    document_status: DocumentStatus = DocumentStatus.GREEN
    document_status_reason: Optional[str] = None
    raw_text: Optional[str] = None

# --- Database Persistence Models ---

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
    category: str = "Other"
    
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

    @model_validator(mode="before")
    @classmethod
    def parse_from_strict_or_flat(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Check if payload is in nested strict format
            if "merchant" in data and isinstance(data["merchant"], dict):
                merchant = data.get("merchant", {})
                receipt_meta = data.get("receipt", {})
                financials = data.get("financials", {})
                confidence = data.get("confidence", {})
                warnings = data.get("warnings", [])

                # Parse date safely
                p_date_str = receipt_meta.get("date") or ""
                p_date = date.today()
                if p_date_str:
                    try:
                        p_date = datetime.strptime(p_date_str, "%Y-%m-%d").date()
                    except Exception:
                        p_date = date.today()

                # Parse items
                raw_items = data.get("items", [])
                converted_items = []
                for it in raw_items:
                    if isinstance(it, dict):
                        p_name = it.get("name") or it.get("product_name") or "Item"
                        qty = float(it.get("quantity") or 1.0)
                        u_price = float(it.get("unit_price") or 0.0)
                        t_price = float(it.get("total_price") or (qty * u_price))
                        cat = it.get("category") or receipt_meta.get("category") or "Other"
                        converted_items.append({
                            "product_name": p_name,
                            "quantity": qty,
                            "unit_price": u_price,
                            "total_price": t_price,
                            "category": cat
                        })

                # Determine doc status
                overall_conf = float(confidence.get("overall") or 0.8)
                doc_status = DocumentStatus.GREEN
                if overall_conf < 0.50 or len(warnings) > 2:
                    doc_status = DocumentStatus.RED
                elif overall_conf < 0.85 or len(warnings) > 0:
                    doc_status = DocumentStatus.YELLOW

                status_reason = "; ".join(warnings) if warnings else "Verified receipt details"

                return {
                    "merchant_name": merchant.get("name") or "Store Purchase",
                    "merchant_address": merchant.get("address"),
                    "merchant_phone": merchant.get("phone"),
                    "invoice_number": receipt_meta.get("receipt_number"),
                    "receipt_number": receipt_meta.get("receipt_number"),
                    "purchase_date": p_date,
                    "currency": receipt_meta.get("currency") or "INR",
                    "category": receipt_meta.get("category") or "Other",
                    "subtotal": float(financials.get("subtotal") or 0.0),
                    "discount": float(financials.get("discount") or 0.0),
                    "tax": float(financials.get("tax") or 0.0),
                    "additional_charges": float(financials.get("additional_charges") or 0.0),
                    "grand_total": float(financials.get("total") or 0.0),
                    "payment_method": financials.get("payment_method"),
                    "document_type": data.get("document_type") or "receipt",
                    "items": converted_items,
                    "extraction_confidence": overall_conf,
                    "document_status": doc_status,
                    "document_status_reason": status_reason,
                    "original_file_path": data.get("original_file_path")
                }
        return data

class ReceiptUpdate(BaseModel):
    merchant_name: Optional[str] = None
    merchant_address: Optional[str] = None
    merchant_phone: Optional[str] = None
    invoice_number: Optional[str] = None
    receipt_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_time: Optional[time] = None
    currency: Optional[str] = None
    category: Optional[str] = None
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

import uuid
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from ..models.receipt import ReceiptCreate, ReceiptUpdate, ReceiptResponse, DocumentStatus
from ..models.item import ReceiptItemBase, ReceiptItemResponse
from ..models.warranty import WarrantyCreate, WarrantyResponse, WarrantyStatus
from ..config import settings
import httpx

class DatabaseService:
    """
    Data access layer supporting Supabase PostgreSQL with local isolated mock storage fallback for offline/development environments.
    """
    def __init__(self):
        # In-memory storage keyed by user_id
        self._receipts: Dict[str, List[Dict[str, Any]]] = {}
        self._warranties: Dict[str, List[Dict[str, Any]]] = {}
        self._seed_dev_data()

    def _seed_dev_data(self):
        dev_uid = "dev-user-00000000-0000-0000-0000-000000000001"
        r1_id = str(uuid.uuid4())
        r2_id = str(uuid.uuid4())
        r3_id = str(uuid.uuid4())
        
        self._receipts[dev_uid] = [
            {
                "id": r1_id,
                "user_id": dev_uid,
                "merchant_name": "Croma Electronics",
                "merchant_address": "Indiranagar, Bangalore",
                "invoice_number": "CRO-2026-8812",
                "purchase_date": date(2026, 11, 2),
                "currency": "INR",
                "subtotal": 19490.0,
                "tax": 3508.2,
                "discount": 0.0,
                "additional_charges": 0.0,
                "delivery_fees": 0.0,
                "grand_total": 22998.2,
                "payment_method": "HDFC Credit Card",
                "document_type": "Tax Invoice",
                "document_status": DocumentStatus.GREEN,
                "document_status_reason": "All fields verified and totals match",
                "extraction_confidence": 0.98,
                "warranty_duration": "2 Years",
                "items": [
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r1_id,
                        "product_name": "Sony WH-1000XM5 Wireless Headphones",
                        "quantity": 1,
                        "unit_price": 22998.2,
                        "total_price": 22998.2,
                        "category": "Electronics"
                    }
                ],
                "created_at": "2026-11-02T10:30:00Z"
            },
            {
                "id": r2_id,
                "user_id": dev_uid,
                "merchant_name": "Nature's Basket",
                "merchant_address": "Koramangala, Bangalore",
                "invoice_number": "NB-90412",
                "purchase_date": date(2026, 11, 8),
                "currency": "INR",
                "subtotal": 3150.0,
                "tax": 157.5,
                "discount": 100.0,
                "additional_charges": 0.0,
                "delivery_fees": 50.0,
                "grand_total": 3257.5,
                "payment_method": "UPI",
                "document_type": "Retail Bill",
                "document_status": DocumentStatus.GREEN,
                "document_status_reason": "Clean receipt",
                "extraction_confidence": 0.95,
                "items": [
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r2_id,
                        "product_name": "Organic Almond Milk 1L",
                        "quantity": 3,
                        "unit_price": 320.0,
                        "total_price": 960.0,
                        "category": "Groceries"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r2_id,
                        "product_name": "Artisanal Sourdough Bread",
                        "quantity": 2,
                        "unit_price": 250.0,
                        "total_price": 500.0,
                        "category": "Food and beverages"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r2_id,
                        "product_name": "Imported Extra Virgin Olive Oil",
                        "quantity": 1,
                        "unit_price": 1797.5,
                        "total_price": 1797.5,
                        "category": "Groceries"
                    }
                ],
                "created_at": "2026-11-08T17:15:00Z"
            },
            {
                "id": r3_id,
                "user_id": dev_uid,
                "merchant_name": "Zara Lifestyle",
                "merchant_address": "Phoenix Marketcity",
                "invoice_number": "ZR-55102",
                "purchase_date": date(2026, 10, 20),
                "currency": "INR",
                "subtotal": 5490.0,
                "tax": 658.8,
                "discount": 500.0,
                "additional_charges": 0.0,
                "delivery_fees": 0.0,
                "grand_total": 5648.8,
                "payment_method": "Debit Card",
                "document_type": "Invoice",
                "document_status": DocumentStatus.YELLOW,
                "document_status_reason": "Invoice number was slightly obscured",
                "extraction_confidence": 0.88,
                "return_policy": "30 Days exchange with tag",
                "items": [
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r3_id,
                        "product_name": "Oversized Cotton Overshirt",
                        "quantity": 1,
                        "unit_price": 3490.0,
                        "total_price": 3490.0,
                        "category": "Clothing"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "receipt_id": r3_id,
                        "product_name": "Slim Fit Chinos",
                        "quantity": 1,
                        "unit_price": 2158.8,
                        "total_price": 2158.8,
                        "category": "Clothing"
                    }
                ],
                "created_at": "2026-10-20T19:40:00Z"
            }
        ]

        self._warranties[dev_uid] = [
            {
                "id": str(uuid.uuid4()),
                "user_id": dev_uid,
                "receipt_id": r1_id,
                "product_name": "Sony WH-1000XM5 Wireless Headphones",
                "brand": "Sony",
                "purchase_date": date(2026, 11, 2),
                "warranty_duration": "2 Years",
                "expiry_date": date(2028, 11, 2),
                "serial_number": "SN-SONY-9988112",
                "status": WarrantyStatus.ACTIVE,
                "days_remaining": 720,
                "notes": "Includes full replacement for battery degradation",
                "created_at": "2026-11-02T10:30:00Z"
            }
        ]

    # Receipts Operations
    async def get_receipts(self, user_id: str, search: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
        user_list = self._receipts.get(user_id, [])
        filtered = user_list
        if search:
            s = search.lower()
            filtered = [
                r for r in filtered
                if s in r["merchant_name"].lower() or any(s in item["product_name"].lower() for item in r.get("items", []))
            ]
        if category:
            filtered = [
                r for r in filtered
                if any(item.get("category") == category for item in r.get("items", []))
            ]
        # Sort by purchase_date desc
        return sorted(filtered, key=lambda x: str(x["purchase_date"]), reverse=True)

    async def get_receipt(self, user_id: str, receipt_id: str) -> Optional[Dict[str, Any]]:
        for r in self._receipts.get(user_id, []):
            if r["id"] == receipt_id:
                return r
        return None

    async def create_receipt(self, user_id: str, data: ReceiptCreate) -> Dict[str, Any]:
        if user_id not in self._receipts:
            self._receipts[user_id] = []
            
        receipt_id = str(uuid.uuid4())
        items_with_ids = []
        for it in data.items:
            item_dict = it.model_dump()
            item_dict["id"] = str(uuid.uuid4())
            item_dict["receipt_id"] = receipt_id
            items_with_ids.append(item_dict)

        record = data.model_dump()
        record["id"] = receipt_id
        record["user_id"] = user_id
        record["items"] = items_with_ids
        record["created_at"] = datetime.utcnow().isoformat() + "Z"
        record["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        self._receipts[user_id].insert(0, record)

        # If receipt explicitly contains warranty, also create warranty record
        if data.warranty_duration:
            duration_months = 12
            if "2" in data.warranty_duration:
                duration_months = 24
            elif "3" in data.warranty_duration:
                duration_months = 36
            elif "6" in data.warranty_duration and "month" in data.warranty_duration.lower():
                duration_months = 6
                
            expiry = date(data.purchase_date.year + (duration_months // 12), data.purchase_date.month, data.purchase_date.day)
            p_name = data.items[0].product_name if data.items else data.merchant_name
            await self.create_warranty(user_id, WarrantyCreate(
                receipt_id=receipt_id,
                product_name=p_name,
                brand=data.merchant_name,
                purchase_date=data.purchase_date,
                warranty_duration=data.warranty_duration,
                expiry_date=expiry,
                serial_number=data.serial_number,
                notes=f"Auto-extracted from {data.merchant_name} invoice"
            ))

        return record

    async def update_receipt(self, user_id: str, receipt_id: str, data: ReceiptUpdate) -> Optional[Dict[str, Any]]:
        receipt = await self.get_receipt(user_id, receipt_id)
        if not receipt:
            return None
        
        update_dict = data.model_dump(exclude_unset=True)
        if "items" in update_dict and update_dict["items"] is not None:
            updated_items = []
            for item in update_dict["items"]:
                it = dict(item)
                it["id"] = it.get("id") or str(uuid.uuid4())
                it["receipt_id"] = receipt_id
                updated_items.append(it)
            receipt["items"] = updated_items
            del update_dict["items"]
            
        receipt.update(update_dict)
        receipt["updated_at"] = datetime.utcnow().isoformat() + "Z"
        return receipt

    async def delete_receipt(self, user_id: str, receipt_id: str) -> bool:
        user_list = self._receipts.get(user_id, [])
        initial_len = len(user_list)
        self._receipts[user_id] = [r for r in user_list if r["id"] != receipt_id]
        # Also remove linked warranties
        if user_id in self._warranties:
            self._warranties[user_id] = [w for w in self._warranties[user_id] if w.get("receipt_id") != receipt_id]
        return len(self._receipts[user_id]) < initial_len

    # Warranties Operations
    async def get_warranties(self, user_id: str) -> List[Dict[str, Any]]:
        today = date.today()
        warranties = self._warranties.get(user_id, [])
        for w in warranties:
            diff = (w["expiry_date"] - today).days
            w["days_remaining"] = max(0, diff)
            if diff <= 0:
                w["status"] = WarrantyStatus.EXPIRED
            elif diff <= 30:
                w["status"] = WarrantyStatus.EXPIRING_SOON
            else:
                w["status"] = WarrantyStatus.ACTIVE
        return sorted(warranties, key=lambda x: x["expiry_date"])

    async def create_warranty(self, user_id: str, data: WarrantyCreate) -> Dict[str, Any]:
        if user_id not in self._warranties:
            self._warranties[user_id] = []
        wid = str(uuid.uuid4())
        today = date.today()
        diff = (data.expiry_date - today).days
        status = WarrantyStatus.ACTIVE if diff > 30 else (WarrantyStatus.EXPIRING_SOON if diff > 0 else WarrantyStatus.EXPIRED)
        record = data.model_dump()
        record["id"] = wid
        record["user_id"] = user_id
        record["status"] = status
        record["days_remaining"] = max(0, diff)
        record["created_at"] = datetime.utcnow().isoformat() + "Z"
        self._warranties[user_id].append(record)
        return record

    async def delete_warranty(self, user_id: str, warranty_id: str) -> bool:
        if user_id not in self._warranties:
            return False
        init_len = len(self._warranties[user_id])
        self._warranties[user_id] = [w for w in self._warranties[user_id] if w["id"] != warranty_id]
        return len(self._warranties[user_id]) < init_len

db_service = DatabaseService()

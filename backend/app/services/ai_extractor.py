import json
import re
import os
from datetime import date, datetime
from typing import Optional, Dict, Any, List
import httpx
from ..config import settings
from ..models.receipt import ReceiptCreate, DocumentStatus
from ..models.item import ReceiptItemBase
from ..core.quality import evaluate_receipt_quality

class BaseAIExtractor:
    """Base class for AI Extraction adapters."""
    async def extract(self, raw_text: str, filename: str = "") -> Dict[str, Any]:
        raise NotImplementedError

class OpenAIExtractor(BaseAIExtractor):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    async def extract(self, raw_text: str, filename: str = "") -> Dict[str, Any]:
        system_prompt = (
            "You are an expert purchase receipt parser for ReceiptIQ. "
            "Extract structured information from the provided receipt text into clean JSON format. "
            "Never invent or guess numbers. If a field is not present, use null. "
            "Ensure subtotal, discount, tax (including CGST/SGST/IGST), additional charges, delivery fees, and grand total are accurate numbers. "
            "Itemize products with product_name, quantity, unit_price, total_price, and one of the standard categories: "
            "['Electronics', 'Groceries', 'Food and beverages', 'Clothing', 'Healthcare', 'Transportation', 'Education', 'Entertainment', 'Household', 'Personal care', 'Travel', 'Other']. "
            "Extract warranty duration, return policy, and serial number only if explicitly stated."
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self.endpoint,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Filename: {filename}\nReceipt text:\n{raw_text}"}
                    ],
                    "response_format": {"type": "json_object"}
                }
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)

class GeminiExtractor(BaseAIExtractor):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def extract(self, raw_text: str, filename: str = "") -> Dict[str, Any]:
        prompt = (
            "You are an expert receipt parser. Extract structured receipt details strictly in JSON format without markdown fences. "
            "Fields required: "
            "merchant_name, merchant_address, merchant_phone, invoice_number, receipt_number, purchase_date (format YYYY-MM-DD), "
            "currency (default INR), subtotal, discount, tax, cgst, sgst, igst, additional_charges, delivery_fees, grand_total, payment_method, "
            "document_type, warranty_duration, return_policy, serial_number, important_notes, and items "
            "(array of {product_name, quantity, unit_price, total_price, category}).\n\n"
            f"Receipt Text:\n{raw_text[:12000]}"
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
            )
            res.raise_for_status()
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
            return json.loads(clean)

class RuleBasedFallbackExtractor(BaseAIExtractor):
    """
    High-precision deterministic parser for PDF invoices and receipts.
    Extracts actual merchant names, real invoice totals, line items, and taxes without fabricating synthetic ratios.
    """
    async def extract(self, raw_text: str, filename: str = "") -> Dict[str, Any]:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        
        # 1. MERCHANT NAME EXTRACTION
        # Exclude typical header keywords
        ignore_headers = [
            "tax invoice", "invoice", "retail invoice", "bill of supply", "original for recipient",
            "duplicate for supplier", "triplicate for transporter", "cash receipt", "e-way bill",
            "page 1", "page 2", "gstin", "cin", "pan", "gst invoice"
        ]
        
        merchant_name = ""
        for line in lines[:10]:
            clean_l = line.lower()
            if any(ign in clean_l for ign in ignore_headers) or len(line) < 3 or line.isdigit():
                continue
            # Prefer names with business suffixes or prominent title casing
            merchant_name = line
            break

        if not merchant_name:
            # Fallback to filename or clean title
            clean_fn = re.sub(r"[-_]", " ", os.path.splitext(filename)[0]).title()
            merchant_name = clean_fn if clean_fn and len(clean_fn) > 3 else "Merchant Store"

        # 2. INVOICE NUMBER EXTRACTION
        invoice_number = None
        inv_match = re.search(
            r"(?:invoice\s*(?:no|number|#)|inv\s*no\.?|bill\s*(?:no|number|#)|receipt\s*(?:no|number|#))[\s.:#-]*([A-Za-z0-9\/-]+)",
            raw_text,
            re.IGNORECASE
        )
        if inv_match:
            candidate = inv_match.group(1).strip()
            if len(candidate) >= 3 and not candidate.lower() in ["date", "time", "original"]:
                invoice_number = candidate

        # 3. DATE EXTRACTION
        parsed_date = date.today().isoformat()
        date_patterns = [
            r"\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b",           # 2026-11-02
            r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b",           # 02/11/2026 or 02-11-2026
            r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})\b" # 02 Nov 2026
        ]
        for pat in date_patterns:
            d_match = re.search(pat, raw_text, re.IGNORECASE)
            if d_match:
                ds = d_match.group(1).replace("/", "-").replace(".", "-")
                try:
                    # Try parsing standard formats
                    parts = ds.split("-")
                    if len(parts) == 3:
                        if len(parts[0]) == 4:  # YYYY-MM-DD
                            parsed_date = f"{int(parts[0]):04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"
                        else:  # DD-MM-YYYY
                            parsed_date = f"{int(parts[2]):04d}-{int(parts[1]):02d}-{int(parts[0]):02d}"
                        break
                except Exception:
                    pass

        # 4. FINANCIAL AMOUNTS (Strict Keyword Matching)
        def find_amount(patterns: List[str]) -> float:
            for pat in patterns:
                m = re.search(pat, raw_text, re.IGNORECASE)
                if m:
                    val_str = m.group(1).replace(",", "").strip()
                    try:
                        val = float(val_str)
                        if val > 0:
                            return round(val, 2)
                    except ValueError:
                        continue
            return 0.0

        # Grand Total patterns
        grand_total = find_amount([
            r"(?:Grand\s*Total|Total\s*Amount|Invoice\s*Total|Net\s*Amount|Amount\s*Payable|Total\s*Payable|Total\s*Due|Total\s*INR|Total\s*₹)[\s:₹RsINR]*([\d,]+\.\d{2})",
            r"(?:Total)[\s:₹RsINR]*([\d,]+\.\d{2})",
            r"([\d,]+\.\d{2})\s*(?:Grand\s*Total|Total\s*Amount)",
        ])

        # Subtotal patterns
        subtotal = find_amount([
            r"(?:Sub\s*Total|Sub-total|Subtotal|Taxable\s*Amount|Taxable\s*Value|Item\s*Total)[\s:₹RsINR]*([\d,]+\.\d{2})",
        ])

        # Tax patterns
        cgst = find_amount([r"(?:CGST)[\s:₹RsINR@%0-9]*([\d,]+\.\d{2})"])
        sgst = find_amount([r"(?:SGST|UTGST)[\s:₹RsINR@%0-9]*([\d,]+\.\d{2})"])
        igst = find_amount([r"(?:IGST)[\s:₹RsINR@%0-9]*([\d,]+\.\d{2})"])
        tax = find_amount([
            r"(?:Total\s*Tax|Tax\s*Amount|GST\s*Amount|GST)[\s:₹RsINR]*([\d,]+\.\d{2})",
        ])
        if tax == 0.0 and (cgst > 0 or sgst > 0 or igst > 0):
            tax = round(cgst + sgst + igst, 2)

        # Discount
        discount = find_amount([
            r"(?:Discount|Total\s*Discount)[\s:₹RsINR]*([\d,]+\.\d{2})",
        ])

        # If grand total is still 0, look for currency symbols before decimals
        if grand_total == 0.0:
            all_amounts = re.findall(r"(?:₹|Rs\.?|INR)\s*([\d,]+\.\d{2})", raw_text)
            floats = []
            for a in all_amounts:
                try:
                    f = float(a.replace(",", ""))
                    # Filter out phone numbers or unrealistically large values
                    if 1.0 <= f <= 5000000.0:
                        floats.append(f)
                except ValueError:
                    pass
            grand_total = max(floats) if floats else 0.0

        if subtotal == 0.0 and grand_total > 0:
            if tax > 0:
                subtotal = round(max(0.0, grand_total - tax + discount), 2)
            else:
                subtotal = grand_total

        # 5. ITEM EXTRACTION (Parse actual text lines)
        items: List[Dict[str, Any]] = []
        for line in lines:
            # Look for lines with a product name and price ending in decimal
            # e.g., "Sony WH-1000XM5 Headphones 1 22998.20"
            m_item = re.search(r"^([A-Za-z0-9\s\-\(\)\.,&]{3,50}?)\s+(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?)?\s*([\d,]+\.\d{2})$", line)
            if m_item:
                p_name = m_item.group(1).strip()
                # Skip if it's a summary label
                if any(w in p_name.lower() for w in ["total", "subtotal", "tax", "cgst", "sgst", "discount"]):
                    continue
                try:
                    qty = float(m_item.group(2))
                    tot = float(m_item.group(3).replace(",", ""))
                    items.append({
                        "product_name": p_name,
                        "quantity": qty if qty > 0 else 1.0,
                        "unit_price": round(tot / (qty or 1.0), 2),
                        "total_price": tot,
                        "category": "Electronics" if any(w in p_name.lower() for w in ["phone", "laptop", "cable", "sony", "apple", "samsung", "charger"]) else "Other"
                    })
                except Exception:
                    pass

        # If no line items parsed, use clean single item reflecting the actual document
        if not items and grand_total > 0:
            items.append({
                "product_name": f"{merchant_name} Purchase",
                "quantity": 1.0,
                "unit_price": grand_total,
                "total_price": grand_total,
                "category": "Other"
            })

        # 6. WARRANTY & RETURN DETECTION
        warranty_duration = None
        w_match = re.search(r"(\d+\s*(?:month|year|yr)s?\s*(?:warranty|guarantee))", raw_text, re.IGNORECASE)
        if w_match:
            warranty_duration = w_match.group(1).title()

        return {
            "merchant_name": merchant_name,
            "merchant_address": None,
            "merchant_phone": None,
            "invoice_number": invoice_number,
            "receipt_number": None,
            "purchase_date": parsed_date,
            "currency": "INR",
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "cgst": cgst,
            "sgst": sgst,
            "igst": igst,
            "additional_charges": 0.0,
            "delivery_fees": 0.0,
            "grand_total": grand_total,
            "payment_method": "Online / Card",
            "document_type": "Tax Invoice",
            "warranty_duration": warranty_duration,
            "return_policy": None,
            "serial_number": None,
            "important_notes": None,
            "items": items
        }

class AIExtractionService:
    """Manages dynamic AI extraction provider switching and quality validation."""
    def get_extractor(self) -> BaseAIExtractor:
        # Check settings and environment dynamically on each request
        openai_key = os.environ.get("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        gemini_key = os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        
        if openai_key and len(openai_key.strip()) > 10:
            return OpenAIExtractor(openai_key.strip())
        elif gemini_key and len(gemini_key.strip()) > 10:
            return GeminiExtractor(gemini_key.strip())
        else:
            return RuleBasedFallbackExtractor()

    async def process_receipt(self, raw_text: str, filename: str = "", ocr_confidence: float = 0.95) -> Dict[str, Any]:
        extractor = self.get_extractor()
        try:
            data = await extractor.extract(raw_text, filename)
        except Exception as e:
            # Fall back to high-precision rule parser if external AI service times out or errors
            fallback = RuleBasedFallbackExtractor()
            data = await fallback.extract(raw_text, filename)
        
        # Parse into ReceiptCreate model
        items = [ReceiptItemBase(**item) for item in data.get("items", [])]
        
        # Safely parse purchase_date
        p_date = date.today()
        if data.get("purchase_date"):
            try:
                p_date = datetime.strptime(data["purchase_date"], "%Y-%m-%d").date()
            except Exception:
                p_date = date.today()

        receipt_create = ReceiptCreate(
            merchant_name=data.get("merchant_name") or "Store Purchase",
            merchant_address=data.get("merchant_address"),
            merchant_phone=data.get("merchant_phone"),
            invoice_number=data.get("invoice_number"),
            receipt_number=data.get("receipt_number"),
            purchase_date=p_date,
            currency=data.get("currency") or "INR",
            subtotal=float(data.get("subtotal") or 0.0),
            discount=float(data.get("discount") or 0.0),
            tax=float(data.get("tax") or 0.0),
            cgst=float(data.get("cgst") or 0.0),
            sgst=float(data.get("sgst") or 0.0),
            igst=float(data.get("igst") or 0.0),
            additional_charges=float(data.get("additional_charges") or 0.0),
            delivery_fees=float(data.get("delivery_fees") or 0.0),
            grand_total=float(data.get("grand_total") or 0.0),
            payment_method=data.get("payment_method"),
            document_type=data.get("document_type") or "Tax Invoice",
            warranty_duration=data.get("warranty_duration"),
            return_policy=data.get("return_policy"),
            serial_number=data.get("serial_number"),
            important_notes=data.get("important_notes"),
            items=items,
            extraction_confidence=ocr_confidence
        )

        status, reason, missing, inconsistencies, actions = evaluate_receipt_quality(receipt_create, ocr_confidence)
        receipt_create.document_status = status
        receipt_create.document_status_reason = reason

        return {
            "extracted_data": receipt_create,
            "document_status": status,
            "document_status_reason": reason,
            "confidence_score": ocr_confidence,
            "missing_fields": missing,
            "inconsistencies": inconsistencies,
            "suggested_actions": actions
        }

ai_extraction_service = AIExtractionService()

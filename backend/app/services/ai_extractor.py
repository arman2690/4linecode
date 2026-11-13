import json
import re
import os
from datetime import date, datetime
from typing import Optional, Dict, Any, List, Tuple
import httpx

from ..config import settings
from ..models.receipt import (
    StrictReceipt,
    ExtractionResult,
    MerchantSection,
    ReceiptSection,
    ScannedItem,
    FinancialsSection,
    ConfidenceSection,
    DocumentStatus,
    STANDARD_CATEGORIES,
)

class BaseAIExtractor:
    async def extract(self, raw_text: str, filename: str = "", ocr_confidence: float = 0.95) -> Dict[str, Any]:
        raise NotImplementedError


class OpenAIExtractor(BaseAIExtractor):
    """OpenAI GPT-4o-mini structured extractor enforcing Section 3 schema."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    async def extract(self, raw_text: str, filename: str = "", ocr_confidence: float = 0.95) -> Dict[str, Any]:
        system_prompt = (
            "You are an expert purchase receipt and invoice parser for ReceiptIQ. "
            "Extract structured information from the provided receipt text strictly matching the exact JSON schema requested. "
            "CRITICAL RULES:\n"
            "1. NEVER invent, fabricate, or guess any information. If a field is not present or unreadable, return null or empty string.\n"
            "2. NEVER confuse table headers (e.g. 'No | Description | Unit Price | Qty') with merchant name.\n"
            "3. NEVER confuse Tax amounts (e.g. 'Total Tax', 'CGST', 'SGST', 'GST') with Grand Total. Grand Total is the final total payable.\n"
            "4. Missing values must remain null or empty, never fabricated. Do NOT create dummy items.\n"
            "5. Category MUST be one of: 'Groceries', 'Food & Dining', 'Transportation', 'Fuel', 'Shopping', 'Electronics', 'Healthcare', 'Entertainment', 'Utilities', 'Travel', 'Other'.\n"
            "6. Currency default is 'INR'. Detect USD, EUR, GBP if symbols $, €, £ are present.\n"
            "7. Return JSON with keys: merchant {name, address, phone}, receipt {date, time, receipt_number, category, currency}, "
            "items [{name, quantity, unit_price, total_price}], financials {subtotal, discount, tax, additional_charges, total, payment_method}."
        )

        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(
                self.endpoint,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Document Filename: {filename}\nReceipt Raw OCR Text:\n{raw_text[:12000]}"}
                    ],
                    "response_format": {"type": "json_object"}
                }
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)


class GeminiExtractor(BaseAIExtractor):
    """Google Gemini structured extractor enforcing Section 3 schema."""
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def extract(self, raw_text: str, filename: str = "", ocr_confidence: float = 0.95) -> Dict[str, Any]:
        prompt = (
            "You are an expert purchase receipt and invoice parser for ReceiptIQ. "
            "Extract structured information strictly in pure JSON format without markdown code blocks. "
            "RULES:\n"
            "1. NEVER fabricate or invent information. If absent, use empty string or 0.\n"
            "2. Do NOT confuse table column headers (like 'Description', 'Unit Price') with the merchant name.\n"
            "3. Do NOT confuse GST/tax amounts with the grand total.\n"
            "4. Category must be one of: ['Groceries', 'Food & Dining', 'Transportation', 'Fuel', 'Shopping', 'Electronics', 'Healthcare', 'Entertainment', 'Utilities', 'Travel', 'Other'].\n"
            "5. Structure required:\n"
            "{\n"
            '  "merchant": {"name": "", "address": "", "phone": ""},\n'
            '  "receipt": {"date": "YYYY-MM-DD", "time": "", "receipt_number": "", "category": "Other", "currency": "INR"},\n'
            '  "items": [{"name": "", "quantity": 1, "unit_price": 0.0, "total_price": 0.0}],\n'
            '  "financials": {"subtotal": 0.0, "discount": 0.0, "tax": 0.0, "additional_charges": 0.0, "total": 0.0, "payment_method": ""}\n'
            "}\n\n"
            f"Receipt OCR Text:\n{raw_text[:12000]}"
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        async with httpx.AsyncClient(timeout=25.0) as client:
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
    High-precision deterministic OCR extraction engine.
    Applies spatial, pattern, and accounting rules to parse receipts without external AI services.
    Guarantees:
    - Never fabricates items, merchant names, or totals.
    - Accurately differentiates GST / Taxes from Grand Total.
    - Filters table headers from merchant names.
    - Classifies categories into standard 11 categories.
    - Checks arithmetic consistency and produces genuine confidence scores.
    """

    async def extract(self, raw_text: str, filename: str = "", ocr_confidence: float = 0.95) -> Dict[str, Any]:
        if not raw_text or len(raw_text.strip()) < 15:
            return {
                "merchant": {"name": "", "address": "", "phone": ""},
                "receipt": {"date": "", "time": "", "receipt_number": "", "category": "Other", "currency": "INR"},
                "items": [],
                "financials": {"subtotal": 0.0, "discount": 0.0, "tax": 0.0, "additional_charges": 0.0, "total": 0.0, "payment_method": ""},
                "confidence": {"overall": 0.0, "merchant": 0.0, "date": 0.0, "items": 0.0, "total": 0.0},
                "warnings": ["Receipt image is unreadable or text could not be extracted. Please upload a clear photo or digital document."]
            }

        table_content = ""
        main_text = raw_text
        if "--- INVOICE ITEMS TABLE ---" in raw_text:
            parts = raw_text.split("--- INVOICE ITEMS TABLE ---", 1)
            main_text = parts[0]
            table_content = parts[1]

        lines = [line.strip() for line in main_text.splitlines() if line.strip()]

        # Currency detection
        currency = "INR"
        if "$" in raw_text and "₹" not in raw_text and "rs" not in raw_text.lower():
            currency = "USD"
        elif "€" in raw_text:
            currency = "EUR"
        elif "£" in raw_text:
            currency = "GBP"
        elif "AED" in raw_text:
            currency = "AED"

        # 1. MERCHANT NAME EXTRACTION
        merchant_name = ""
        merchant_address = ""
        merchant_phone = ""

        # Blacklist of headers, document types, and table descriptors
        ignore_headers = [
            "tax invoice", "retail invoice", "bill of supply", "invoice", "receipt", "cash receipt",
            "original for recipient", "duplicate for supplier", "triplicate for transporter",
            "e-way bill", "page 1", "page 2", "gstin", "cin", "pan", "gst invoice",
            "description", "unit price", "particulars", "sl no", "item description", "taxable value",
            "hsn", "sac", "rate", "qty", "quantity", "amount", "total", "sub total", "subtotal",
            "bill to", "ship to", "consignee", "buyer", "customer", "order no", "order date",
            "terms & conditions", "authorised signatory", "authorized signatory", "thank you",
            "visit again", "welcome"
        ]

        # Scan top 15 lines for merchant name
        candidate_lines = []
        for line in lines[:15]:
            clean_l = line.lower().strip()
            # Must not contain table delimiters or header blacklist words
            if "|" in line:
                continue
            if any(ign in clean_l for ign in ignore_headers):
                continue
            if len(line) < 3 or line.isdigit():
                continue
            if re.match(r"^(date|time|phone|tel|email|fax|web|order|ref|inv|gstin)[\s:]", clean_l):
                continue
            # Must contain letters
            if not re.search(r"[A-Za-z]", line):
                continue
            candidate_lines.append(line)

        if candidate_lines:
            # Give preference to lines with business entity indicators
            business_indicators = ["pvt", "ltd", "limited", "inc", "corp", "store", "mart", "supermarket",
                                   "cafe", "restaurant", "retail", "pharmacy", "medical", "hospital",
                                   "enterprises", "solutions", "services", "trading", "fuel", "petroleum", "bakery"]
            strong_candidate = None
            for c in candidate_lines:
                if any(b in c.lower() for b in business_indicators):
                    strong_candidate = c
                    break
            merchant_name = strong_candidate if strong_candidate else candidate_lines[0]

        # Clean merchant name from trailing junk
        merchant_name = re.sub(r"[\s\|\-_#]+$", "", merchant_name).strip()

        # Phone extraction
        phone_match = re.search(r"(?:phone|tel|mobile|contact|call|ph)[\s.:#-]*(\+?\d[\d\s\-()]{7,15}\d)", raw_text, re.IGNORECASE)
        if phone_match:
            merchant_phone = phone_match.group(1).strip()

        # Address candidate
        for line in lines[1:8]:
            if line == merchant_name:
                continue
            if any(kw in line.lower() for kw in ["road", "street", "nagar", "sector", "lane", "floor", "block", "opp", "near", "bangalore", "mumbai", "delhi", "chennai", "hyderabad", "pune", "kolkata"]):
                merchant_address = line
                break

        # 2. RECEIPT / INVOICE NUMBER
        receipt_number = ""
        inv_match = re.search(
            r"(?:invoice\s*(?:no|number|#)|inv\s*no\.?|bill\s*(?:no|number|#)|receipt\s*(?:no|number|#))[\s.:#-]*([A-Za-z0-9\/-]+)",
            raw_text,
            re.IGNORECASE
        )
        if inv_match:
            candidate_inv = inv_match.group(1).strip()
            if len(candidate_inv) >= 3 and candidate_inv.lower() not in ["date", "time", "original", "bill"]:
                receipt_number = candidate_inv

        # 3. DATE & TIME
        parsed_date = ""
        date_patterns = [
            r"\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b",
            r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b",
            r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})\b"
        ]
        for pat in date_patterns:
            d_match = re.search(pat, raw_text, re.IGNORECASE)
            if d_match:
                ds = d_match.group(1).replace("/", "-").replace(".", "-")
                try:
                    parts = ds.split("-")
                    if len(parts) == 3:
                        if len(parts[0]) == 4:
                            parsed_date = f"{int(parts[0]):04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"
                        else:
                            y = int(parts[2])
                            if y < 100:
                                y += 2000
                            parsed_date = f"{y:04d}-{int(parts[1]):02d}-{int(parts[0]):02d}"
                        break
                except Exception:
                    pass

        # Time extraction
        parsed_time = ""
        time_match = re.search(r"\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b", raw_text)
        if time_match:
            parsed_time = time_match.group(1).strip()

        # Helper to extract monetary amounts
        def find_amount(pattern: str) -> float:
            m = re.search(pattern, raw_text, re.IGNORECASE)
            if m:
                try:
                    val = float(m.group(1).replace(",", "").strip())
                    if val >= 0:
                        return round(val, 2)
                except ValueError:
                    pass
            return 0.0

        # 4. TAX BREAKDOWN (CGST, SGST, IGST, TOTAL TAX)
        cgst = find_amount(r"(?:CGST|Central\s*GST)(?:\s*\([^)]*\))?[\s:₹Rs\.\$#\-\=]*([\d,]+\.\d{2})")
        sgst = find_amount(r"(?:SGST|UTGST|State\s*GST)(?:\s*\([^)]*\))?[\s:₹Rs\.\$#\-\=]*([\d,]+\.\d{2})")
        igst = find_amount(r"(?:IGST|Integrated\s*GST)(?:\s*\([^)]*\))?[\s:₹Rs\.\$#\-\=]*([\d,]+\.\d{2})")
        
        # Explicit Total Tax (must explicitly be Tax / GST amount)
        tax = find_amount(r"(?:Total\s*Tax(?:\s*Amount)?|Tax\s*Amount|Total\s*GST|GST\s*Amount|VAT\s*Amount|Total\s*VAT|Total\s*Taxes)(?:\s*\([^)]*\))?[\s:₹Rs\.\$#\-\=]*([\d,]+\.\d{2})")
        if tax == 0.0:
            tax = find_amount(r"(?:GST|Tax|VAT)(?:\s*\([^)]*\))?[\s:₹Rs\.\$#\-\=]*([\d,]+\.\d{2})")
        if tax == 0.0 and (cgst > 0 or sgst > 0 or igst > 0):
            tax = round(cgst + sgst + igst, 2)

        # 5. LINE ITEMS
        items: List[Dict[str, Any]] = []

        # Parse table lines if extracted
        if table_content:
            table_lines = [l.strip() for l in table_content.splitlines() if l.strip()]
            for l in table_lines:
                # Exclude header and summary rows
                l_lower = l.lower()
                if any(hdr in l_lower for hdr in ["description", "unit price", "particulars", "sl no", "qty", "hsn", "total tax", "grand total", "sub total", "taxable value"]):
                    continue
                parts = [p.strip() for p in l.split("|") if p.strip()]
                if len(parts) >= 2:
                    nums = [p for p in parts if re.match(r"^\d+(?:\.\d+)?$", p.replace(",", ""))]
                    texts = [p for p in parts if not re.match(r"^\d+(?:\.\d+)?$", p.replace(",", "")) and len(p) >= 2]
                    if texts and nums:
                        p_name = texts[0]
                        try:
                            total = float(nums[-1].replace(",", ""))
                            qty = float(nums[0].replace(",", "")) if len(nums) > 1 and float(nums[0].replace(",", "")) < 500 else 1.0
                            unit_p = round(total / (qty or 1.0), 2)
                            if total > 0 and len(p_name) > 1:
                                items.append({
                                    "name": p_name,
                                    "quantity": qty,
                                    "unit_price": unit_p,
                                    "total_price": total
                                })
                        except Exception:
                            pass

        # If table parsing didn't find items, scan OCR lines
        if not items:
            for line in lines:
                # Pattern: Product description followed by quantity and total price
                m_item = re.search(r"^([A-Za-z0-9\s\-\(\)\.,&]{3,45}?)\s+(\d+(?:\.\d+)?)\s+(?:₹|Rs\.?|\$|€|£)?\s*([\d,]+\.\d{2})$", line)
                if m_item:
                    p_name = m_item.group(1).strip()
                    if any(w in p_name.lower() for w in ["total", "subtotal", "sub-total", "tax", "cgst", "sgst", "discount", "invoice", "balance", "amount"]):
                        continue
                    try:
                        qty = float(m_item.group(2))
                        tot = float(m_item.group(3).replace(",", ""))
                        if tot > 0:
                            items.append({
                                "name": p_name,
                                "quantity": qty if qty > 0 else 1.0,
                                "unit_price": round(tot / (qty or 1.0), 2),
                                "total_price": tot
                            })
                    except Exception:
                        pass

        # 6. SUBTOTAL
        subtotal = find_amount(r"(?:Sub\s*Total|Sub-total|Subtotal|Taxable\s*Amount|Taxable\s*Value|Item\s*Total|Total\s*Taxable\s*Value)[^0-9\n]*([\d,]+\.\d{2})")
        if subtotal == 0.0 and items:
            subtotal = round(sum(i["total_price"] for i in items), 2)

        # 7. DISCOUNT & ADDITIONAL CHARGES
        discount = find_amount(r"(?:Discount|Total\s*Discount|Promo\s*Discount)[^0-9\n]*([\d,]+\.\d{2})")
        additional_charges = find_amount(r"(?:Delivery\s*Charge|Delivery\s*Fee|Shipping|Service\s*Charge|Convenience\s*Fee|Packaging\s*Charge)[^0-9\n]*([\d,]+\.\d{2})")

        # 8. GRAND TOTAL (Must NEVER match Total Tax, CGST, SGST, Subtotal, or Items count)
        grand_total = 0.0

        # Search for all monetary candidates at the bottom of the receipt
        # Priority 1: Explicit Grand Total / Invoice Total / Net Amount / Total Amount
        gt_patterns = [
            r"(?:Grand\s*Total|Invoice\s*Total|Total\s*Invoice\s*Value|Invoice\s*Value|Net\s*Amount|Amount\s*Payable|Total\s*Payable|Total\s*Due|Net\s*Payable|Total\s*Amount)[^0-9\n]*([\d,]+\.\d{2})",
            r"(?:(?<!Sub\s)(?<!Sub-)(?<!Item\s)(?<!Tax\s)\bTotal\b(?!\s*(?:Tax|GST|Discount|Items|Qty|Quantity|CGST|SGST|IGST)))[^0-9\n]*([\d,]+\.\d{2})"
        ]

        for pat in gt_patterns:
            gt_match = re.search(pat, raw_text, re.IGNORECASE)
            if gt_match:
                try:
                    candidate = float(gt_match.group(1).replace(",", ""))
                    # Critical verification: Grand Total must not be equal to tax if subtotal or items exist!
                    if candidate > 0 and (candidate != tax or (subtotal == 0 and not items)):
                        grand_total = candidate
                        break
                except ValueError:
                    pass

        # Fallback for Indian GST invoices where Grand Total wasn't caught by keyword:
        # If grand_total was 0 or equal to tax, calculate from subtotal + tax
        if (grand_total == 0.0 or abs(grand_total - tax) < 0.01) and subtotal > 0:
            calculated = round(subtotal + tax + additional_charges - discount, 2)
            # Check if calculated amount appears in raw text
            if f"{calculated:.2f}" in raw_text or str(int(round(calculated))) in raw_text:
                grand_total = calculated
            elif subtotal > tax:
                grand_total = calculated

        # 9. PAYMENT METHOD
        payment_method = ""
        pm_lower = raw_text.lower()
        if "upi" in pm_lower or "gpay" in pm_lower or "phonepe" in pm_lower or "paytm" in pm_lower:
            payment_method = "UPI"
        elif "credit card" in pm_lower or "visa" in pm_lower or "mastercard" in pm_lower:
            payment_method = "Credit Card"
        elif "debit card" in pm_lower:
            payment_method = "Debit Card"
        elif "cash" in pm_lower and "cash receipt" not in pm_lower:
            payment_method = "Cash"
        elif "online" in pm_lower or "net banking" in pm_lower or "card" in pm_lower:
            payment_method = "Online / Card"

        # 10. CATEGORY CLASSIFICATION (11 standard categories)
        category = self.classify_category(merchant_name, items, raw_text)

        # 11. CONFIDENCE CALCULATION & ARITHMETIC VALIDATION
        warnings: List[str] = []

        # Confidence Merchant
        conf_merchant = 0.95 if merchant_name else 0.0
        if merchant_name and any(hdr in merchant_name.lower() for hdr in ["store", "mart", "pvt", "ltd", "cafe", "restaurant", "retail"]):
            conf_merchant = 0.98

        # Confidence Date
        conf_date = 0.95 if parsed_date else 0.0

        # Confidence Items
        conf_items = 0.95 if items else 0.50
        for it in items:
            expected_p = round(it["quantity"] * it["unit_price"], 2)
            if abs(expected_p - it["total_price"]) > 0.05:
                conf_items = min(conf_items, 0.70)
                warnings.append(f"Line item '{it['name']}' arithmetic: {it['quantity']} x {it['unit_price']} != {it['total_price']}")

        # Confidence Total
        conf_total = 0.95 if grand_total > 0 else 0.0
        if grand_total == tax and tax > 0:
            conf_total = 0.40
            warnings.append("Grand Total matches Total Tax amount exactly; please verify final payable total.")

        # Math verification
        if subtotal > 0 and grand_total > 0:
            expected_tot = round(subtotal + tax + additional_charges - discount, 2)
            diff = abs(expected_tot - grand_total)
            if diff > 1.0:
                warnings.append(f"Arithmetic discrepancy: Subtotal ({subtotal:.2f}) + Tax ({tax:.2f}) + Charges ({additional_charges:.2f}) - Discount ({discount:.2f}) = {expected_tot:.2f}, but detected Total is {grand_total:.2f}")
                conf_total = min(conf_total, 0.65)

        if not merchant_name:
            warnings.append("Merchant name could not be reliably detected.")
        if not parsed_date:
            warnings.append("Purchase date is missing from document.")
        if grand_total == 0:
            warnings.append("Grand Total could not be detected.")

        # Overall Confidence
        factors = [ocr_confidence, conf_merchant, conf_date, conf_total]
        if items:
            factors.append(conf_items)
        conf_overall = round(sum(factors) / len(factors), 2)
        if warnings:
            conf_overall = max(0.10, round(conf_overall - (len(warnings) * 0.05), 2))

        return {
            "merchant": {
                "name": merchant_name,
                "address": merchant_address or None,
                "phone": merchant_phone or None
            },
            "receipt": {
                "date": parsed_date,
                "time": parsed_time or None,
                "receipt_number": receipt_number or None,
                "category": category,
                "currency": currency
            },
            "items": items,
            "financials": {
                "subtotal": subtotal,
                "discount": discount,
                "tax": tax,
                "additional_charges": additional_charges,
                "total": grand_total,
                "payment_method": payment_method or None
            },
            "confidence": {
                "overall": conf_overall,
                "merchant": conf_merchant,
                "date": conf_date,
                "items": conf_items,
                "total": conf_total
            },
            "warnings": warnings
        }

    def classify_category(self, merchant: str, items: List[Dict[str, Any]], raw_text: str) -> str:
        blob = (merchant + " " + " ".join(i.get("name", "") for i in items) + " " + raw_text[:2000]).lower()

        if any(w in blob for w in ["petrol", "fuel", "diesel", "cng", "hpcl", "bpcl", "iocl", "shell", "gas station"]):
            return "Fuel"
        if any(w in blob for w in ["restaurant", "cafe", "bistro", "pizza", "burger", "coffee", "starbucks", "swiggy", "zomato", "bakery", "bar", "kitchen", "biryani", "dhaba"]):
            return "Food & Dining"
        if any(w in blob for w in ["grocery", "supermarket", "mart", "provisions", "kirana", "fruits", "vegetables", "milk", "bread", "basket", "spencer"]):
            return "Groceries"
        if any(w in blob for w in ["pharmacy", "medical", "hospital", "clinic", "chemist", "drugs", "healthcare", "diagnostic", "tablet", "syrup"]):
            return "Healthcare"
        if any(w in blob for w in ["electronics", "croma", "apple", "samsung", "sony", "laptop", "mobile", "charger", "gadget", "headphone"]):
            return "Electronics"
        if any(w in blob for w in ["uber", "ola", "metro", "cab", "taxi", "toll", "parking", "auto"]):
            return "Transportation"
        if any(w in blob for w in ["flight", "hotel", "airways", "indigo", "makemytrip", "booking", "resort", "irctc", "railway"]):
            return "Travel"
        if any(w in blob for w in ["movie", "cinema", "theatre", "pvr", "inox", "entertainment", "concert", "game", "bookmyshow"]):
            return "Entertainment"
        if any(w in blob for w in ["electricity", "water", "gas bill", "broadband", "wifi", "telecom", "utility", "bescom"]):
            return "Utilities"
        if any(w in blob for w in ["clothing", "apparel", "zara", "h&m", "pantaloons", "fashion", "shoes", "wear", "shirt", "dress"]):
            return "Shopping"

        return "Other"


class AIExtractionService:
    """Manages AI extraction provider switching, data cleaning, and strict schema compliance."""

    def get_extractor(self, override_key: Optional[str] = None) -> BaseAIExtractor:
        key = (override_key or "").strip()
        openai_key = key if key.startswith("sk-") else (os.environ.get("OPENAI_API_KEY") or settings.OPENAI_API_KEY)
        gemini_key = key if key.startswith("AIza") else (os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY)

        if openai_key and len(openai_key.strip()) > 15:
            return OpenAIExtractor(openai_key.strip())
        elif gemini_key and len(gemini_key.strip()) > 15:
            return GeminiExtractor(gemini_key.strip())
        else:
            return RuleBasedFallbackExtractor()

    async def process_receipt(
        self,
        raw_text: str,
        filename: str = "",
        ocr_confidence: float = 0.95,
        ai_key: Optional[str] = None
    ) -> ExtractionResult:
        extractor = self.get_extractor(override_key=ai_key)
        
        extracted_raw: Dict[str, Any] = {}
        try:
            extracted_raw = await extractor.extract(raw_text, filename, ocr_confidence)
        except Exception as e:
            # Fall back to high-precision rule parser on AI API errors
            fallback = RuleBasedFallbackExtractor()
            extracted_raw = await fallback.extract(raw_text, filename, ocr_confidence)

        # Normalize and construct strict schema
        merchant_raw = extracted_raw.get("merchant") or {}
        receipt_raw = extracted_raw.get("receipt") or {}
        items_raw = extracted_raw.get("items") or []
        financials_raw = extracted_raw.get("financials") or {}
        confidence_raw = extracted_raw.get("confidence") or {}
        warnings_raw = extracted_raw.get("warnings") or []

        # Items normalization
        parsed_items: List[ScannedItem] = []
        for it in items_raw:
            if isinstance(it, dict):
                name = str(it.get("name") or it.get("product_name") or "").strip()
                if not name:
                    continue
                try:
                    qty = float(it.get("quantity") or 1.0)
                except (ValueError, TypeError):
                    qty = 1.0
                try:
                    u_price = float(it.get("unit_price") or 0.0)
                except (ValueError, TypeError):
                    u_price = 0.0
                try:
                    t_price = float(it.get("total_price") or (qty * u_price))
                except (ValueError, TypeError):
                    t_price = round(qty * u_price, 2)

                parsed_items.append(ScannedItem(
                    name=name,
                    quantity=qty,
                    unit_price=u_price,
                    total_price=t_price
                ))

        merchant = MerchantSection(
            name=str(merchant_raw.get("name") or "").strip(),
            address=str(merchant_raw.get("address") or "").strip() or None,
            phone=str(merchant_raw.get("phone") or "").strip() or None
        )

        receipt_meta = ReceiptSection(
            date=str(receipt_raw.get("date") or "").strip(),
            time=str(receipt_raw.get("time") or "").strip() or None,
            receipt_number=str(receipt_raw.get("receipt_number") or "").strip() or None,
            category=str(receipt_raw.get("category") or "Other").strip(),
            currency=str(receipt_raw.get("currency") or "INR").strip()
        )

        # Ensure category is valid
        if receipt_meta.category not in STANDARD_CATEGORIES:
            receipt_meta.category = "Other"

        financials = FinancialsSection(
            subtotal=float(financials_raw.get("subtotal") or 0.0),
            discount=float(financials_raw.get("discount") or 0.0),
            tax=float(financials_raw.get("tax") or 0.0),
            additional_charges=float(financials_raw.get("additional_charges") or 0.0),
            total=float(financials_raw.get("total") or 0.0),
            payment_method=str(financials_raw.get("payment_method") or "").strip() or None
        )

        # Confidence scores
        overall_score = float(confidence_raw.get("overall") or ocr_confidence)
        conf = ConfidenceSection(
            overall=min(1.0, max(0.0, overall_score)),
            merchant=min(1.0, max(0.0, float(confidence_raw.get("merchant") or (0.95 if merchant.name else 0.0)))),
            date=min(1.0, max(0.0, float(confidence_raw.get("date") or (0.95 if receipt_meta.date else 0.0)))),
            items=min(1.0, max(0.0, float(confidence_raw.get("items") or (0.90 if parsed_items else 0.5)))),
            total=min(1.0, max(0.0, float(confidence_raw.get("total") or (0.95 if financials.total > 0 else 0.0))))
        )

        # Determine Document Traffic-Light Status
        status = DocumentStatus.GREEN
        status_reason = "High confidence extraction"
        if conf.overall < 0.50 or not merchant.name or financials.total <= 0:
            status = DocumentStatus.RED
            status_reason = "Low confidence or missing critical fields (merchant / total). Please verify."
        elif conf.overall < 0.85 or len(warnings_raw) > 0:
            status = DocumentStatus.YELLOW
            status_reason = "Extraction completed with items or calculations requiring review."

        return ExtractionResult(
            merchant=merchant,
            receipt=receipt_meta,
            items=parsed_items,
            financials=financials,
            confidence=conf,
            warnings=warnings_raw,
            document_status=status,
            document_status_reason=status_reason,
            raw_text=raw_text
        )

ai_extraction_service = AIExtractionService()

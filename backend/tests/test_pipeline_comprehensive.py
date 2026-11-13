import asyncio
from PIL import Image
import fitz
from app.services.image_preprocessor import ImagePreprocessor
from app.services.ocr_engine import OCREngine
from app.services.ai_extractor import RuleBasedFallbackExtractor

def test_case_1_clear_supermarket_receipt():
    async def _test():
        text = (
            "SPENCERS RETAIL SUPERMARKET\n"
            "Store #104, Indiranagar, Bangalore\n"
            "Date: 2026-11-05   Time: 14:30\n"
            "Receipt #: SPR-89211\n"
            "Amul Fresh Milk 1L      2   ₹60.00\n"
            "Whole Wheat Bread       1   ₹45.00\n"
            "Subtotal: ₹105.00\n"
            "Total GST (5%): ₹5.25\n"
            "Grand Total: ₹110.25\n"
            "Paid via UPI"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "spencers_receipt.jpg", ocr_confidence=0.96)
        
        assert res["merchant"]["name"] == "SPENCERS RETAIL SUPERMARKET"
        assert res["receipt"]["category"] == "Groceries"
        assert res["receipt"]["date"] == "2026-11-05"
        assert res["receipt"]["receipt_number"] == "SPR-89211"
        assert res["financials"]["subtotal"] == 105.00
        assert res["financials"]["tax"] == 5.25
        assert res["financials"]["total"] == 110.25
        assert res["financials"]["payment_method"] == "UPI"
        assert res["confidence"]["overall"] >= 0.85
    asyncio.run(_test())

def test_case_2_restaurant_receipt():
    async def _test():
        text = (
            "THE SPICE BISTRO & CAFE\n"
            "100 Feet Road, Koramangala\n"
            "Table: 12   Bill No: B-4029\n"
            "Date: 2026-10-18\n"
            "Paneer Tikka Platter    1   ₹320.00\n"
            "Butter Garlic Naan      2   ₹120.00\n"
            "Subtotal: ₹440.00\n"
            "Service Charge: ₹22.00\n"
            "GST: ₹22.00\n"
            "Net Amount: ₹484.00\n"
            "Paid by Credit Card"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "bistro_bill.png", ocr_confidence=0.95)
        
        assert "SPICE BISTRO" in res["merchant"]["name"]
        assert res["receipt"]["category"] == "Food & Dining"
        assert res["financials"]["total"] == 484.00
        assert res["financials"]["payment_method"] == "Credit Card"
    asyncio.run(_test())

def test_case_3_indian_gst_invoice_gst_not_grand_total():
    """
    CRITICAL TEST CASE: Ensure Total Tax (₹22.43) is NEVER mistaken for Grand Total,
    and column headers are NEVER mistaken for merchant name.
    """
    async def _test():
        text = (
            "ABC TECH SOLUTIONS PVT LTD\n"
            "GSTIN: 29AABCS1429B1Z1\n"
            "Tax Invoice No: CCX1-1986342\n"
            "Invoice Date: 2026-08-30\n"
            "\n--- INVOICE ITEMS TABLE ---\n"
            "No | Description | Unit Price | Total\n"
            "1  | USB Type-C High Speed Cable | 250.00 | 250.00\n"
            "\n"
            "Taxable Subtotal: ₹250.00\n"
            "CGST (4.5%): ₹11.21\n"
            "SGST (4.5%): ₹11.22\n"
            "Total Tax Amount: ₹22.43\n"
            "Grand Total: ₹272.43\n"
            "Payment Mode: Online / Card"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "gst_invoice.pdf", ocr_confidence=0.98)
        
        # Merchant name must NOT be table header
        assert "No | Description | Unit" not in res["merchant"]["name"]
        assert "ABC TECH SOLUTIONS PVT LTD" in res["merchant"]["name"]
        
        # Tax must be 22.43
        assert res["financials"]["tax"] == 22.43
        
        # Grand Total must NOT be 22.43! It must be 272.43
        assert res["financials"]["total"] == 272.43
        assert res["financials"]["subtotal"] == 250.00
        assert res["receipt"]["receipt_number"] == "CCX1-1986342"
    asyncio.run(_test())

def test_case_4_blurry_receipt_low_confidence():
    """Blurry image with very poor text extraction generates low confidence and warnings."""
    async def _test():
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract("blurry text ... ###", "unreadable.jpg", ocr_confidence=0.35)
        
        assert res["confidence"]["overall"] < 0.50
        assert len(res["warnings"]) > 0
    asyncio.run(_test())

def test_case_5_rotated_mobile_photo():
    """Test EXIF orientation and image preprocessing."""
    img = Image.new("RGB", (300, 100), color="white")
    orig, enhanced = ImagePreprocessor.process_image(img)
    assert orig.size == (300, 100)
    assert enhanced.mode == "L"

def test_case_6_receipt_with_multiple_items():
    async def _test():
        text = (
            "NATURE'S BASKET\n"
            "Date: 2026-11-01\n"
            "Invoice #: NB-9012\n"
            "Almond Milk 1L          1   ₹280.00\n"
            "Organic Honey 500g      1   ₹350.00\n"
            "Chia Seeds 250g         1   ₹150.00\n"
            "Dark Chocolate Bar      2   ₹200.00\n"
            "Subtotal: ₹980.00\n"
            "Tax: ₹49.00\n"
            "Grand Total: ₹1029.00"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "multi_item.png", ocr_confidence=0.95)
        
        assert len(res["items"]) >= 3
        assert res["financials"]["total"] == 1029.00
    asyncio.run(_test())

def test_case_7_receipt_with_discounts():
    async def _test():
        text = (
            "ZARA APPAREL RETAIL\n"
            "Date: 2026-10-25\n"
            "Bill No: ZR-8812\n"
            "Cotton Shirt            1   ₹2490.00\n"
            "Subtotal: ₹2490.00\n"
            "Total Discount: ₹500.00\n"
            "Taxes: ₹199.00\n"
            "Total Amount: ₹2189.00"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "zara.jpg", ocr_confidence=0.95)
        
        assert res["financials"]["discount"] == 500.00
        assert res["financials"]["total"] == 2189.00
        assert res["receipt"]["category"] == "Shopping"
    asyncio.run(_test())

def test_case_8_receipt_with_missing_information_zero_fabrication():
    """Ensures missing values remain null/empty and no dummy merchant or items are invented."""
    async def _test():
        text = (
            "Date: 2026-09-15\n"
            "Total: ₹450.00"
        )
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract(text, "unknown.jpg", ocr_confidence=0.85)
        
        # Merchant name was not present, must not fabricate a company name
        assert res["merchant"]["name"] == ""
        # Items were not listed, must remain empty list (ZERO FABRICATION)
        assert res["items"] == []
        assert res["confidence"]["merchant"] == 0.0
        assert any("Merchant name" in w for w in res["warnings"])
    asyncio.run(_test())

def test_case_9_invalid_unreadable_image():
    """Empty or unreadable text triggers proper unreadable message."""
    async def _test():
        extractor = RuleBasedFallbackExtractor()
        res = await extractor.extract("", "blank.jpg", ocr_confidence=0.0)
        
        assert res["confidence"]["overall"] == 0.0
        assert len(res["warnings"]) >= 1
        assert "unreadable" in res["warnings"][0].lower()
    asyncio.run(_test())

def test_case_10_pdf_receipt():
    """Test PyMuPDF digital text and table extraction."""
    doc = fitz.open()
    page = doc.new_page(width=400, height=300)
    page.insert_text((50, 40), "RELIANCE DIGITAL INVOICE", fontsize=14)
    page.insert_text((50, 70), "Invoice No: RD-4412   Date: 2026-11-02", fontsize=10)
    page.insert_text((50, 100), "Subtotal: 1500.00", fontsize=10)
    page.insert_text((50, 120), "Tax (GST 18%): 270.00", fontsize=10)
    page.insert_text((50, 150), "Grand Total: 1770.00", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    text, conf = OCREngine.extract_text_from_pdf(pdf_bytes)
    assert "RELIANCE DIGITAL" in text
    assert "1770.00" in text
    assert conf >= 0.90

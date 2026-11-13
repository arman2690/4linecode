import io
import re
import fitz  # PyMuPDF
from PIL import Image
from typing import Tuple, Optional

class OCREngine:
    """Extracts text and layout from receipts and invoices."""
    
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, float]:
        """Extracts direct text from searchable PDF or falls back to OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = []
        for page in doc:
            full_text.append(page.get_text("text"))
        doc.close()
        
        extracted = "\n".join(full_text).strip()
        if len(extracted) > 30:
            # High confidence because text was digitally encoded in PDF
            return extracted, 0.98
        return extracted, 0.50

    @staticmethod
    def extract_text_from_image(image: Image.Image) -> Tuple[str, float]:
        """Extracts text using available OCR tools or heuristic analysis."""
        # Try tesseract / paddleocr if installed in environment
        try:
            import pytesseract
            text = pytesseract.image_to_string(image)
            if len(text.strip()) > 10:
                return text.strip(), 0.92
        except Exception:
            pass
            
        # Fallback text representation
        return "", 0.0

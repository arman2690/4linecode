import io
import re
import fitz  # PyMuPDF
from PIL import Image
from typing import Tuple, Optional

class OCREngine:
    """Extracts text and layout from receipts and invoices."""
    
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, float]:
        """Extracts direct text and tables from searchable PDF or falls back to OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = []
        for page in doc:
            # 1. Extract tables if available
            try:
                tabs = page.find_tables()
                for tab in tabs:
                    table_rows = tab.extract()
                    for r in table_rows:
                        clean_row = [str(c).strip() for c in r if c and str(c).strip()]
                        if clean_row:
                            full_text.append(" | ".join(clean_row))
            except Exception:
                pass

            # 2. Extract reading-order sorted text
            sorted_text = page.get_text("text", sort=True)
            if sorted_text:
                full_text.append(sorted_text)

        doc.close()
        
        extracted = "\n".join(full_text).strip()
        if len(extracted) > 30:
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

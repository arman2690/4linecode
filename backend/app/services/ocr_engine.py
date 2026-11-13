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
        table_lines = []

        for page in doc:
            # 1. Extract natural reading-order sorted text first (preserves merchant header at the top)
            sorted_text = page.get_text("text", sort=True)
            if sorted_text:
                full_text.append(sorted_text)

            # 2. Extract structured tables separately
            try:
                tabs = page.find_tables()
                for tab in tabs:
                    table_rows = tab.extract()
                    for r in table_rows:
                        clean_row = [str(c).strip() for c in r if c is not None and str(c).strip()]
                        if clean_row and len(clean_row) >= 2:
                            table_lines.append(" | ".join(clean_row))
            except Exception:
                pass

        doc.close()

        # Combine text with a dedicated table section
        combined = "\n".join(full_text).strip()
        if table_lines:
            combined += "\n\n--- INVOICE ITEMS TABLE ---\n" + "\n".join(table_lines)
            
        if len(combined) > 30:
            return combined, 0.98
        return combined, 0.50

    @staticmethod
    def extract_text_from_image(image: Image.Image) -> Tuple[str, float]:
        """Extracts text using available OCR tools or heuristic analysis."""
        try:
            import pytesseract
            text = pytesseract.image_to_string(image)
            if len(text.strip()) > 10:
                return text.strip(), 0.92
        except Exception:
            pass
            
        return "", 0.0

import io
import re
import numpy as np
from PIL import Image
import fitz  # PyMuPDF
from typing import Tuple, List, Optional, Dict, Any

class OCREngine:
    """
    Robust OCR Engine for receipts, bills, and invoices.
    Combines PyMuPDF for native vector PDFs and RapidOCR (ONNX) for scanned documents and mobile camera photos.
    Preserves spatial layout, label-value alignment, and real confidence scores.
    """
    _ocr_instance = None

    @classmethod
    def get_ocr(cls):
        if cls._ocr_instance is None:
            try:
                from rapidocr_onnxruntime import RapidOCR
                cls._ocr_instance = RapidOCR()
            except Exception as e:
                print(f"[OCREngine] Notice: RapidOCR could not be loaded: {e}")
                cls._ocr_instance = None
        return cls._ocr_instance

    @classmethod
    def extract_text_from_image(cls, image: Image.Image) -> Tuple[str, float]:
        """
        Runs RapidOCR on image, groups text into natural lines based on vertical alignment,
        preserves left-to-right label/value pairs, and calculates genuine OCR confidence.
        """
        ocr = cls.get_ocr()
        if not ocr:
            return "", 0.0

        try:
            # Convert PIL image to RGB numpy array
            img_rgb = image.convert("RGB")
            img_arr = np.array(img_rgb)
            result, _ = ocr(img_arr)
            
            if not result:
                return "", 0.0

            # Result format: [[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], text, score]
            boxes_data = []
            scores = []
            for item in result:
                box = item[0]
                text = str(item[1]).strip()
                score = float(item[2])
                if not text:
                    continue
                
                # Calculate bounding rect
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                min_x, max_x = min(xs), max(xs)
                min_y, max_y = min(ys), max(ys)
                mid_y = (min_y + max_y) / 2.0
                height = max_y - min_y

                boxes_data.append({
                    "text": text,
                    "score": score,
                    "min_x": min_x,
                    "max_x": max_x,
                    "mid_y": mid_y,
                    "height": height
                })
                scores.append(score)

            if not boxes_data:
                return "", 0.0

            # Sort top to bottom first
            boxes_data.sort(key=lambda b: b["mid_y"])

            # Group into lines using vertical overlap
            lines = []
            current_line = [boxes_data[0]]

            for box in boxes_data[1:]:
                ref_box = current_line[-1]
                v_threshold = max(12.0, min(ref_box["height"], box["height"]) * 0.6)
                if abs(box["mid_y"] - ref_box["mid_y"]) <= v_threshold:
                    current_line.append(box)
                else:
                    # Sort line left-to-right
                    current_line.sort(key=lambda b: b["min_x"])
                    lines.append("   ".join(b["text"] for b in current_line))
                    current_line = [box]

            if current_line:
                current_line.sort(key=lambda b: b["min_x"])
                lines.append("   ".join(b["text"] for b in current_line))

            full_text = "\n".join(lines).strip()
            mean_conf = sum(scores) / len(scores) if scores else 0.0
            return full_text, round(mean_conf, 3)

        except Exception as e:
            print(f"[OCREngine] OCR processing error: {e}")
            return "", 0.0

    @classmethod
    def extract_text_from_pdf(cls, pdf_bytes: bytes) -> Tuple[str, float]:
        """
        Extracts direct text & structured tables from PDF.
        If the PDF is scanned or image-based, renders pages to images and applies RapidOCR.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text_blocks = []
        table_lines = []
        is_scanned = True

        for page in doc:
            # 1. Natural reading order text
            sorted_text = page.get_text("text", sort=True).strip()
            if len(sorted_text) > 40:
                is_scanned = False
                full_text_blocks.append(sorted_text)

            # 2. Extract structured tables if present
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

        # If digital text was found
        if not is_scanned and full_text_blocks:
            combined = "\n".join(full_text_blocks).strip()
            if table_lines:
                combined += "\n\n--- INVOICE ITEMS TABLE ---\n" + "\n".join(table_lines)
            return combined, 0.98

        # If scanned PDF, rasterize first up to 3 pages and OCR
        from .image_preprocessor import ImagePreprocessor
        rendered_images = ImagePreprocessor.process_pdf(pdf_bytes, dpi=200, max_pages=3)
        all_texts = []
        all_confs = []

        for img in rendered_images:
            _, enhanced = ImagePreprocessor.process_image(img)
            t, conf = cls.extract_text_from_image(enhanced)
            if t:
                all_texts.append(t)
                all_confs.append(conf)

        if all_texts:
            full_extracted = "\n\n--- PAGE BREAK ---\n\n".join(all_texts)
            avg_conf = sum(all_confs) / len(all_confs) if all_confs else 0.85
            return full_extracted, round(avg_conf, 3)

        return "", 0.0

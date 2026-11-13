import io
from PIL import Image, ImageOps, ImageEnhance
import fitz  # PyMuPDF
from typing import Tuple, List, Any

class ImagePreprocessor:
    """Preprocesses receipt images and PDFs to optimize OCR accuracy."""
    
    @staticmethod
    def process_image(image_input: Any, max_dim: int = 2400) -> Tuple[Image.Image, Image.Image]:
        if isinstance(image_input, bytes):
            image = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            image = Image.open(image_input)
        
        # 1. Correct EXIF orientation
        image = ImageOps.exif_transpose(image)
        
        # 2. Convert to RGB if needed (handle RGBA or P)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
            
        # 3. Resize if excessively large
        w, h = image.size
        if max(w, h) > max_dim:
            scaling = max_dim / float(max(w, h))
            new_size = (int(w * scaling), int(h * scaling))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            
        # 4. Enhance contrast for OCR readability
        gray = image.convert("L")
        enhancer = ImageEnhance.Contrast(gray)
        enhanced_gray = enhancer.enhance(1.5)
        
        # Return both colored for display and enhanced for OCR
        return image, enhanced_gray

    @staticmethod
    def process_pdf(pdf_bytes: bytes) -> List[Image.Image]:
        """Renders first page (or all pages) of a PDF to high-resolution images for OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images = []
        for page_num in range(min(len(doc), 3)):  # process up to 3 pages
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            images.append(img)
        doc.close()
        return images

import io
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import fitz  # PyMuPDF
from typing import Tuple, List, Any, Union

class ImagePreprocessor:
    """Preprocesses receipt images and PDFs to optimize OCR accuracy and readability."""
    
    @staticmethod
    def process_image(image_input: Union[bytes, Image.Image], max_dim: int = 2600) -> Tuple[Image.Image, Image.Image]:
        """
        Takes raw bytes or PIL Image.
        Returns:
            - color_image: cleanly oriented RGB image for user display preview.
            - ocr_image: contrast-enhanced and sharpened grayscale image for OCR engine.
        """
        if isinstance(image_input, bytes):
            image = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            image = Image.open(image_input)
        
        # 1. Correct EXIF orientation (crucial for mobile camera captures)
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass
        
        # 2. Normalize color mode to RGB
        if image.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            bg.paste(image, mask=image.split()[-1] if len(image.split()) == 4 else None)
            image = bg
        elif image.mode != "RGB":
            image = image.convert("RGB")
            
        # 3. Resize if excessively large to balance performance and OCR fidelity
        w, h = image.size
        if max(w, h) > max_dim:
            scaling = max_dim / float(max(w, h))
            new_size = (int(w * scaling), int(h * scaling))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            
        # 4. Create enhanced version for OCR (grayscale, contrast boost, mild sharpening)
        gray = image.convert("L")
        
        # Enhance contrast by 1.6x to separate faded receipt text from thermal paper background
        contrast_enhancer = ImageEnhance.Contrast(gray)
        enhanced_gray = contrast_enhancer.enhance(1.6)
        
        # Sharpen edges for clear letterforms
        sharpness_enhancer = ImageEnhance.Sharpness(enhanced_gray)
        sharp_gray = sharpness_enhancer.enhance(1.4)
        
        return image, sharp_gray

    @staticmethod
    def process_pdf(pdf_bytes: bytes, dpi: int = 200, max_pages: int = 3) -> List[Image.Image]:
        """Renders pages of a PDF to high-resolution images for OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images = []
        for page_num in range(min(len(doc), max_pages)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=dpi)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            images.append(img)
        doc.close()
        return images

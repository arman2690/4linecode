import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status
from ..core.auth import get_current_user, AuthenticatedUser
from ..models.receipt import (
    ReceiptCreate,
    ReceiptUpdate,
    ReceiptResponse,
    ExtractionResult,
    DocumentStatus
)
from ..services.db_service import db_service
from ..services.image_preprocessor import ImagePreprocessor
from ..services.ocr_engine import OCREngine
from ..services.ai_extractor import ai_extraction_service
from ..config import settings

router = APIRouter(prefix="/receipts", tags=["Receipts"])

@router.post("/upload", response_model=ExtractionResult)
async def upload_and_process_receipt(
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Step 1: Validate file type and size.
    Step 2: Preprocess document (orientation, contrast, PDF rasterization).
    Step 3: Extract raw text via OCR or digital PDF parser.
    Step 4: Send to AI extraction pipeline for structured extraction.
    Step 5: Apply 3-colour traffic light quality assessment.
    Returns structured data for user review/verification before saving.
    """
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_FILE_TYPES:
        # Check by extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{content_type or ext}'. Please upload JPG, PNG, WEBP, or PDF."
            )

    contents = await file.read()
    if len(contents) > settings.UPLOAD_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_BYTES // (1024*1024)} MB."
        )

    # Preprocess & Extract text
    raw_text = ""
    confidence = 0.95

    try:
        if content_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
            raw_text, confidence = OCREngine.extract_text_from_pdf(contents)
            if not raw_text:
                # Render to image and OCR
                images = ImagePreprocessor.process_pdf(contents)
                if images:
                    _, enhanced = ImagePreprocessor.process_image(images[0])
                    raw_text, confidence = OCREngine.extract_text_from_image(enhanced)
        else:
            orig, enhanced = ImagePreprocessor.process_image(contents)
            raw_text, confidence = OCREngine.extract_text_from_image(enhanced)
            if not raw_text:
                # Fallback to filename or generic parsing
                raw_text = f"Purchase Receipt from uploaded image: {file.filename}"
                confidence = 0.85
    except Exception as e:
        raw_text = f"Scanned Receipt {file.filename}"
        confidence = 0.70

    # AI structured extraction
    result = await ai_extraction_service.process_receipt(
        raw_text=raw_text,
        filename=file.filename,
        ocr_confidence=confidence
    )

    return result

@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    receipt_data: ReceiptCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Saves confirmed receipt and associated line items into the user's digital vault."""
    saved = await db_service.create_receipt(user.user_id, receipt_data)
    return saved

@router.get("", response_model=List[ReceiptResponse])
async def list_receipts(
    search: Optional[str] = Query(None, description="Search by merchant or product name"),
    category: Optional[str] = Query(None, description="Filter by item category"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieves all receipts belonging to the authenticated user."""
    receipts = await db_service.get_receipts(user.user_id, search=search, category=category)
    return receipts

@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Fetches full receipt details, verified line items, and document assessment."""
    receipt = await db_service.get_receipt(user.user_id, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.put("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: str,
    receipt_data: ReceiptUpdate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Allows user to edit every extracted field or line item."""
    updated = await db_service.update_receipt(user.user_id, receipt_id, receipt_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return updated

@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Deletes receipt and associated records."""
    success = await db_service.delete_receipt(user.user_id, receipt_id)
    if not success:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return None

import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status, Request
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
    request: Request,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Step 1: Validate file type and size.
    Step 2: Preprocess document (orientation, contrast, PDF rasterization).
    Step 3: Extract raw text via OCR or digital PDF parser.
    Step 4: Send to AI extraction pipeline for strict structured extraction.
    Step 5: Apply scan accuracy confidence scoring.
    Returns strictly formatted receipt data for user review/verification.
    """
    content_type = file.content_type or ""
    ext = os.path.splitext(file.filename or "")[1].lower()
    
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"] and content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext or content_type}'. Please upload JPG, PNG, WEBP, or PDF."
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please select a valid receipt image or document."
        )

    if len(contents) > settings.UPLOAD_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_BYTES // (1024*1024)} MB."
        )

    # Preprocess & Extract text
    raw_text = ""
    confidence = 0.0

    try:
        if content_type == "application/pdf" or ext == ".pdf":
            raw_text, confidence = OCREngine.extract_text_from_pdf(contents)
        else:
            orig, enhanced = ImagePreprocessor.process_image(contents)
            raw_text, confidence = OCREngine.extract_text_from_image(enhanced)
            if not raw_text or len(raw_text.strip()) < 10:
                # If enhanced failed, try raw color image
                raw_text, confidence = OCREngine.extract_text_from_image(orig)
    except Exception as e:
        print(f"[Upload] OCR Extraction error: {e}")
        raw_text = ""
        confidence = 0.0

    # AI structured extraction
    ai_key = request.headers.get("x-ai-key")
    result = await ai_extraction_service.process_receipt(
        raw_text=raw_text,
        filename=file.filename or "",
        ocr_confidence=confidence,
        ai_key=ai_key
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

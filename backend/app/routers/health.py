from fastapi import APIRouter
from ..config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "features": {
            "ocr": True,
            "ai_extraction": True,
            "pdf_processing": True,
            "supabase_connected": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)
        }
    }

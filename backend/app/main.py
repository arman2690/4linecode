from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .routers import health, receipts, analytics, warranties, assistant

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ReceiptIQ Backend API: Production-grade receipt OCR, financial intelligence, warranty tracking, and purchase memory.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware for Vercel, localhost, and custom deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(receipts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(warranties.router, prefix=settings.API_V1_STR)
app.include_router(assistant.router, prefix=settings.API_V1_STR)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log securely and return with explicit CORS headers so browsers do not throw 'Failed to fetch'
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": f"An error occurred while processing the request: {str(exc)}"},
        headers=headers,
    )

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs"
    }

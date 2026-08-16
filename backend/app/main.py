from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="BIS Nexus Hub-and-Spoke Instant Payment System with Zero-Knowledge Proofs & ISO 20022",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Set CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Swagger UI documentation"""
    return RedirectResponse(url="/docs")


@app.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
def api_v1_docs_redirect():
    """Support /api/v1/docs redirect to /docs"""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "RHIPay BIS Nexus Hub",
        "version": "2.0.0",
        "roles": ["Sender", "Receiver", "Admin"],
    }

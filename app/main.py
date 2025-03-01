"""Main FastAPI application module."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from app.api.versions import v1_router, v2_router
from app.core.config import settings
from app.middleware.logging import RequestLoggingMiddleware
from app.utils.logger import get_logger

logger = get_logger(__name__)

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Set up CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add request logging middleware
    application.add_middleware(RequestLoggingMiddleware)

    # Include versioned routers
    application.include_router(v1_router)
    application.include_router(v2_router)

    # Add global exception handler
    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle all unhandled exceptions."""
        logger.error(f"Global exception handler: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
            }
        )

    return application

app = create_application()

def custom_openapi():
    """Create custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        routes=app.routes,
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # Add API versioning info
    openapi_schema["info"]["x-api-versions"] = {
        "current": "v1",
        "supported": ["v1"],
        "deprecated": [],
    }

    # Add response schemas
    openapi_schema["components"]["schemas"]["HTTPError"] = {
        "type": "object",
        "properties": {
            "success": {"type": "boolean", "example": False},
            "message": {"type": "string"},
            "detail": {"type": "string"},
        },
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.on_event("startup")
async def startup_event():
    """Initialize application services on startup."""
    logger.info("Starting up PDF Manager application")
    logger.info(f"API Version: {settings.VERSION}")
    logger.info(f"Debug Mode: {settings.DEBUG}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down PDF Manager application") 
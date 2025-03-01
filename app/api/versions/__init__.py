"""API version management."""

from fastapi import APIRouter
from app.core.config import settings

# Create routers for different API versions
v1_router = APIRouter(prefix=settings.API_V1_STR)
v2_router = APIRouter(prefix="/api/v2")  # For future use

# Import and include routes for v1
from app.api.routes import pdf, auth

# V1 routes
v1_router.include_router(auth, prefix="/auth", tags=["Authentication"])
v1_router.include_router(pdf, prefix="/pdf", tags=["PDF Operations"])

# V2 routes can be added here when needed
# v2_router.include_router(...) 
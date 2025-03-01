"""Logging middleware module."""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import get_logger

# Get a logger instance for this module
logger = get_logger("app.middleware.logging")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request and response details."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request/response and log details."""
        start_time = time.time()
        
        # Log request details
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"Client: {request.client.host if request.client else 'Unknown'}"
        )
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response details
            logger.info(
                f"Response: {response.status_code} "
                f"Process Time: {process_time:.3f}s "
                f"Path: {request.url.path}"
            )
            
            # Add custom headers
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            # Log error details
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"Error: {str(e)}"
            )
            raise 
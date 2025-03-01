"""API dependencies."""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verify_token
from app.services.pdf_service import PDFService
from app.schemas.auth import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_pdf_service() -> PDFService:
    """Get PDFService instance."""
    return PDFService()

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = verify_token(token)
    if username is None:
        raise credentials_exception
    
    # In a real application, get user from database
    # For development, use the username as is if it's an email, otherwise make it an email
    email = username if '@' in username else f"{username}@example.com"
    
    user = User(
        username=username,
        email=email,
        full_name=username.split('@')[0].title()
    )
    
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user 
"""Authentication schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    """Token schema."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Token type")

class TokenData(BaseModel):
    """Token data schema."""
    username: Optional[str] = Field(None, description="Username from token")

class UserBase(BaseModel):
    """Base user schema."""
    username: str = Field(..., description="Username")
    email: EmailStr = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, description="Full name")

class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, description="Password")

class User(UserBase):
    """User schema."""
    disabled: Optional[bool] = Field(False, description="Whether user is disabled") 
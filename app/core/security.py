"""Security utilities."""

from datetime import datetime, timedelta
import secrets
import json
import os
from typing import Optional, Union, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def user_is_first_time_login(username: str) -> bool:
    """Check if this is the user's first time logging in."""
    try:
        with open(settings.ENCRYPTION_KEYS_FILE, 'r') as f:
            keys = json.load(f)
            return username not in keys
    except (FileNotFoundError, json.JSONDecodeError):
        # If the file doesn't exist or is empty, it's definitely first time
        return True

def generate_encryption_key() -> str:
    """Generate a secure encryption key."""
    return secrets.token_urlsafe(32)

def save_encryption_key(user_id: str, key: str) -> None:
    """Save encryption key for a user."""
    # Ensure the directory exists
    os.makedirs(os.path.dirname(settings.ENCRYPTION_KEYS_FILE), exist_ok=True)
    
    try:
        with open(settings.ENCRYPTION_KEYS_FILE, 'r') as f:
            keys = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        keys = {}
    
    keys[user_id] = key
    
    with open(settings.ENCRYPTION_KEYS_FILE, 'w') as f:
        json.dump(keys, f)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

"""Authentication router module."""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    generate_encryption_key,
    save_encryption_key,
    user_is_first_time_login
)
from app.schemas.auth import Token, UserCreate, User
from app.api.deps import get_current_user

router = APIRouter()

@router.post(
    "/token",
    response_model=Token,
    summary="Create access token",
    description="Create access token for authenticated user",
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # In a real application, verify against database
    if not verify_password(form_data.password, get_password_hash("secret")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    
    # Check if the user is logging in for the first time
    if user_is_first_time_login(form_data.username):  # Implement this function
        new_encryption_key = generate_encryption_key()  # Generate a new key
        # Save the new encryption key to the database or user profile
        save_encryption_key(form_data.username, new_encryption_key)  # Implement this function

    return Token(access_token=access_token, token_type="bearer")

@router.post(
    "/register",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Register a new user in the system",
)
async def register_user(user: UserCreate) -> User:
    """
    Register new user.
    """
    # In a real application, save to database
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
    )
    return db_user

@router.get(
    "/me",
    response_model=User,
    summary="Get current user",
    description="Get information about currently authenticated user",
)
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user.
    """
    return current_user 
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # For testing purposes, accept any username/password
    user_data = {"sub": form_data.username}
    token = auth_service.create_access_token(user_data)
    return {"access_token": token, "token_type": "bearer"} 
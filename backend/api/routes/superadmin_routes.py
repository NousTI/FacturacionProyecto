import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request

from repositories.superadmin_repository import SuperadminRepository
from services.superadmin_session_service import SuperadminSessionService
from dependencies.superadmin_dependencies import get_current_superadmin
from models.Superadmin import SuperadminRead
from utils.security import verify_password
from utils.jwt_utils import create_access_token
from utils.responses import success_response, error_response
from database.connection import get_db_connection

router = APIRouter(prefix="/api/superadmin", tags=["Superadmin"])

@router.post("/login")
def login(
    request: Request,
    credentials: dict, # Expects email, password
    repo: SuperadminRepository = Depends(),
    session_service: SuperadminSessionService = Depends()
):
    email = credentials.get("email")
    password = credentials.get("password")
    
    superadmin = repo.get_superadmin_by_email(email)
    if not superadmin or not verify_password(password, superadmin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
        )
    
    # Create Session
    session_id = uuid.uuid4().hex
    # Enforce single session (Strict Mode)
    new_sid = session_service.start_superadmin_session(
        superadmin["id"], 
        session_id, 
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.client.host
    )
    
    if new_sid is None:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_response(status.HTTP_403_FORBIDDEN, "Ya existe una sesión activa. Debes cerrar sesión antes de ingresar nuevamente.")
        )
    
    # Update last login
    repo.update_last_login(superadmin["id"])
    
    token, _ = create_access_token({
        "sub": str(superadmin["id"]), 
        "role": "superadmin",
        "sid": new_sid,
        "jti": new_sid
    })
    return success_response({"access_token": token, "token_type": "bearer"})

@router.post("/logout")
def logout(
    request: Request,
    current_admin=Depends(get_current_superadmin),
    session_service: SuperadminSessionService = Depends()
):
    payload = request.state.jwt_payload
    sid = payload.get("sid")
    if sid:
        session_service.end_session(sid)
    
    return success_response({"message": "Sesión cerrada correctamente"})

@router.get("/me", response_model=SuperadminRead)
def read_me(
    current_admin=Depends(get_current_superadmin)
):
    return current_admin

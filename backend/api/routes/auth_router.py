# backend/api/routes/auth_router.py

import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_db_connection
from dependencies.auth_dependencies import get_current_user
from models.Usuario import UserLogin, UserRead
from models.Vendedor import VendedorLogin, VendedorRead
from services.session_service import end_user_session, start_user_session
from services.user_service import UserService
from services.vendedor_session_service import VendedorSessionService
from services.vendedor_service import VendedorService
from utils.jwt_utils import create_access_token
from utils.responses import success_response, error_response

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Register endpoint moved to user_routes to handle permissions better
# @router.post("/register", response_model=UserRead)
# def register(user: UserRegister, service: UserService = Depends()):
#     new_user = service.create_user(user)
#     return new_user


@router.post("/login")
def login(request: Request, user: UserLogin, service: UserService = Depends(), conn=Depends(get_db_connection)):
    # Authenticate using email and password
    db_user = service.authenticate_user(user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail=error_response(401, "Credenciales incorrectas"),
        )

    user_id = db_user["id"]
    
    # Generar identificador único y reusarlo como sid y jti
    session_id = uuid.uuid4().hex

    # Intentar crear sesión
    session_id = start_user_session(
        conn,
        user_id=user_id,
        jti=session_id,
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.client.host,
    )

    # Si devuelve None => usuario ya tiene una sesión activa
    if session_id is None:
        raise HTTPException(
            status_code=403,
            detail=error_response(
                403, "Ya existe una sesión activa. Cierra sesión antes de iniciar una nueva."
            ),
        )

    # Crear token final con session_id como jti
    token, _ = create_access_token(
        {
            "sub": str(user_id),
            "sid": session_id,
            "jti": session_id,
        }
    )

    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout(
    request: Request,
    current_user=Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    payload = request.state.jwt_payload
    session_id = payload.get("sid")

    if not session_id:
        raise HTTPException(
            status_code=400, detail=error_response(400, "Token sin sesión asociada")
        )

    # Cerrar la sesión en BD
    end_user_session(conn, session_id)

    return {"message": "Sesión cerrada correctamente"}


@router.get("/me", response_model=UserRead)
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/vendedor/login")
def login_vendedor(
    request: Request,
    credentials: VendedorLogin,
    session_service: VendedorSessionService = Depends()
):
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")
    
    result = session_service.login_vendedor(
        email=credentials.email,
        password=credentials.password,
        request=request,
        user_agent=user_agent,
        ip_address=ip_address
    )
    return result

@router.post("/vendedor/logout")
def logout_vendedor(
    request: Request,
    current_user: dict = Depends(get_current_user),
    session_service: VendedorSessionService = Depends()
):
    payload = request.state.jwt_payload
    jti = payload.get("sid")
    if jti:
        session_service.logout_vendedor(jti)
    return success_response("Sesión cerrada exitosamente")

@router.get("/vendedor/me", response_model=VendedorRead)
def get_current_vendedor_me(
    current_user: dict = Depends(get_current_user),
    vendedor_service: VendedorService = Depends()
):
    if not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres un vendedor"
        )
    return vendedor_service.get_vendedor(current_user["id"])

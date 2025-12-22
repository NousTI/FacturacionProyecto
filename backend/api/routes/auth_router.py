import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_db_connection
from dependencies.auth_dependencies import get_current_user
from models.Usuario import UserLogin, UserRead
from models.Vendedor import VendedorLogin, VendedorRead
from services.user_session_service import end_user_session
from services.user_service import UserService
from services.vendedor_session_service import VendedorSessionService
from services.vendedor_service import VendedorService
from utils.responses import success_response, error_response

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Register endpoint moved to user_routes to handle permissions better
# @router.post("/register", response_model=UserRead)
# def register(user: UserRegister, service: UserService = Depends()):
#     new_user = service.create_user(user)
#     return new_user


@router.post("/login")
def login(request: Request, user: UserLogin, service: UserService = Depends()):
    ip_address = request.client.host
    user_agent = request.headers.get("User-Agent")
    return service.login_user(user.model_dump(), user_agent=user_agent, ip_address=ip_address)


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

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request

from repositories.superadmin_repository import SuperadminRepository
from repositories.user_repository import UserRepository
from repositories.rol_repository import RolRepository
from services.superadmin_session_service import SuperadminSessionService
from services.subscription_monitor_service import SubscriptionMonitorService
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

# Deshabilitarlo por ahora
# @router.post("/impersonate/{empresa_id}")
# def impersonate_company(
#     empresa_id: uuid.UUID,
#     current_admin=Depends(get_current_superadmin),
#     user_repo: UserRepository = Depends(),
#     rol_repo: RolRepository = Depends()
# ):
#     """
#     Permite al Superadmin generar un token de acceso como el 'ADMIN' de una empresa específica.
#     """
#     # 1. Buscar el Rol 'ADMIN' de esa empresa
#     # roles = rol_repo.list_roles(empresa_id)
#     # admin_role = next((r for r in roles if r.get('codigo') == 'ADMIN'), None)
    
#     # if not admin_role:
#     #     raise HTTPException(status_code=404, detail="No se encontró un rol ADMIN en la empresa especificada")

#     # 2. Buscar usuarios con ese rol
#     # users = user_repo.list_users(empresa_id=empresa_id, rol_id=admin_role['id'])
    
#     # if not users:
#     #     raise HTTPException(status_code=404, detail="No se encontraron usuarios con rol ADMIN en esta empresa")
        
#     # 3. Seleccionar el primero (o el más reciente)
#     # target_user = users[0]
    
#     # 4. Generar Token simulado
#     # Importante: No creamos sesión de usuario en DB (UserSession) por simplicidad y porque es una acción administrativa,
#     # pero para frontend necesitamos un token compatible. 
#     # Usaremos una sesión "stateless" o simulada en el token si el sistema lo permite, 
#     # o generamos un ID de sesión random.
#     # fake_sid = uuid.uuid4().hex
    
#     # token, _ = create_access_token({
#     #     "sub": str(target_user["id"]), 
#     #     "role": "admin", # Explicitly set role or use target_user code? System expects role permissions.
#     #     "rol_id": str(target_user["rol_id"]),
#     #     "empresa_id": str(target_user["empresa_id"]),
#     #     "permissions": [], # Should we fetch permissions? Auth dependencies might fetch them from DB using rol_id.
#     #                        # But `get_current_user` usually decodes token and verify User in DB?
#     #                        # `get_current_user` in `auth_dependencies.py` fetches user from DB if strictly required or trusts token?
#     #                        # Usually standard JWT auth just needs 'sub'.
#     #     "sid": fake_sid,
#     #     "type": "impersonation",
#     #     "impersonator": str(current_admin["id"])
#     # })
    
#     # return success_response({
#     #     "access_token": token, 
#     #     "token_type": "bearer",
#     #     "impersonated_user": target_user["email"]
#     # })

@router.post("/maintenance/check-subscriptions")
def check_subscriptions(
    current_admin=Depends(get_current_superadmin),
    monitor_service: SubscriptionMonitorService = Depends()
):
    """
    Ejecuta manualmente el proceso de revisión de suscripciones vencidas.
    """
    result = monitor_service.process_expired_subscriptions()
    return success_response(result)

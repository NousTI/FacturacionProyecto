from fastapi import Depends, Request
from .services import AuthServices
from .schemas import LoginRequest
from ...errors.app_error import AppError

class AuthController:
    def __init__(self, service: AuthServices = Depends()):
        self.service = service

    def login(self, request: Request, body: LoginRequest):
        return self.service.iniciar_sesion(
            body.correo, body.clave, 
            request.client.host, 
            request.headers.get("user-agent")
        )

    def logout(self, request: Request):
        payload = getattr(request.state, "jwt_payload", {})
        return self.service.cerrar_sesion(payload)

    def obtener_perfil(self, usuario: dict):
        return {"data": usuario}

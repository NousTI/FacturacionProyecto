from fastapi import Depends
from .services import SuperadminServices
from .schemas import PerfilUpdate
from ...utils.response import success_response

class SuperadminController:
    def __init__(self, service: SuperadminServices = Depends()):
        self.service = service

    def obtener_mi_perfil(self, user_id: str):
        perfil = self.service.obtener_perfil(user_id)
        return success_response(perfil)

    def actualizar_mi_perfil(self, user_id: str, body: PerfilUpdate):
        self.service.actualizar_perfil(user_id, body.model_dump(exclude_unset=True))
        return success_response(None, "Perfil actualizado correctamente")

    def ejecutar_limpieza_suscripciones(self, usuario_actual: dict):
        result = self.service.ejecutar_limpieza_suscripciones(usuario_actual)
        return success_response(result, "Proceso de mantenimiento ejecutado")

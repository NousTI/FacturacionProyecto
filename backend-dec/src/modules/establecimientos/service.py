from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioEstablecimientos
from .schemas import EstablecimientoCreacion, EstablecimientoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioEstablecimientos:
    def __init__(self, repo: RepositorioEstablecimientos = Depends()):
        self.repo = repo

    def crear_establecimiento(self, datos: EstablecimientoCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise AppError("Superadmin debe especificar empresa_id", 400, "VAL_ERROR")
            target_empresa_id = datos.empresa_id
        else:
            user_empresa_id = usuario_actual.get("empresa_id")
            if datos.empresa_id and str(datos.empresa_id) != str(user_empresa_id):
                raise AppError("No puede crear establecimientos para otra empresa", 403, "AUTH_FORBIDDEN")
            target_empresa_id = user_empresa_id

        try:
            nuevo = self.repo.crear_establecimiento(datos.model_dump(exclude_unset=True), target_empresa_id)
            if not nuevo:
                raise AppError("Error al crear el establecimiento", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            if "uq_establecimiento_empresa_codigo" in str(e):
                 raise AppError(f"Ya existe un establecimiento con el código '{datos.codigo}' en esta empresa.", 400, "VAL_ERROR")
            raise e

    def obtener_establecimiento(self, establecimiento_id: UUID, usuario_actual: dict):
        establecimiento = self.repo.obtener_por_id(establecimiento_id)
        if not establecimiento:
            raise AppError("Establecimiento no encontrado", 404, "ESTABLECIMIENTO_NOT_FOUND")
        
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            user_empresa_id = usuario_actual.get("empresa_id")
            if str(establecimiento['empresa_id']) != str(user_empresa_id):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return establecimiento

    def listar_establecimientos(self, usuario_actual: dict, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = None
        
        if is_superadmin:
             if empresa_id: target_empresa_id = empresa_id
        else:
             target_empresa_id = usuario_actual.get("empresa_id")

        return self.repo.listar_establecimientos(target_empresa_id, limit, offset)

    def actualizar_establecimiento(self, establecimiento_id: UUID, datos: EstablecimientoActualizacion, usuario_actual: dict):
        self.obtener_establecimiento(establecimiento_id, usuario_actual)
        
        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload: return self.repo.obtener_por_id(establecimiento_id)
            
            actualizado = self.repo.actualizar_establecimiento(establecimiento_id, payload)
            if not actualizado:
                 raise AppError("Error al actualizar establecimiento", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            if "uq_establecimiento_empresa_codigo" in str(e):
                 raise AppError(f"Ya existe un establecimiento con el código '{datos.codigo}' en esta empresa.", 400, "VAL_ERROR")
            raise e

    def eliminar_establecimiento(self, establecimiento_id: UUID, usuario_actual: dict):
        self.obtener_establecimiento(establecimiento_id, usuario_actual)
        if not self.repo.eliminar_establecimiento(establecimiento_id):
            raise AppError("Error al eliminar establecimiento", 500, "DB_ERROR")
        return True

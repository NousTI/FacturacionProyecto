from fastapi import Depends
from uuid import UUID
from typing import Optional

from .repository import RepositorioReporteGenerado
from .schemas import ReporteGeneradoCreacion, ReporteGeneradoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError


class ServicioReporteGenerado:
    def __init__(self, repo: RepositorioReporteGenerado = Depends()):
        self.repo = repo

    def crear_reporte(self, datos: ReporteGeneradoCreacion, usuario_actual: dict):
        empresa_id = usuario_actual.get("empresa_id")
        if not empresa_id:
            raise AppError("Usuario no asociado a una empresa", 403, "AUTH_FORBIDDEN")

        usuario_id = usuario_actual.get('id')
        if not usuario_id:
            raise AppError("No se pudo determinar el ID del usuario", 400, "VAL_ERROR")

        payload = datos.model_dump(exclude_unset=True)
        payload['empresa_id'] = str(empresa_id)
        payload['usuario_id'] = str(usuario_id)

        try:
            nuevo = self.repo.crear_reporte(payload)
            if not nuevo:
                raise AppError("Error al registrar reporte", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            raise e

    def obtener_reporte(self, id: UUID, usuario_actual: dict):
        reporte = self.repo.obtener_por_id(id)
        if not reporte:
            raise AppError("Reporte no encontrado", 404, "REPORTE_NOT_FOUND")

        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(reporte['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No tiene acceso a este reporte", 403, "AUTH_FORBIDDEN")

        return reporte

    def listar_reportes(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)

        if is_superadmin:
            if empresa_id:
                return self.repo.listar_por_empresa(empresa_id)
            return self.repo.listar_todos()

        target_empresa_id = usuario_actual.get("empresa_id")
        return self.repo.listar_por_empresa(target_empresa_id)

    def actualizar_reporte(self, id: UUID, datos: ReporteGeneradoActualizacion, usuario_actual: dict):
        self.obtener_reporte(id, usuario_actual)

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload:
                return self.repo.obtener_por_id(id)

            actualizado = self.repo.actualizar_reporte(id, payload)
            if not actualizado:
                raise AppError("Error al actualizar el reporte", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            raise e

    def eliminar_reporte(self, id: UUID, usuario_actual: dict):
        self.obtener_reporte(id, usuario_actual)
        if not self.repo.eliminar_reporte(id):
            raise AppError("No se pudo eliminar el reporte", 500, "DB_ERROR")
        return True

    def descargar_reporte(self, id: UUID, usuario_actual: dict):
        reporte = self.obtener_reporte(id, usuario_actual)
        self.repo.incrementar_descargas(id)
        return reporte

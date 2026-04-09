from fastapi import Depends
from uuid import UUID

from .repository import RepositorioTipoMovimiento
from .schemas import TipoMovimientoCreacion, TipoMovimientoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError


class ServicioTipoMovimiento:
    def __init__(self, repo: RepositorioTipoMovimiento = Depends()):
        self.repo = repo

    def crear_tipo_movimiento(self, datos: TipoMovimientoCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede crear tipos de movimiento", 403, "AUTH_FORBIDDEN")

        payload = datos.model_dump()

        try:
            nuevo = self.repo.crear_tipo_movimiento(payload)
            if not nuevo:
                raise AppError("Error al registrar tipo de movimiento", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            error_msg = str(e).lower()
            if "unique constraint" in error_msg:
                raise AppError("Este tipo de movimiento ya existe", 400, "VAL_ERROR")
            raise e

    def obtener_tipo_movimiento(self, id: UUID, usuario_actual: dict):
        tipo = self.repo.obtener_por_id(id)
        if not tipo:
            raise AppError("Tipo de movimiento no encontrado", 404, "TIPO_MOVIMIENTO_NOT_FOUND")
        return tipo

    def listar_tipos_movimiento(self, usuario_actual: dict):
        return self.repo.listar_todos()

    def actualizar_tipo_movimiento(self, id: UUID, datos: TipoMovimientoActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede actualizar tipos de movimiento", 403, "AUTH_FORBIDDEN")

        self.obtener_tipo_movimiento(id, usuario_actual)

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload:
                return self.repo.obtener_por_id(id)

            actualizado = self.repo.actualizar_tipo_movimiento(id, payload)
            if not actualizado:
                raise AppError("Error al actualizar tipo de movimiento", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            error_msg = str(e).lower()
            if "unique constraint" in error_msg:
                raise AppError("Este tipo de movimiento ya existe", 400, "VAL_ERROR")
            raise e

    def eliminar_tipo_movimiento(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede eliminar tipos de movimiento", 403, "AUTH_FORBIDDEN")

        self.obtener_tipo_movimiento(id, usuario_actual)
        if not self.repo.eliminar_tipo_movimiento(id):
            raise AppError("No se pudo eliminar tipo de movimiento", 500, "DB_ERROR")
        return True

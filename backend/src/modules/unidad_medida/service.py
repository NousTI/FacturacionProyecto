from fastapi import Depends
from uuid import UUID

from .repository import RepositorioUnidadMedida
from .schemas import UnidadMedidaCreacion, UnidadMedidaActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError


class ServicioUnidadMedida:
    def __init__(self, repo: RepositorioUnidadMedida = Depends()):
        self.repo = repo

    def crear_unidad_medida(self, datos: UnidadMedidaCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede crear unidades de medida", 403, "AUTH_FORBIDDEN")

        payload = datos.model_dump()

        try:
            nuevo = self.repo.crear_unidad_medida(payload)
            if not nuevo:
                raise AppError("Error al registrar unidad de medida", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            error_msg = str(e).lower()
            if "unique constraint" in error_msg:
                raise AppError("Esta unidad de medida ya existe", 400, "VAL_ERROR")
            raise e

    def obtener_unidad_medida(self, id: UUID, usuario_actual: dict):
        unidad = self.repo.obtener_por_id(id)
        if not unidad:
            raise AppError("Unidad de medida no encontrada", 404, "UNIDAD_MEDIDA_NOT_FOUND")
        return unidad

    def listar_unidades_medida(self, usuario_actual: dict):
        return self.repo.listar_todos()

    def actualizar_unidad_medida(self, id: UUID, datos: UnidadMedidaActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede actualizar unidades de medida", 403, "AUTH_FORBIDDEN")

        self.obtener_unidad_medida(id, usuario_actual)

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload:
                return self.repo.obtener_por_id(id)

            actualizado = self.repo.actualizar_unidad_medida(id, payload)
            if not actualizado:
                raise AppError("Error al actualizar unidad de medida", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            error_msg = str(e).lower()
            if "unique constraint" in error_msg:
                raise AppError("Esta unidad de medida ya existe", 400, "VAL_ERROR")
            raise e

    def eliminar_unidad_medida(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede eliminar unidades de medida", 403, "AUTH_FORBIDDEN")

        self.obtener_unidad_medida(id, usuario_actual)
        if not self.repo.eliminar_unidad_medida(id):
            raise AppError("No se pudo eliminar unidad de medida", 500, "DB_ERROR")
        return True

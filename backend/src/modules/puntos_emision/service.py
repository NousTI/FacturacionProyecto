from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioPuntosEmision
from .schemas import PuntoEmisionCreacion, PuntoEmisionActualizacion
from ..establecimientos.service import ServicioEstablecimientos
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioPuntosEmision:
    def __init__(
        self, 
        repo: RepositorioPuntosEmision = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends()
    ):
        self.repo = repo
        self.establecimiento_service = establecimiento_service

    def crear_punto(self, datos: PuntoEmisionCreacion, usuario_actual: dict):
        # Validation of ownership via Establishment Service
        self.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)

        try:
            nuevo = self.repo.crear_punto(datos.model_dump())
            if not nuevo:
                raise AppError("Error al crear el punto de emisión", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            if "uq_punto_emision_establecimiento_codigo" in str(e):
                 raise AppError(f"Ya existe un punto de emisión con el código '{datos.codigo}' en este establecimiento.", 400, "VAL_ERROR")
            raise e

    def obtener_punto(self, punto_id: UUID, usuario_actual: dict):
        punto = self.repo.obtener_por_id(punto_id)
        if not punto:
            raise AppError("Punto de emisión no encontrado", 404, "PUNTO_EMISION_NOT_FOUND")
        
        # Verify permissions via Establishment ownership
        self.establecimiento_service.obtener_establecimiento(punto['establecimiento_id'], usuario_actual)
            
        return punto

    def listar_puntos(self, usuario_actual: dict, establecimiento_id: Optional[UUID] = None, limit: int = 100, offset: int = 0):
        if not establecimiento_id:
             # If not provided, we might want to list all for superadmin or forbid for regular
             is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
             if not is_superadmin:
                  raise AppError("Debe especificar establecimiento_id", 400, "VAL_ERROR")
        else:
             self.establecimiento_service.obtener_establecimiento(establecimiento_id, usuario_actual)

        return self.repo.listar_puntos(establecimiento_id, limit, offset)

    def actualizar_punto(self, punto_id: UUID, datos: PuntoEmisionActualizacion, usuario_actual: dict):
        current = self.obtener_punto(punto_id, usuario_actual)
        
        if datos.establecimiento_id and str(datos.establecimiento_id) != str(current['establecimiento_id']):
            self.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload: return self.repo.obtener_por_id(punto_id)
            
            actualizado = self.repo.actualizar_punto(punto_id, payload)
            if not actualizado:
                 raise AppError("Error al actualizar punto de emisión", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            if "uq_punto_emision_establecimiento_codigo" in str(e):
                 raise AppError(f"Ya existe un punto de emisión con el código '{datos.codigo}' en este establecimiento.", 400, "VAL_ERROR")
            raise e

    def eliminar_punto(self, punto_id: UUID, usuario_actual: dict):
        self.obtener_punto(punto_id, usuario_actual)
        if not self.repo.eliminar_punto(punto_id):
            raise AppError("Error al eliminar punto de emisión", 500, "DB_ERROR")
        return True

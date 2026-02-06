from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import logging

from .repository import RepositorioPuntosEmision
from .schemas import PuntoEmisionCreacion, PuntoEmisionActualizacion
from ..establecimientos.service import ServicioEstablecimientos
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

# Configurar logger
logger = logging.getLogger("facturacion_api")

class ServicioPuntosEmision:
    def __init__(
        self, 
        repo: RepositorioPuntosEmision = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends()
    ):
        self.repo = repo
        self.establecimiento_service = establecimiento_service

    def crear_punto(self, datos: PuntoEmisionCreacion, usuario_actual: dict):
        """
        Crear nuevo punto de emisión.
        - Código: Exactamente 3 dígitos (SRI 001-999) - validado en schema
        - secuencial_actual: Asignado automáticamente con valor 1 por la base de datos
        """
        # Validation of ownership via Establishment Service
        self.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)

        try:
            logger.info(f"[CREAR] Iniciando creación de punto emisión - Código: {datos.codigo}, Establecimiento: {datos.establecimiento_id}")
            
            nuevo = self.repo.crear_punto(datos.model_dump())
            if not nuevo:
                logger.error(f"[ERROR] Falló la creación del punto emisión - Código: {datos.codigo}")
                raise AppError("Error al crear el punto de emisión", 500, "DB_ERROR")
            
            logger.info(f"[ÉXITO] Punto de emisión creado - ID: {nuevo['id']}, Código: {nuevo['codigo']}")
            return nuevo
        except Exception as e:
            if "uq_punto_emision_establecimiento_codigo" in str(e):
                 logger.warning(f"[VALIDACIÓN] Código '{datos.codigo}' ya existe en establecimiento {datos.establecimiento_id}")
                 raise AppError(f"Ya existe un punto de emisión con el código '{datos.codigo}' en este establecimiento.", 400, "VAL_ERROR")
            logger.error(f"[ERROR] Excepción al crear punto emisión: {str(e)}")
            raise e

    def obtener_punto(self, punto_id: UUID, usuario_actual: dict):
        punto = self.repo.obtener_por_id(punto_id)
        if not punto:
            raise AppError("Punto de emisión no encontrado", 404, "PUNTO_EMISION_NOT_FOUND")
        
        # Verify permissions via Establishment ownership
        self.establecimiento_service.obtener_establecimiento(punto['establecimiento_id'], usuario_actual)
            
        return punto

    def listar_puntos(self, usuario_actual: dict, establecimiento_id: Optional[UUID] = None, limit: int = 100, offset: int = 0):
        if establecimiento_id:
            # Si especifica establecimiento_id, verificar que le pertenece y listar sus puntos
            self.establecimiento_service.obtener_establecimiento(establecimiento_id, usuario_actual)
            return self.repo.listar_puntos(establecimiento_id, limit, offset)
        else:
            # Si no especifica, obtener todos sus establecimientos y luego todos sus puntos
            establecimientos = self.establecimiento_service.listar_establecimientos(usuario_actual)
            if not establecimientos:
                return []
            
            # Listar todos los puntos de todos los establecimientos del usuario
            todos_puntos = []
            for est in establecimientos:
                puntos = self.repo.listar_puntos(est['id'], limit=10000, offset=0)  # Sin límite de página
                todos_puntos.extend(puntos)
            
            return todos_puntos[:limit] if limit else todos_puntos

    def actualizar_punto(self, punto_id: UUID, datos: PuntoEmisionActualizacion, usuario_actual: dict):
        current = self.obtener_punto(punto_id, usuario_actual)
        
        if datos.establecimiento_id and str(datos.establecimiento_id) != str(current['establecimiento_id']):
            self.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload: return self.repo.obtener_por_id(punto_id)
            
            logger.info(f"[ACTUALIZAR] Punto emisión {punto_id} - Cambios: {payload}")
            
            actualizado = self.repo.actualizar_punto(punto_id, payload)
            if not actualizado:
                 logger.error(f"[ERROR] Falló la actualización del punto {punto_id}")
                 raise AppError("Error al actualizar punto de emisión", 500, "DB_ERROR")
            
            logger.info(f"[ÉXITO] Punto de emisión actualizado - ID: {punto_id}")
            return actualizado
        except Exception as e:
            if "uq_punto_emision_establecimiento_codigo" in str(e):
                 logger.warning(f"[VALIDACIÓN] Código ya existe en establecimiento para punto {punto_id}")
                 raise AppError(f"Ya existe un punto de emisión con ese código en este establecimiento.", 400, "VAL_ERROR")
            logger.error(f"[ERROR] Excepción al actualizar punto: {str(e)}")
            raise e

    def eliminar_punto(self, punto_id: UUID, usuario_actual: dict):
        self.obtener_punto(punto_id, usuario_actual)
        if not self.repo.eliminar_punto(punto_id):
            raise AppError("Error al eliminar punto de emisión", 500, "DB_ERROR")
        return True

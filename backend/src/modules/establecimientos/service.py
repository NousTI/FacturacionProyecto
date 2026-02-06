from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import logging

from .repository import RepositorioEstablecimientos
from .schemas import EstablecimientoCreacion, EstablecimientoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.logger import setup_logger

# Configurar logger
logger = logging.getLogger("facturacion_api")

class ServicioEstablecimientos:
    def __init__(self, repo: RepositorioEstablecimientos = Depends()):
        self.repo = repo

    def crear_establecimiento(self, datos: EstablecimientoCreacion, usuario_actual: dict):
        """
        Crear un nuevo establecimiento.
        - Código: Exactamente 3 dígitos (SRI) - validado en schema
        - Dirección: Obligatoria - validado en schema
        
        Logs:
        - OPCIÓN A: Solo errores (quitar log info de éxito)
        - OPCIÓN B: Errores + éxito
        - OPCIÓN C: Errores + éxito + detalles (IDs, datos)
        """
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                logger.warning(f"[VALIDACIÓN] Superadmin intentó crear establecimiento sin especificar empresa_id")
                raise AppError("Superadmin debe especificar empresa_id", 400, "VAL_ERROR")
            target_empresa_id = datos.empresa_id
        else:
            user_empresa_id = usuario_actual.get("empresa_id")
            if datos.empresa_id and str(datos.empresa_id) != str(user_empresa_id):
                logger.warning(f"[VALIDACIÓN] Usuario {usuario_actual.get('id')} intentó crear establecimiento para empresa {datos.empresa_id}")
                raise AppError("No puede crear establecimientos para otra empresa", 403, "AUTH_FORBIDDEN")
            target_empresa_id = user_empresa_id

        try:
            # OPCIÓN C: Log detallado con datos
            logger.info(f"[CREAR] Iniciando creación de establecimiento - Código: {datos.codigo}, Empresa: {target_empresa_id}")
            
            nuevo = self.repo.crear_establecimiento(datos.model_dump(exclude_unset=True), target_empresa_id)
            if not nuevo:
                logger.error(f"[ERROR] Falló la creación del establecimiento - Código: {datos.codigo}")
                raise AppError("Error al crear el establecimiento", 500, "DB_ERROR")
            
            # OPCIÓN B y C: Log de éxito
            logger.info(f"[ÉXITO] Establecimiento creado - ID: {nuevo['id']}, Código: {nuevo['codigo']}")
            return nuevo
        except Exception as e:
            if "uq_establecimientos_empresa_codigo" in str(e) or "uq_establecimiento_empresa_codigo" in str(e):
                 logger.warning(f"[VALIDACIÓN] Código '{datos.codigo}' ya existe en empresa {target_empresa_id}")
                 raise AppError(f"Ya existe un establecimiento con el código '{datos.codigo}' en esta empresa.", 400, "VAL_ERROR")
            logger.error(f"[ERROR] Excepción al crear establecimiento: {str(e)}")
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

    def obtener_estadisticas(self, usuario_actual: dict):
        """Obtiene estadísticas de establecimientos para el usuario"""
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = None
        
        if not is_superadmin:
            target_empresa_id = usuario_actual.get("empresa_id")

        return self.repo.obtener_estadisticas(target_empresa_id)

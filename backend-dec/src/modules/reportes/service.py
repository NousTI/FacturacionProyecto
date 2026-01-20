from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioReportes
from .schemas import ReporteCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioReportes:
    def __init__(self, repo: RepositorioReportes = Depends()):
        self.repo = repo

    def crear_reporte(self, datos: ReporteCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        target_empresa_id = datos.empresa_id or usuario_actual.get('empresa_id')
        target_usuario_id = datos.usuario_id or usuario_actual.get('id')
        
        if not target_empresa_id: raise AppError("Contexto de empresa requerido", 400, "REPORTE_CONTEXT_MISSING")
        
        datos_dict = datos.model_dump()
        datos_dict['empresa_id'] = target_empresa_id
        datos_dict['usuario_id'] = target_usuario_id
        
        return self.repo.crear(datos_dict)

    def listar_reportes(self, usuario_actual: dict):
        empresa_id = None if usuario_actual.get(AuthKeys.IS_SUPERADMIN) else usuario_actual.get('empresa_id')
        return self.repo.listar(empresa_id)

    def obtener_reporte(self, id: UUID, usuario_actual: dict):
        reporte = self.repo.obtener_por_id(id)
        if not reporte: raise AppError("Reporte no encontrado", 404, "REPORTE_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(reporte['empresa_id']) != str(usuario_actual.get('empresa_id')):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return reporte

    def eliminar_reporte(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin puede eliminar reportes", 403, "AUTH_FORBIDDEN")
        return self.repo.eliminar(id)

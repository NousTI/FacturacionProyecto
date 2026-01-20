from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioProgramaciones
from .schemas import FacturaProgramadaCreacion, FacturaProgramadaActualizacion
from ..clientes.repository import RepositorioClientes
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioProgramaciones:
    def __init__(
        self, 
        repo: RepositorioProgramaciones = Depends(),
        cliente_repo: RepositorioClientes = Depends()
    ):
        self.repo = repo
        self.cliente_repo = cliente_repo

    def crear_programacion(self, datos: FacturaProgramadaCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        target_empresa_id = datos.empresa_id or usuario_actual.get('empresa_id')
        target_usuario_id = datos.usuario_id or usuario_actual.get('id')
        
        if not target_empresa_id: raise AppError("Contexto de empresa requerido", 400, "PROGRAMACION_CONTEXT_MISSING")
        
        # Validar cliente
        cliente = self.cliente_repo.obtener_por_id(datos.cliente_id)
        if not cliente: raise AppError("Cliente no encontrado", 404, "CLIENTE_NOT_FOUND")
        if str(cliente['empresa_id']) != str(target_empresa_id):
            raise AppError("Cliente no pertenece a la empresa", 400, "CLIENTE_DOMAIN_ERROR")
            
        datos_dict = datos.model_dump()
        datos_dict['usuario_id'] = target_usuario_id
        
        return self.repo.crear(datos_dict, target_empresa_id)

    def listar_programaciones(self, usuario_actual: dict):
        empresa_id = None if usuario_actual.get(AuthKeys.IS_SUPERADMIN) else usuario_actual.get('empresa_id')
        return self.repo.listar(empresa_id)

    def obtener_programacion(self, id: UUID, usuario_actual: dict):
        prog = self.repo.obtener_por_id(id)
        if not prog: raise AppError("Programación no encontrada", 404, "PROGRAMACION_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(prog['empresa_id']) != str(usuario_actual.get('empresa_id')):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        return prog

    def actualizar_programacion(self, id: UUID, datos: FacturaProgramadaActualizacion, usuario_actual: dict):
        prog = self.obtener_programacion(id, usuario_actual)
        
        datos_dict = datos.model_dump(exclude_unset=True)
        if datos.cliente_id:
            cliente = self.cliente_repo.obtener_por_id(datos.cliente_id)
            if not cliente or str(cliente['empresa_id']) != str(prog['empresa_id']):
                raise AppError("Cliente inválido", 400, "CLIENTE_INVALID")
                
        return self.repo.actualizar(id, datos_dict)

    def eliminar_programacion(self, id: UUID, usuario_actual: dict):
        self.obtener_programacion(id, usuario_actual)
        return self.repo.eliminar(id)

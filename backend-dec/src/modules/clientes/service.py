from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from psycopg2.errors import UniqueViolation

from .repository import RepositorioClientes
from .schemas import ClienteCreacion, ClienteActualizacion
from ..empresa.service import ServicioEmpresa
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioClientes:
    def __init__(self, repo: RepositorioClientes = Depends(), empresa_service: ServicioEmpresa = Depends()):
        self.repo = repo
        self.empresa_service = empresa_service

    def _validate_access(self, current_user: dict, target_empresa_id: UUID) -> None:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
        user_empresa_id = current_user.get("empresa_id")

        if is_superadmin:
            return
        
        if is_vendedor:
            # Reuses EmpresaService logic already migrated
            self.empresa_service.obtener_empresa(target_empresa_id, current_user)
            return

        if is_usuario:
            if str(target_empresa_id) != str(user_empresa_id):
                 raise AppError("No tienes acceso a recursos de esta empresa", 403, "AUTH_FORBIDDEN")
            return

        raise AppError("Rol no autorizado", 403, "AUTH_FORBIDDEN")

    def crear_cliente(self, datos: ClienteCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)

        if is_superadmin:
            if not datos.empresa_id:
                raise AppError("Superadmins deben especificar empresa_id", 400, "VAL_ERROR")
        else:
            if datos.empresa_id:
                 raise AppError("No tienes permisos para asignar manualmente la empresa", 403, "AUTH_FORBIDDEN")
            datos.empresa_id = usuario_actual.get("empresa_id")
            
        self._validate_access(usuario_actual, datos.empresa_id)

        try:
            nuevo = self.repo.crear_cliente(datos.model_dump())
            if not nuevo:
                 raise AppError("No se pudo crear el cliente", 400, "DB_ERROR")
            return nuevo
        except UniqueViolation:
            raise AppError("Ya existe un cliente con esa identificación para esta empresa", 409, "CLIENTE_EXISTS")

    def obtener_cliente(self, cliente_id: UUID, usuario_actual: dict):
        cliente = self.repo.obtener_por_id(cliente_id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404, "CLIENTE_NOT_FOUND")
        
        self._validate_access(usuario_actual, cliente['empresa_id'])
        return cliente

    def listar_clientes(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR, False)
        is_usuario = usuario_actual.get(AuthKeys.IS_USUARIO, False)
        user_empresa_id = usuario_actual.get("empresa_id")

        target_empresa_id = None

        if is_superadmin:
            target_empresa_id = empresa_id
        elif is_vendedor:
            if not empresa_id:
                 raise AppError("Vendedor debe especificar empresa_id", 400, "VAL_ERROR")
            self.empresa_service.obtener_empresa(empresa_id, usuario_actual)
            target_empresa_id = empresa_id
        elif is_usuario:
            target_empresa_id = user_empresa_id
        else:
             raise AppError("Rol no autorizado", 403, "AUTH_FORBIDDEN")

        return self.repo.listar_clientes(target_empresa_id)

    def actualizar_cliente(self, cliente_id: UUID, datos: ClienteActualizacion, usuario_actual: dict):
        self.obtener_cliente(cliente_id, usuario_actual)
        payload = datos.model_dump(exclude_unset=True)
        
        if not payload:
             return self.repo.obtener_por_id(cliente_id)
             
        try:
            updated = self.repo.actualizar_cliente(cliente_id, payload)
            if not updated:
                raise AppError("Error al actualizar cliente", 500, "DB_ERROR")
            return updated
        except UniqueViolation:
             raise AppError("Ya existe otro cliente con esa identificación", 409, "CLIENTE_EXISTS")

    def eliminar_cliente(self, cliente_id: UUID, usuario_actual: dict):
        self.obtener_cliente(cliente_id, usuario_actual)
        if not self.repo.eliminar_cliente(cliente_id):
            raise AppError("Error al eliminar cliente", 500, "DB_ERROR")
        return True

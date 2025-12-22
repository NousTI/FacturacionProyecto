from fastapi import Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional

from repositories.cliente_repository import ClienteRepository
from services.empresa_service import EmpresaService
from models.Cliente import ClienteCreate, ClienteUpdate
from utils.responses import error_response
from utils.enums import AuthKeys
from psycopg2.errors import UniqueViolation

class ClienteService:
    def __init__(self, repository: ClienteRepository = Depends(), empresa_service: EmpresaService = Depends()):
        self.repository = repository
        self.empresa_service = empresa_service

    def _validate_access(self, current_user: dict, target_empresa_id: UUID) -> None:
        """
        Validates if the current_user has access to the target_empresa_id.
        Raises HTTPException if not authorized.
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
        user_id = current_user.get("id")
        user_empresa_id = current_user.get("empresa_id")

        if is_superadmin:
            return # Access granted
        
        if is_vendedor:
            # Verify Vendedor owns the empresa
            self.empresa_service.get_empresa(target_empresa_id, user_id, is_superadmin=False)
            return

        if is_usuario:
            if str(target_empresa_id) != str(user_empresa_id):
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=error_response(status.HTTP_403_FORBIDDEN, "No tienes acceso a recursos de esta empresa")
                )
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_response(status.HTTP_403_FORBIDDEN, "Rol no autorizado")
        )

    def create_cliente(self, cliente: ClienteCreate, current_user: dict) -> dict:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)

        if is_superadmin:
            if not cliente.empresa_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Superadmins deben especificar empresa_id"
                )
        else:
            # For non-superadmins, if they send empresa_id, it is forbidden/ignored (user asked for forbidden message)
            if cliente.empresa_id:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No tienes permisos para asignar manualmente la empresa. Se asigna automáticamente."
                )
            # Auto-assign
            cliente.empresa_id = current_user.get("empresa_id")
            
        # Validate Access to the target empresa
        self._validate_access(current_user, cliente.empresa_id)

        try:
            new_cliente = self.repository.create_cliente(cliente.model_dump())
            if not new_cliente:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_response(status.HTTP_400_BAD_REQUEST, "No se pudo crear el cliente")
                )
            return new_cliente
        except UniqueViolation:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_response(status.HTTP_409_CONFLICT, "Ya existe un cliente con esa identificación para esta empresa")
            )
        except Exception as e:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error al crear cliente: {str(e)}")
            )

    def get_cliente(self, cliente_id: UUID, current_user: dict) -> dict:
        cliente = self.repository.get_cliente(cliente_id)
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
            )
        
        # Validate Access
        self._validate_access(current_user, cliente['empresa_id'])
        return cliente

    def list_clientes(self, current_user: dict, empresa_id: Optional[UUID] = None) -> List[dict]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
        user_empresa_id = current_user.get("empresa_id")
        user_id = current_user.get("id")

        target_empresa_id = None

        if is_superadmin:
            target_empresa_id = empresa_id # Can be None (list all) or specific
        elif is_vendedor:
            if not empresa_id:
                 raise HTTPException(status_code=400, detail="Vendedor debe especificar empresa_id")
            # Verify ownership
            self.empresa_service.get_empresa(empresa_id, user_id, is_superadmin=False)
            target_empresa_id = empresa_id
        elif is_usuario:
            target_empresa_id = user_empresa_id
        else:
             raise HTTPException(status_code=403, detail="Rol no autorizado")

        return self.repository.list_clientes(target_empresa_id)

    def update_cliente(self, cliente_id: UUID, cliente_update: ClienteUpdate, current_user: dict) -> dict:
        # Check existence and permission
        existing_cliente = self.get_cliente(cliente_id, current_user) # Logic encapsulated in get_cliente

        # Filter None
        update_data = {k: v for k, v in cliente_update.model_dump().items() if v is not None}
        
        if not update_data:
             return existing_cliente
             
        try:
            updated = self.repository.update_cliente(cliente_id, update_data)
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado o error al actualizar")
                )
            return updated
        except UniqueViolation:
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_response(status.HTTP_409_CONFLICT, "Ya existe otro cliente con esa identificación en esta empresa")
            )
        except Exception as e:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error al actualizar cliente: {str(e)}")
            )

    def delete_cliente(self, cliente_id: UUID, current_user: dict):
        # Check existence and permission
        self.get_cliente(cliente_id, current_user) # Logic encapsulated

        user_deleted = self.repository.delete_cliente(cliente_id)
        if not user_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
            )
        return True

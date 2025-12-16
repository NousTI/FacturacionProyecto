from fastapi import Depends, HTTPException, status
from uuid import UUID
from typing import List
from repositories.cliente_repository import ClienteRepository
from models.Cliente import ClienteCreate, ClienteUpdate
from utils.responses import error_response
from psycopg2.errors import UniqueViolation

class ClienteService:
    def __init__(self, repository: ClienteRepository = Depends()):
        self.repository = repository

    def create_cliente(self, cliente: ClienteCreate) -> dict:
        # Pydantic model dump
        cliente_dict = cliente.model_dump()
        
        # Possible check: user vs empresa logic handled in routes?
        # Or here? Let's check uniqueness first?
        # Actually repo will fail on constraints.
        
        try:
            new_cliente = self.repository.create_cliente(cliente_dict)
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
            # Handle other unexpected DB errors
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error al crear cliente: {str(e)}")
            )

    def get_cliente(self, cliente_id: UUID) -> dict:
        cliente = self.repository.get_cliente(cliente_id)
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
            )
        return cliente

    def list_clientes(self, empresa_id: UUID) -> List[dict]:
        return self.repository.list_clientes(empresa_id)

    def update_cliente(self, cliente_id: UUID, cliente_update: ClienteUpdate) -> dict:
        # Filter None
        update_data = {k: v for k, v in cliente_update.model_dump().items() if v is not None}
        
        if not update_data:
             # Nothing to update, return current
             return self.get_cliente(cliente_id)
             
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

    def delete_cliente(self, cliente_id: UUID):
        user_deleted = self.repository.delete_cliente(cliente_id)
        if not user_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
            )
        return True

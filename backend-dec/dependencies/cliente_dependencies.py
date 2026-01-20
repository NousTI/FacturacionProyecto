# backend/dependencies/cliente_dependencies.py

from fastapi import Depends, HTTPException, status
from services.cliente_service import ClienteService
from api.routes.auth_router import get_current_user
from utils.responses import error_response

def propietario_cliente(cliente_id: int, current_user: dict = Depends(get_current_user), cliente_service: ClienteService = Depends()):
    """
    Verifica que el cliente exista y que el usuario autenticado sea el propietario.
    """
    cliente = cliente_service.obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
        )
    
    return cliente

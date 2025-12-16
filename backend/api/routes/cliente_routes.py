from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from models.Cliente import ClienteCreate, ClienteRead, ClienteUpdate
from services.cliente_service import ClienteService
from services.empresa_service import EmpresaService
from dependencies.auth_dependencies import get_current_user, require_permission
from utils.constants import RoleKeys
from utils.responses import success_response, error_response

router = APIRouter()

@router.post("/", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente: ClienteCreate,
    current_user: dict = Depends(require_permission("CLIENTE_CREAR")),
    service: ClienteService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    # Determine context
    is_superadmin = current_user.get(RoleKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(RoleKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(RoleKeys.IS_USUARIO, False)
    user_empresa_id = current_user.get("empresa_id")
    user_id = current_user.get("id")

    # Validate Empresa Context
    if is_superadmin:
        # Superadmin can create for any empresa, no check needed on ownership
        pass
    elif is_vendedor:
        # Vendedor must own the empresa
        empresa_service.get_empresa(cliente.empresa_id, user_id, is_superadmin=False)
    elif is_usuario:
        # Regular User: Must enforce they create strictly for their own empresa
        if str(cliente.empresa_id) != str(user_empresa_id):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_response(status.HTTP_403_FORBIDDEN, "No puedes crear clientes para otra empresa")
            )
    else:
        # Fallback security
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_response(status.HTTP_403_FORBIDDEN, "Rol no autorizado")
        )
    
    return service.create_cliente(cliente)


@router.get("/", response_model=List[ClienteRead])
def list_clientes(
    empresa_id: Optional[UUID] = None,
    current_user: dict = Depends(require_permission("CLIENTE_VER")),
    service: ClienteService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    is_superadmin = current_user.get(RoleKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(RoleKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(RoleKeys.IS_USUARIO, False)
    user_empresa_id = current_user.get("empresa_id")
    user_id = current_user.get("id")

    target_empresa_id = None

    if is_superadmin:
        if empresa_id:
            target_empresa_id = empresa_id
        else:
            # Maybe list all globally? Or empty? Or require param?
            # For strictness, let's require param or return empty if not provided for now
            return [] 
    elif is_vendedor:
        if not empresa_id:
             raise HTTPException(status_code=400, detail="Vendedor debe especificar empresa_id")
        
        # Verify ownership
        empresa_service.get_empresa(empresa_id, user_id, is_superadmin=False)
        target_empresa_id = empresa_id
    elif is_usuario:
        # Regular User: Always their own empresa
        target_empresa_id = user_empresa_id
    else:
         raise HTTPException(status_code=403, detail="Rol no autorizado")
    
    if target_empresa_id:
        return service.list_clientes(target_empresa_id)
    return []


@router.get("/{cliente_id}", response_model=ClienteRead)
def get_cliente(
    cliente_id: UUID,
    current_user: dict = Depends(require_permission("CLIENTE_VER")),
    service: ClienteService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    cliente = service.get_cliente(cliente_id)
    
    is_superadmin = current_user.get(RoleKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(RoleKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(RoleKeys.IS_USUARIO, False)
    user_empresa_id = current_user.get("empresa_id")
    user_id = current_user.get("id")

    if is_superadmin:
        return cliente
    
    if is_vendedor:
        # Verify if cliente belongs to an empresa owned by vendedor
        empresa_service.get_empresa(cliente['empresa_id'], user_id, is_superadmin=False)
        return cliente

    if is_usuario:
        # Regular User
        if str(cliente['empresa_id']) != str(user_empresa_id):
            raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
        return cliente
        
    raise HTTPException(status_code=403, detail="Rol no autorizado")


@router.put("/{cliente_id}", response_model=ClienteRead)
def update_cliente(
    cliente_id: UUID,
    cliente_update: ClienteUpdate,
    current_user: dict = Depends(require_permission("CLIENTE_EDITAR")),
    service: ClienteService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    # Verify existence and access first (Reuse get logic essentially)
    cliente = service.get_cliente(cliente_id)
    
    is_superadmin = current_user.get(RoleKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(RoleKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(RoleKeys.IS_USUARIO, False)
    user_empresa_id = current_user.get("empresa_id")
    user_id = current_user.get("id")

    if is_superadmin:
        pass
    elif is_vendedor:
        empresa_service.get_empresa(cliente['empresa_id'], user_id, is_superadmin=False)
    elif is_usuario:
         if str(cliente['empresa_id']) != str(user_empresa_id):
            raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    else:
         raise HTTPException(status_code=403, detail="Rol no autorizado")

    return service.update_cliente(cliente_id, cliente_update)


@router.delete("/{cliente_id}")
def delete_cliente(
    cliente_id: UUID,
    current_user: dict = Depends(require_permission("CLIENTE_ELIMINAR")),
    service: ClienteService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    # Verify existence and access
    cliente = service.get_cliente(cliente_id)
    
    is_superadmin = current_user.get(RoleKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(RoleKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(RoleKeys.IS_USUARIO, False)
    user_empresa_id = current_user.get("empresa_id")
    user_id = current_user.get("id")

    if is_superadmin:
        pass
    elif is_vendedor:
        empresa_service.get_empresa(cliente['empresa_id'], user_id, is_superadmin=False)
    elif is_usuario:
         if str(cliente['empresa_id']) != str(user_empresa_id):
            raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    else:
         raise HTTPException(status_code=403, detail="Rol no autorizado")

    service.delete_cliente(cliente_id)
    return success_response("Cliente eliminado correctamente")

from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ClienteCreacion, ClienteLectura, ClienteActualizacion
from .service import ServicioClientes
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.post("/", response_model=ClienteLectura, status_code=status.HTTP_201_CREATED)
def crear_cliente(
    datos: ClienteCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTE_CREAR)),
    servicio: ServicioClientes = Depends()
):
    return servicio.crear_cliente(datos, usuario)

@router.get("/", response_model=List[ClienteLectura])
def listar_clientes(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTE_VER)),
    servicio: ServicioClientes = Depends()
):
    return servicio.listar_clientes(usuario, empresa_id)

@router.get("/{cliente_id}", response_model=ClienteLectura)
def obtener_cliente(
    cliente_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTE_VER)),
    servicio: ServicioClientes = Depends()
):
    return servicio.obtener_cliente(cliente_id, usuario)

@router.put("/{cliente_id}", response_model=ClienteLectura)
def actualizar_cliente(
    cliente_id: UUID,
    datos: ClienteActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTE_EDITAR)),
    servicio: ServicioClientes = Depends()
):
    return servicio.actualizar_cliente(cliente_id, datos, usuario)

@router.delete("/{cliente_id}")
def eliminar_cliente(
    cliente_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTE_ELIMINAR)),
    servicio: ServicioClientes = Depends()
):
    servicio.eliminar_cliente(cliente_id, usuario)
    return success_response(None, "Cliente eliminado correctamente")

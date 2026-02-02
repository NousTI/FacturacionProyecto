from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID

from .schemas import ClienteCreacion, ClienteLectura, ClienteStats, ClienteActualizacion, ClienteConTrazabilidad
from .services import ServicioClientes
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase
from ...utils.response import success_response

router = APIRouter(tags=["Clientes"], redirect_slashes=False)

@router.get("/stats", response_model=RespuestaBase[ClienteStats])
def obtener_stats(
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    stats = service.obtener_stats(usuario)
    return success_response(stats)

@router.get("", response_model=RespuestaBase[List[ClienteLectura]])
def listar_clientes(
    vendedor_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    clientes = service.listar_clientes(usuario, vendedor_id)
    return success_response(clientes)

@router.post("", response_model=RespuestaBase[ClienteLectura], status_code=201)
def crear_cliente(
    datos: ClienteCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    nuevo = service.crear_cliente(datos, usuario)
    return success_response(nuevo, "Cliente creado exitosamente. La contraseña temporal es 'password'.")

@router.delete("/{id}")
def eliminar_cliente(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    service.eliminar_cliente(id, usuario)
    return success_response(None, "Cliente eliminado correctamente")

@router.get("/{id}", response_model=RespuestaBase[ClienteConTrazabilidad])
def obtener_cliente_detalle(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    """Obtiene un cliente con información de trazabilidad de creación"""
    cliente = service.obtener_cliente_detalle(id, usuario)
    return success_response(cliente)

@router.put("/{id}", response_model=RespuestaBase[ClienteLectura])
def actualizar_cliente(
    id: UUID,
    datos: ClienteActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    """Actualiza un cliente (solo superadmin)"""
    cliente = service.actualizar_cliente(id, datos, usuario)
    return success_response(cliente, "Cliente actualizado exitosamente")

@router.patch("/{id}/toggle-status", response_model=RespuestaBase[ClienteLectura])
def toggle_status(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    """Activa/desactiva un cliente (solo superadmin)"""
    cliente = service.toggle_status_cliente(id, usuario)
    estado = "activado" if cliente['activo'] else "desactivado"
    return success_response(cliente, f"Cliente {estado} exitosamente")

@router.patch("/{id}/reasignar-empresa", response_model=RespuestaBase[ClienteLectura])
def reasignar_empresa(
    id: UUID,
    nueva_empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    service: ServicioClientes = Depends()
):
    """Reasigna un cliente a una nueva empresa (solo superadmin)"""
    cliente = service.reasignar_empresa_cliente(id, nueva_empresa_id, usuario)
    return success_response(cliente, "Cliente reasignado exitosamente")


from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import FacturaCreacion, FacturaLectura, FacturaActualizacion
from .schemas_detalle import FacturaDetalleLectura, FacturaDetalleCreacion, FacturaDetalleActualizacion
from .service import ServicioFacturas
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

# Services for specific actions
from ..formas_pago.service import ServicioFormasPago

router = APIRouter()

@router.post("/", response_model=FacturaLectura, status_code=status.HTTP_201_CREATED)
def crear_factura(
    datos: FacturaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_CREAR)),
    servicio: ServicioFacturas = Depends()
):
    return servicio.crear_factura(datos, usuario)

@router.get("/", response_model=List[FacturaLectura])
def listar_facturas(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_VER)),
    servicio: ServicioFacturas = Depends()
):
    return servicio.listar_facturas(usuario, empresa_id, limit, offset)

@router.get("/{id}", response_model=FacturaLectura)
def obtener_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_VER)),
    servicio: ServicioFacturas = Depends()
):
    return servicio.obtener_factura(id, usuario)

@router.put("/{id}", response_model=FacturaLectura)
def actualizar_factura(
    id: UUID,
    datos: FacturaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFacturas = Depends(),
    forma_pago_servicio: ServicioFormasPago = Depends()
):
    return servicio.actualizar_factura(id, datos, usuario, forma_pago_servicio)

@router.delete("/{id}")
def eliminar_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_ELIMINAR)),
    servicio: ServicioFacturas = Depends()
):
    servicio.eliminar_factura(id, usuario)
    return success_response(None, "Factura eliminada correctamente")

# --- Detalles ---

@router.get("/{factura_id}/detalles", response_model=List[FacturaDetalleLectura])
def listar_detalles(
    factura_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_VER)),
    servicio: ServicioFacturas = Depends()
):
    return servicio.listar_detalles(factura_id, usuario)

@router.post("/{factura_id}/detalles", response_model=FacturaDetalleLectura, status_code=status.HTTP_201_CREATED)
def agregar_detalle(
    factura_id: UUID,
    datos: FacturaDetalleCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFacturas = Depends()
):
    datos_dict = datos.model_dump()
    datos_dict['factura_id'] = factura_id
    return servicio.agregar_detalle(datos_dict, usuario)

@router.put("/detalles/{id}", response_model=FacturaDetalleLectura)
def actualizar_detalle(
    id: UUID,
    datos: FacturaDetalleActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFacturas = Depends()
):
    return servicio.actualizar_detalle(id, datos.model_dump(exclude_unset=True), usuario)

@router.delete("/detalles/{id}")
def eliminar_detalle(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFacturas = Depends()
):
    servicio.eliminar_detalle(id, usuario)
    return success_response(None, "Detalle eliminado correctamente")

# Legacy Send to SRI Endpoint
@router.post("/{id}/enviar-sri")
def enviar_a_sri(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_CREAR)),
):
    # This will be implemented in the SRI module
    return {"message": "Endpoint en migración (Modulo SRI pendiente)"}

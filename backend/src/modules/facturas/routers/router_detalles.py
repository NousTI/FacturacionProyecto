from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from ..schemas_detalle import FacturaDetalleLectura, FacturaDetalleCreacion, FacturaDetalleActualizacion
from ..services.service_factura_detalles import ServicioFacturaDetalles
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils.response import success_response

router = APIRouter()

@router.get("/{factura_id}/detalles", response_model=List[FacturaDetalleLectura])
def listar_detalles(
    factura_id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS])),
    servicio: ServicioFacturaDetalles = Depends()
):
    """Lista los detalles (líneas) de una factura."""
    return servicio.listar_detalles(factura_id, usuario)

@router.post("/{factura_id}/detalles", response_model=FacturaDetalleLectura, status_code=status.HTTP_201_CREATED)
def agregar_detalle(
    factura_id: UUID,
    datos: FacturaDetalleCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturaDetalles = Depends()
):
    """
    Agrega un detalle a la factura.
    
    **RESTRICCIÓN:** Solo en facturas BORRADOR.
    """
    datos_dict = datos.model_dump()
    datos_dict['factura_id'] = factura_id
    return servicio.agregar_detalle(datos_dict, usuario)

@router.put("/detalles/{id}", response_model=FacturaDetalleLectura)
def actualizar_detalle(
    id: UUID,
    datos: FacturaDetalleActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturaDetalles = Depends()
):
    """
    Actualiza un detalle de factura.
    
    **RESTRICCIÓN:** Solo en facturas BORRADOR.
    """
    return servicio.actualizar_detalle(id, datos.model_dump(exclude_unset=True), usuario)

@router.delete("/detalles/{id}")
def eliminar_detalle(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturaDetalles = Depends()
):
    """
    Elimina un detalle de factura.
    
    **RESTRICCIÓN:** Solo en facturas BORRADOR.
    """
    servicio.eliminar_detalle(id, usuario)
    return success_response(None, "Detalle eliminado correctamente")

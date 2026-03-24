from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from ..schemas_logs import LogPagoCreacion, ResumenPagos, LogPagoLectura
from ..services.service_pagos import ServicioPagos
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils.response import error_response

router = APIRouter()

@router.post("/{id}/pagos", status_code=status.HTTP_201_CREATED)
def registrar_pago(
    id: UUID,
    datos: LogPagoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioPagos = Depends()
):
    """
    Registra un pago o abono para la factura.
    
    Actualiza automáticamente el `estado_pago` a PARCIAL o PAGADO.
    """
    if datos.factura_id != id:
        return error_response("ID de factura no coincide", 400)
        
    return servicio.registrar_pago(datos, usuario)

@router.get("/{id}/pagos/resumen", response_model=ResumenPagos)
def obtener_resumen_pagos(
    id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS])),
    servicio: ServicioPagos = Depends()
):
    """Obtiene el resumen financiero de pagos (total, pagado, saldo)."""
    return servicio.obtener_resumen_pagos(id, usuario)

@router.get("/{id}/pagos", response_model=List[LogPagoLectura])
def listar_pagos(
    id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS])),
    servicio: ServicioPagos = Depends()
):
    """Lista el historial de todos los abonos realizados a la factura."""
    return servicio.listar_pagos(id, usuario)

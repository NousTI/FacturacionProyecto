from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .service import ServicioNotaCredito
from .schemas import (
    NotaCreditoLectura, 
    LogEmisionNCLectura, 
    AutorizacionSRINCLectura
)
from src.modules.autenticacion.routes import requerir_permiso
from src.constants.permissions import PermissionCodes
from src.utils.response import success_response

router = APIRouter()

@router.post("/anular-factura/{factura_id}", status_code=status.HTTP_201_CREATED)
def anular_factura_con_nc(
    factura_id: UUID,
    motivo: str = Query(..., min_length=1, max_length=300),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ANULAR)),
    servicio: ServicioNotaCredito = Depends()
):
    """
    Endpoint principal para anular una factura emitiendo una Nota de Crédito.
    """
    result = servicio.anular_factura_con_nc(factura_id, motivo, usuario)
    return success_response(result, "Proceso de anulación procesado con el SRI")

@router.post("/{id}/reintentar")
def reintentar_emision_nc(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ANULAR)),
    servicio: ServicioNotaCredito = Depends()
):
    """
    Reintenta el envío de una Nota de Crédito previamente fallida (estado DEVUELTA/ERROR).
    Mantiene el secuencial legal original del documento.
    """
    result = servicio.reintentar_emision_nc(id, usuario)
    return success_response(result, "Reintento de emisión procesado con el SRI")

@router.get("/{id}/consultar-sri")
def consultar_nc_sri(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_SRI)),
    servicio: ServicioNotaCredito = Depends()
):
    """
    Consulta en el SRI el estado de una Nota de Crédito usando su clave de acceso.
    Útil para actualizar estados cuando el SRI tarda en responder.
    """
    result = servicio.consultar_nc_sri(id, usuario)
    return success_response(result, "Consulta de estado procesada con el SRI")

@router.get("/", response_model=List[NotaCreditoLectura])
def listar_notas_credito(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioNotaCredito = Depends()
):
    """Lista todas las Notas de Crédito de la empresa."""
    empresa_id = usuario.get('empresa_id')
    return servicio.listar_por_empresa(empresa_id, limit, offset)

@router.get("/{id}")
def obtener_detalle_nc(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioNotaCredito = Depends()
):
    """Obtiene el detalle completo de una Nota de Crédito (incluye items, logs y autorización)."""
    return servicio.obtener_nc_completa(id)

@router.get("/{id}/logs", response_model=List[LogEmisionNCLectura])
def obtener_logs_nc(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioNotaCredito = Depends()
):
    """
    Obtiene el historial de intentos de emisión ante el SRI.
    Útil para auditoría técnica desde el frontend.
    """
    nc_completa = servicio.obtener_nc_completa(id)
    return nc_completa.get('logs', [])

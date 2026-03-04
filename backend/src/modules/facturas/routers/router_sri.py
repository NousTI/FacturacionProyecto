from fastapi import APIRouter, Depends, Query, Request, Response
from typing import Optional
from uuid import UUID

from ..services.service_autorizacion import ServicioAutorizacion
from ..services.service_factura import ServicioFactura
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils import pdf_generator

# Incluir sub-routers
router = APIRouter()

@router.post("/{id}/enviar-sri")
def enviar_a_sri(
    id: UUID,
    request: Request,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_SRI)),
    servicio: ServicioAutorizacion = Depends()
):
    # Enriquecer usuario con metadatos del request para auditoría técnica
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "desconocida"

    usuario['ip'] = ip
    usuario['user_agent'] = request.headers.get("user-agent", "desconocido")
    usuario['version_app'] = request.headers.get("x-app-version", "1.0.0")
    
    return servicio.emitir_sri(id, usuario)

@router.get("/{id}/consultar-sri")
def consultar_a_sri(
    id: UUID,
    request: Request,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_SRI)),
    servicio: ServicioAutorizacion = Depends()
):
    """Consulta el estado de una factura en el SRI."""
    # Enriquecer usuario con metadatos del request para auditoría técnica
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "desconocida"

    usuario['ip'] = ip
    usuario['user_agent'] = request.headers.get("user-agent", "desconocido")
    usuario['version_app'] = request.headers.get("x-app-version", "1.0.0")
    
    return servicio.consultar_sri(id, usuario)

@router.get("/{id}/pdf")
def descargar_pdf(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_DESCARGAR_PDF)),
    servicio: ServicioFactura = Depends()
):
    """
    Descarga el RIDE (Representación Impresa del Documento Electrónico).
    
    **Requiere permiso:** FACTURAS_DESCARGAR_PDF
    """
    # 1. Obtener datos completos (Factura + Detalles)
    factura = servicio.obtener_detalle_completo(id, usuario)
    
    # 2. Generar el binario del PDF usando el utilitario
    pdf_buffer = pdf_generator.crear_ride_factura(factura)
    
    # 3. Retornar el archivo binario
    filename = f"Factura-{factura.get('numero_factura') or str(id)[:8]}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.post("/{id}/enviar-email")
def enviar_por_email(
    id: UUID,
    email_destino: Optional[str] = Query(None, description="Email destino (usa el del cliente si no se especifica)"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_EMAIL)),
    servicio: ServicioFactura = Depends()
):
    """
    Envía la factura por email al cliente.
    
    Adjunta:
    - PDF del RIDE
    - XML autorizado
    
    **Requiere permiso:** FACTURAS_ENVIAR_EMAIL
    """
    # Validar que tiene acceso a la factura
    servicio.obtener_factura(id, usuario)
    # TODO: Implementar envío de email con adjuntos
    return {
        "message": "Endpoint en desarrollo (Envío email pendiente)", 
        "factura_id": id,
        "email_destino": email_destino
    }

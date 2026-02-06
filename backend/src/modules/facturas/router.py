"""
Router de Facturas.

Endpoints para gestión de facturas electrónicas según normativas SRI Ecuador.

PERMISOS:
- FACTURAS_VER_TODAS: Ver todas las facturas de la empresa
- FACTURAS_VER_PROPIAS: Ver solo mis facturas
- FACTURAS_CREAR: Crear nuevas facturas
- FACTURAS_EDITAR: Editar facturas en BORRADOR
- FACTURAS_ANULAR: Anular facturas EMITIDAS
- FACTURAS_ENVIAR_SRI: Enviar al SRI
- FACTURAS_DESCARGAR_PDF: Descargar RIDE en PDF
- FACTURAS_ENVIAR_EMAIL: Enviar factura por email
"""

from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID
from datetime import date

from .schemas import (
    FacturaCreacion,
    FacturaLectura,
    FacturaActualizacion,
    FacturaAnulacion,
    FacturaResumen,
    FacturaListadoFiltros
)
from .schemas_detalle import FacturaDetalleLectura, FacturaDetalleCreacion, FacturaDetalleActualizacion
from .service import ServicioFacturas
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

# Services for specific actions
from ..formas_pago.service import ServicioFormasPago

router = APIRouter()


# =================================================================
# ENDPOINTS DE FACTURAS
# =================================================================

@router.post("/", response_model=FacturaLectura, status_code=status.HTTP_201_CREATED)
def crear_factura(
    datos: FacturaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioFacturas = Depends()
):
    """
    Crea una nueva factura en estado BORRADOR.
    
    La factura se crea con snapshots inmutables de:
    - Empresa emisora
    - Cliente receptor
    - Establecimiento
    - Punto de emisión
    - Usuario que crea
    
    **Requiere permiso:** FACTURAS_CREAR
    """
    return servicio.crear_factura(datos, usuario)


@router.get("/", response_model=List[FacturaLectura])
def listar_facturas(
    limit: int = Query(100, ge=1, le=500, description="Máximo de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginación"),
    empresa_id: Optional[UUID] = Query(None, description="Filtrar por empresa (solo SUPERADMIN)"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: BORRADOR|EMITIDA|ANULADA"),
    estado_pago: Optional[str] = Query(None, description="Filtrar por estado pago: PENDIENTE|PAGADO|PARCIAL|VENCIDO"),
    fecha_desde: Optional[date] = Query(None, description="Fecha de emisión desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha de emisión hasta"),
    cliente_id: Optional[UUID] = Query(None, description="Filtrar por cliente"),
    establecimiento_id: Optional[UUID] = Query(None, description="Filtrar por establecimiento"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioFacturas = Depends()
):
    """
    Lista todas las facturas de la empresa.
    
    **Requiere permiso:** FACTURAS_VER_TODAS
    
    SUPERADMIN puede filtrar por empresa_id.
    """
    filtros = FacturaListadoFiltros(
        estado=estado,
        estado_pago=estado_pago,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        cliente_id=cliente_id,
        establecimiento_id=establecimiento_id
    ) if any([estado, estado_pago, fecha_desde, fecha_hasta, cliente_id, establecimiento_id]) else None
    
    return servicio.listar_facturas(
        usuario_actual=usuario,
        empresa_id=empresa_id,
        filtros=filtros,
        solo_propias=False,
        limit=limit,
        offset=offset
    )


@router.get("/mis-facturas", response_model=List[FacturaLectura])
def listar_mis_facturas(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    estado: Optional[str] = Query(None),
    estado_pago: Optional[str] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_PROPIAS)),
    servicio: ServicioFacturas = Depends()
):
    """
    Lista solo las facturas creadas por el usuario actual.
    
    **Requiere permiso:** FACTURAS_VER_PROPIAS
    """
    filtros = FacturaListadoFiltros(
        estado=estado,
        estado_pago=estado_pago,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        solo_propias=True
    ) if any([estado, estado_pago, fecha_desde, fecha_hasta]) else None
    
    return servicio.listar_facturas(
        usuario_actual=usuario,
        filtros=filtros,
        solo_propias=True,
        limit=limit,
        offset=offset
    )


@router.get("/{id}", response_model=FacturaLectura)
def obtener_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioFacturas = Depends()
):
    """
    Obtiene una factura por ID con todos sus snapshots.
    
    **Requiere permiso:** FACTURAS_VER_TODAS o FACTURAS_VER_PROPIAS
    """
    return servicio.obtener_factura(id, usuario)


@router.put("/{id}", response_model=FacturaLectura)
def actualizar_factura(
    id: UUID,
    datos: FacturaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturas = Depends()
):
    """
    Actualiza una factura.
    
    **RESTRICCIÓN LEGAL:** Solo facturas en estado BORRADOR pueden actualizarse.
    
    **Requiere permiso:** FACTURAS_EDITAR
    """
    return servicio.actualizar_factura(id, datos, usuario)


@router.post("/{id}/anular", response_model=FacturaLectura)
def anular_factura(
    id: UUID,
    datos: FacturaAnulacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ANULAR)),
    servicio: ServicioFacturas = Depends()
):
    """
    Anula una factura emitida.
    
    **RESTRICCIONES LEGALES:**
    - Solo facturas EMITIDAS pueden anularse
    - Facturas en BORRADOR deben eliminarse (DELETE)
    - La razón de anulación es obligatoria (mín. 10 caracteres)
    
    **Requiere permiso:** FACTURAS_ANULAR
    """
    return servicio.anular_factura(id, datos, usuario)


@router.delete("/{id}")
def eliminar_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturas = Depends()
):
    """
    Elimina una factura.
    
    **RESTRICCIÓN LEGAL:** Solo facturas en estado BORRADOR pueden eliminarse.
    Las facturas EMITIDAS deben anularse.
    
    **Requiere permiso:** FACTURAS_EDITAR
    """
    servicio.eliminar_factura(id, usuario)
    return success_response(None, "Factura eliminada correctamente")


# =================================================================
# ENDPOINTS SRI
# =================================================================

@router.post("/{id}/enviar-sri")
def enviar_a_sri(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_SRI)),
    servicio: ServicioFacturas = Depends()
):
    """
    Envía la factura al SRI para autorización.
    
    FLUJO:
    1. Valida que la factura esté en BORRADOR
    2. Genera clave de acceso (49 dígitos)
    3. Genera XML según especificaciones SRI
    4. Firma XML con certificado .p12
    5. Envía a WebService SRI
    6. Actualiza estado según respuesta
    
    **Requiere permiso:** FACTURAS_ENVIAR_SRI
    """
    # TODO: Implementar integración SRI
    return {"message": "Endpoint en desarrollo (Módulo SRI pendiente)"}


@router.get("/{id}/pdf")
def descargar_pdf(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_DESCARGAR_PDF)),
    servicio: ServicioFacturas = Depends()
):
    """
    Descarga el RIDE (Representación Impresa del Documento Electrónico).
    
    **Requiere permiso:** FACTURAS_DESCARGAR_PDF
    """
    # Validar que tiene acceso a la factura
    servicio.obtener_factura(id, usuario)
    # TODO: Implementar generación de PDF
    return {"message": "Endpoint en desarrollo (Generación PDF pendiente)"}


@router.post("/{id}/enviar-email")
def enviar_por_email(
    id: UUID,
    email_destino: Optional[str] = Query(None, description="Email destino (usa el del cliente si no se especifica)"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ENVIAR_EMAIL)),
    servicio: ServicioFacturas = Depends()
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
    # TODO: Implementar envío de email
    return {"message": "Endpoint en desarrollo (Envío email pendiente)"}


# =================================================================
# ENDPOINTS DE DETALLES
# =================================================================

@router.get("/{factura_id}/detalles", response_model=List[FacturaDetalleLectura])
def listar_detalles(
    factura_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioFacturas = Depends()
):
    """Lista los detalles (líneas) de una factura."""
    return servicio.listar_detalles(factura_id, usuario)


@router.post("/{factura_id}/detalles", response_model=FacturaDetalleLectura, status_code=status.HTTP_201_CREATED)
def agregar_detalle(
    factura_id: UUID,
    datos: FacturaDetalleCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFacturas = Depends()
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
    servicio: ServicioFacturas = Depends()
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
    servicio: ServicioFacturas = Depends()
):
    """
    Elimina un detalle de factura.
    
    **RESTRICCIÓN:** Solo en facturas BORRADOR.
    """
    servicio.eliminar_detalle(id, usuario)
    return success_response(None, "Detalle eliminado correctamente")

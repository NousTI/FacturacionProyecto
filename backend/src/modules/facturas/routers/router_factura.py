from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID
from datetime import date

from ..schemas import (
    FacturaCreacion,
    FacturaLectura,
    FacturaActualizacion,
    FacturaAnulacion,
    FacturaUpdateEstadoPago,
    FacturaListadoFiltros
)
from ..services.service_factura import ServicioFactura
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils.response import success_response

router = APIRouter()

@router.post("/", response_model=FacturaLectura, status_code=status.HTTP_201_CREATED)
def crear_factura(
    datos: FacturaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioFactura = Depends()
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
    print(f"--- [API] POST /facturas received ---")
    print(f"Payload: {datos.dict()}")
    print(f"Usuario requesting: {usuario.get('username', 'Unknown')}")
    
    result = servicio.crear_factura(datos, usuario)
    
    print(f"--- [API] Factura creada exitosamente. ID: {result['id']}, Numero: {result['numero_factura']} ---")
    return result

@router.get("/", response_model=List[FacturaLectura])
def listar_facturas(
    limit: int = Query(100, ge=1, le=500, description="Máximo de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginación"),
    empresa_id: Optional[UUID] = Query(None, description="Filtrar por empresa (solo SUPERADMIN)"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: BORRADOR|AUTORIZADA|ANULADA"),
    estado_pago: Optional[str] = Query(None, description="Filtrar por estado pago: PENDIENTE|PAGADO|PARCIAL|VENCIDO"),
    fecha_desde: Optional[date] = Query(None, description="Fecha de emisión desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha de emisión hasta"),
    cliente_id: Optional[UUID] = Query(None, description="Filtrar por cliente"),
    establecimiento_id: Optional[UUID] = Query(None, description="Filtrar por establecimiento"),
    usuario: dict = Depends(requerir_permiso([PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS])),
    servicio: ServicioFactura = Depends()
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
    servicio: ServicioFactura = Depends()
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
    usuario: dict = Depends(requerir_permiso([PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_VER, PermissionCodes.FACTURA_PROGRAMADA_VER_PROPIAS])),
    servicio: ServicioFactura = Depends()
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
    servicio: ServicioFactura = Depends()
):
    """
    Actualiza una factura.
    
    **RESTRICCIÓN LEGAL:** Solo facturas en estado BORRADOR pueden actualizarse.
    
    **Requiere permiso:** FACTURAS_EDITAR
    """
    print(f"--- [API] PUT /facturas/{id} received ---")
    print(f"Payload update: {datos.dict(exclude_unset=True)}")
    
    result = servicio.actualizar_factura(id, datos, usuario)
    print(f"--- [API] Factura {id} actualizada ---")
    return result

@router.post("/{id}/anular", response_model=FacturaLectura)
def anular_factura(
    id: UUID,
    datos: FacturaAnulacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_ANULAR)),
    servicio: ServicioFactura = Depends()
):
    """
    Anula una factura emitida.
    
    **RESTRICCIONES LEGALES:**
    - Solo facturas AUTORIZADAS pueden anularse
    - Facturas en BORRADOR deben eliminarse (DELETE)
    - La razón de anulación es obligatoria (mín. 10 caracteres)
    
    **Requiere permiso:** FACTURAS_ANULAR
    """
    return servicio.anular_factura(id, datos, usuario)
    
@router.patch("/{id}/estado-pago", response_model=FacturaLectura)
def actualizar_estado_pago(
    id: UUID,
    datos: FacturaUpdateEstadoPago,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFactura = Depends()
):
    """
    Actualiza el estado de pago de una factura de forma directa.
    
    **Requiere permiso:** FACTURAS_EDITAR
    """
    return servicio.actualizar_estado_pago(id, datos.estado_pago, usuario)

@router.delete("/{id}")
def eliminar_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioFactura = Depends()
):
    """
    Elimina una factura.
    
    **RESTRICCIÓN LEGAL:** Solo facturas en estado BORRADOR pueden eliminarse.
    Las facturas AUTORIZADAS deben anularse.
    
    **Requiere permiso:** FACTURAS_EDITAR
    """
    servicio.eliminar_factura(id, usuario)
    return success_response(None, "Factura eliminada correctamente")

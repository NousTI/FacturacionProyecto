from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import (
    CuentaCobrarCreacion, CuentaCobrarLectura,
    CuentaCobrarActualizacion, CuentasCobrarOverview,
    AntiguedadCliente, ClienteMoroso, HistorialPago, ProyeccionCobro
)
from .service import ServicioCuentasCobrar
from ..autenticacion.routes import get_current_user, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.response import success_response
from datetime import date

# Dependency Repos for validation
from ..facturas.repository import RepositorioFacturas
from ..clientes.repository import RepositorioClientes

router = APIRouter()


@router.get("/resumen", response_model=CuentasCobrarOverview)
def obtener_resumen_cuentas_cobrar(
    fecha_corte: Optional[date] = Query(None),
    estado: Optional[str] = Query(None),
    cliente_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    """Obtiene el reporte consolidado de Cuentas por Cobrar (Aging Report)."""
    return servicio.obtener_overview(usuario, fecha_corte, estado, cliente_id)

@router.get("/antiguedad-clientes", response_model=List[AntiguedadCliente])
def obtener_antiguedad_clientes(
    fecha_corte: Optional[date] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    """R-009: Análisis de antigüedad detallado por cliente."""
    return servicio.obtener_antiguedad_por_cliente(usuario, fecha_corte)

@router.get("/morosos", response_model=List[ClienteMoroso])
def obtener_clientes_morosos(
    dias_mora: int = Query(1, ge=1),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    """R-010: Listado de clientes con facturas vencidas y datos de contacto."""
    return servicio.obtener_clientes_morosos(usuario, dias_mora)

@router.get("/pagos", response_model=List[HistorialPago])
def obtener_historial_pagos(
    inicio: Optional[date] = Query(None),
    fin: Optional[date] = Query(None),
    cliente_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    """R-011: Historial detallado de pagos recibidos."""
    return servicio.obtener_historial_pagos(usuario, inicio, fin, cliente_id)

@router.get("/proyeccion", response_model=List[ProyeccionCobro])
def obtener_proyeccion_cobros(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    """R-012: Proyección de cobros futuros por mes de vencimiento."""
    return servicio.obtener_proyeccion(usuario)

@router.post("/", response_model=CuentaCobrarLectura, status_code=status.HTTP_201_CREATED)
def crear_cuenta_cobrar(
    datos: CuentaCobrarCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_FACTURA_CREAR)),
    servicio: ServicioCuentasCobrar = Depends(),
    factura_repo: RepositorioFacturas = Depends(),
    cliente_repo: RepositorioClientes = Depends()
):
    return servicio.crear_cuenta(datos, usuario, factura_repo, cliente_repo)

@router.get("/", response_model=List[CuentaCobrarLectura])
def listar_cuentas_cobrar(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    cliente_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.listar_cuentas(usuario, empresa_id, cliente_id, limit, offset)

@router.get("/{id}", response_model=CuentaCobrarLectura)
def obtener_cuenta_cobrar(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.obtener_cuenta(id, usuario)

@router.put("/{id}", response_model=CuentaCobrarLectura)
def actualizar_cuenta_cobrar(
    id: UUID,
    datos: CuentaCobrarActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.actualizar_cuenta(id, datos, usuario)

@router.delete("/{id}")
def eliminar_cuenta_cobrar(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_VER)),
    servicio: ServicioCuentasCobrar = Depends()
):
    servicio.eliminar_cuenta(id, usuario)
    return success_response(None, "Cuenta por Cobrar eliminada correctamente")

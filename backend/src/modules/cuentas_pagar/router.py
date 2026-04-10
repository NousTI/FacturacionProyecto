from fastapi import APIRouter, Depends, Query
from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID

from .schemas import (
    CuentasPagarOverview, ReporteGastosCategoria, 
    GastoProveedorDetalle, ReporteFlujoCaja
)
from .service import ServicioCuentasPagar
from ..autenticacion.routes import get_current_user, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

router = APIRouter()


@router.get("/resumen", response_model=CuentasPagarOverview)
def obtener_resumen(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_PAGAR_VER)),
    servicio: ServicioCuentasPagar = Depends()
):
    """R-013: Resumen de Cuentas por Pagar."""
    empresa_id = usuario.get('empresa_id')
    return servicio.obtener_resumen(empresa_id)

@router.get("/por-categoria", response_model=ReporteGastosCategoria)
def obtener_gastos_por_categoria(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_PAGAR_VER)),
    servicio: ServicioCuentasPagar = Depends()
):
    """R-014: Análisis de gastos por categoría."""
    empresa_id = usuario.get('empresa_id')
    fin = fecha_fin or date.today()
    inicio = fecha_inicio or (fin - timedelta(days=30))
    return servicio.obtener_gastos_por_categoria(empresa_id, inicio, fin)

@router.get("/por-proveedor", response_model=List[GastoProveedorDetalle])
def obtener_gastos_por_proveedor(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_PAGAR_VER)),
    servicio: ServicioCuentasPagar = Depends()
):
    """R-015: Top compras por proveedor."""
    empresa_id = usuario.get('empresa_id')
    fin = fecha_fin or date.today()
    inicio = fecha_inicio or (fin - timedelta(days=30))
    return servicio.obtener_gastos_por_proveedor(empresa_id, inicio, fin)

@router.get("/flujo-caja", response_model=ReporteFlujoCaja)
def obtener_flujo_caja(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    agrupacion: str = 'week', # day, week, month
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_PAGAR_VER)),
    servicio: ServicioCuentasPagar = Depends()
):
    """R-016: Flujo de Caja (Cach Flow)."""
    empresa_id = usuario.get('empresa_id')
    fin = fecha_fin or date.today()
    inicio = fecha_inicio or (fin - timedelta(days=90)) # Default 3 meses para flujo de caja
    return servicio.obtener_flujo_caja(empresa_id, inicio, fin, agrupacion)

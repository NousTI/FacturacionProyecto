from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import (
    CuentaCobrarCreacion, CuentaCobrarLectura,
    CuentaCobrarActualizacion, CuentasCobrarOverview
)
from .service import ServicioCuentasCobrar
from ..autenticacion.routes import get_current_user
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.response import success_response
from datetime import date

# Dependency Repos for validation
from ..facturas.repository import RepositorioFacturas
from ..clientes.repositories import RepositorioClientes

router = APIRouter()

def requerir_admin_empresa(usuario: dict = Depends(get_current_user)):
    """
    Restringe el acceso al módulo de Cuentas por Cobrar únicamente a:
    1. Súper Administradores de la plataforma.
    2. Administradores de la empresa (rol_codigo = ADMIN).
    """
    if usuario.get(AuthKeys.IS_SUPERADMIN):
        return usuario
    
    rol_codigo = str(usuario.get("rol_codigo") or "").upper()
    if rol_codigo == "ADMIN" or rol_codigo.startswith("ADMIN_"):
        return usuario
        
    raise AppError(
        message="Acceso restringido. Solo el Administrador de la empresa puede gestionar Cuentas por Cobrar.",
        status_code=403,
        code="FORBIDDEN_ACCESS"
    )

@router.get("/resumen", response_model=CuentasCobrarOverview)
def obtener_resumen_cuentas_cobrar(
    fecha_corte: Optional[date] = Query(None),
    estado: Optional[str] = Query(None),
    cliente_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_admin_empresa),
    servicio: ServicioCuentasCobrar = Depends()
):
    """Obtiene el reporte consolidado de Cuentas por Cobrar (Aging Report)."""
    return servicio.obtener_overview(usuario, fecha_corte, estado, cliente_id)

@router.post("/", response_model=CuentaCobrarLectura, status_code=status.HTTP_201_CREATED)
def crear_cuenta_cobrar(
    datos: CuentaCobrarCreacion,
    usuario: dict = Depends(requerir_admin_empresa),
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
    usuario: dict = Depends(requerir_admin_empresa),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.listar_cuentas(usuario, empresa_id, cliente_id, limit, offset)

@router.get("/{id}", response_model=CuentaCobrarLectura)
def obtener_cuenta_cobrar(
    id: UUID,
    usuario: dict = Depends(requerir_admin_empresa),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.obtener_cuenta(id, usuario)

@router.put("/{id}", response_model=CuentaCobrarLectura)
def actualizar_cuenta_cobrar(
    id: UUID,
    datos: CuentaCobrarActualizacion,
    usuario: dict = Depends(requerir_admin_empresa),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.actualizar_cuenta(id, datos, usuario)

@router.delete("/{id}")
def eliminar_cuenta_cobrar(
    id: UUID,
    usuario: dict = Depends(requerir_admin_empresa),
    servicio: ServicioCuentasCobrar = Depends()
):
    servicio.eliminar_cuenta(id, usuario)
    return success_response(None, "Cuenta por Cobrar eliminada correctamente")

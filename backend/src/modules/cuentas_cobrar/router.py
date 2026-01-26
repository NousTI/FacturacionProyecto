from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import CuentaCobrarCreacion, CuentaCobrarLectura, CuentaCobrarActualizacion
from .service import ServicioCuentasCobrar
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

# Dependency Repos for validation
from ..facturas.repository import RepositorioFacturas
from ..clientes.repository import RepositorioClientes

router = APIRouter()

@router.post("/", response_model=CuentaCobrarLectura, status_code=status.HTTP_201_CREATED)
def crear_cuenta_cobrar(
    datos: CuentaCobrarCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_CREAR)),
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
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_EDITAR)),
    servicio: ServicioCuentasCobrar = Depends()
):
    return servicio.actualizar_cuenta(id, datos, usuario)

@router.delete("/{id}")
def eliminar_cuenta_cobrar(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CUENTA_COBRAR_ELIMINAR)),
    servicio: ServicioCuentasCobrar = Depends()
):
    servicio.eliminar_cuenta(id, usuario)
    return success_response(None, "Cuenta por Cobrar eliminada correctamente")

from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .schemas import FormaPagoCreacion, FormaPagoLectura, FormaPagoActualizacion
from .service import ServicioFormasPago
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

# Factura Repo for cross-module validation
# When Facturas module is ready, we will import its Repositorio
from ..facturas.repository import RepositorioFacturas

router = APIRouter()

@router.post("/facturas/{factura_id}/pagos", response_model=FormaPagoLectura, status_code=status.HTTP_201_CREATED)
def agregar_pago(
    factura_id: UUID,
    datos: FormaPagoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFormasPago = Depends(),
    factura_repo: RepositorioFacturas = Depends()
):
    datos.factura_id = factura_id
    return servicio.crear_pago(datos, usuario, factura_repo)

@router.get("/facturas/{factura_id}/pagos", response_model=List[FormaPagoLectura])
def listar_pagos(
    factura_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_VER)),
    servicio: ServicioFormasPago = Depends(),
    factura_repo: RepositorioFacturas = Depends()
):
    return servicio.listar_por_factura(factura_id, usuario, factura_repo)

@router.put("/pagos/{id}", response_model=FormaPagoLectura)
def actualizar_pago(
    id: UUID,
    datos: FormaPagoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFormasPago = Depends(),
    factura_repo: RepositorioFacturas = Depends()
):
    return servicio.actualizar_pago(id, datos, usuario, factura_repo)

@router.delete("/pagos/{id}")
def eliminar_pago(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_EDITAR)),
    servicio: ServicioFormasPago = Depends(),
    factura_repo: RepositorioFacturas = Depends()
):
    servicio.eliminar_pago(id, usuario, factura_repo)
    return success_response(None, "Forma de pago eliminada correctamente")

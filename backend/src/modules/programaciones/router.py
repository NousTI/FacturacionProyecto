from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioProgramaciones
from .schemas import FacturaProgramadaLectura, FacturaProgramadaCreacion, FacturaProgramadaActualizacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[FacturaProgramadaLectura])
def listar_programaciones(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_PROGRAMADA_VER)),
    servicio: ServicioProgramaciones = Depends()
):
    return servicio.listar_programaciones(usuario)

@router.post("/", response_model=FacturaProgramadaLectura, status_code=status.HTTP_201_CREATED)
def crear_programacion(
    datos: FacturaProgramadaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_PROGRAMADA_CREAR)),
    servicio: ServicioProgramaciones = Depends()
):
    return servicio.crear_programacion(datos, usuario)

@router.put("/{id}", response_model=FacturaProgramadaLectura)
def actualizar_programacion(
    id: UUID,
    datos: FacturaProgramadaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_PROGRAMADA_EDITAR)),
    servicio: ServicioProgramaciones = Depends()
):
    return servicio.actualizar_programacion(id, datos, usuario)

@router.delete("/{id}")
def eliminar_programacion(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_PROGRAMADA_ELIMINAR)),
    servicio: ServicioProgramaciones = Depends()
):
    servicio.eliminar_programacion(id, usuario)
    return {"message": "Programación eliminada correctamente"}

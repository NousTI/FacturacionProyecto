from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioComisiones
from .schemas import ComisionRead, ComisionCreacion, ComisionActualizacion
from ..autenticacion.dependencies import obtener_usuario_actual

router = APIRouter()

@router.get("/", response_model=List[ComisionRead])
def listar_comisiones(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioComisiones = Depends()
):
    return servicio.listar_comisiones(usuario)

@router.get("/{id}", response_model=ComisionRead)
def obtener_comision(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioComisiones = Depends()
):
    return servicio.obtener_comision(id, usuario)

@router.post("/", response_model=ComisionRead, status_code=status.HTTP_201_CREATED)
def crear_comision(
    datos: ComisionCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioComisiones = Depends()
):
    return servicio.crear_manual(datos, usuario)

@router.put("/{id}", response_model=ComisionRead)
def actualizar_comision(
    id: UUID,
    datos: ComisionActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioComisiones = Depends()
):
    return servicio.actualizar(id, datos, usuario)

@router.delete("/{id}")
def eliminar_comision(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioComisiones = Depends()
):
    servicio.eliminar(id, usuario)
    return {"message": "Comisión eliminada correctamente"}

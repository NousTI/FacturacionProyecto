from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID

from .schemas import ClienteCreacion, ClienteLectura, ClienteStats, ClienteActualizacion
from .controller import ClienteController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter(tags=["Clientes"], redirect_slashes=False)

@router.get("/stats", response_model=RespuestaBase[ClienteStats])
def obtener_stats(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.obtener_stats(usuario)

@router.get("", response_model=RespuestaBase[List[ClienteLectura]])
def listar_clientes(
    empresa_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.listar_clientes(usuario, empresa_id)

@router.post("", response_model=RespuestaBase[ClienteLectura], status_code=201)
def crear_cliente(
    datos: ClienteCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.crear_cliente(datos, usuario)

@router.get("/{id}", response_model=RespuestaBase[ClienteLectura])
def obtener_cliente(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.obtener_cliente(id, usuario)

@router.put("/{id}", response_model=RespuestaBase[ClienteLectura])
def actualizar_cliente(
    id: UUID,
    datos: ClienteActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.actualizar_cliente(id, datos, usuario)

@router.delete("/{id}")
def eliminar_cliente(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: ClienteController = Depends()
):
    return controller.eliminar_cliente(id, usuario)


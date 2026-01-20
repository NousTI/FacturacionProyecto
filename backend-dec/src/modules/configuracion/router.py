from fastapi import APIRouter, Depends, status
from typing import List
from .service import ServicioConfiguracion
from .schemas import ConfigLectura, ConfigActualizacion, FlagLectura, FlagActualizacion, CatalogoLectura, PlantillaLectura
from ..autenticacion.dependencies import requerir_superadmin

router = APIRouter()

# Todos estos endpoints requieren Superadmin

@router.get("/parametros", response_model=List[ConfigLectura])
def obtener_parametros(
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.listar_config()

@router.put("/parametros/{clave}")
def actualizar_parametro(
    clave: str,
    datos: ConfigActualizacion,
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.actualizar_config(clave, datos)

@router.get("/flags", response_model=List[FlagLectura])
def obtener_flags(
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.listar_flags()

@router.put("/flags/{codigo}")
def actualizar_flag(
    codigo: str,
    datos: FlagActualizacion,
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.actualizar_flag(codigo, datos)

@router.get("/catalogos", response_model=List[CatalogoLectura])
def obtener_catalogos(
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.listar_catalogos()

@router.get("/plantillas", response_model=List[PlantillaLectura])
def obtener_plantillas(
    servicio: ServicioConfiguracion = Depends(),
    _ = Depends(requerir_superadmin)
):
    return servicio.listar_plantillas()

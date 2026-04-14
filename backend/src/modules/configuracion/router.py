from fastapi import APIRouter, Depends, status
from typing import List
from .service import ServicioConfiguracion
from .schemas import ConfigLectura, ConfigActualizacion, FlagLectura, FlagActualizacion, CatalogoLectura, PlantillaLectura
from ..autenticacion.dependencies import requerir_superadmin
from ..autenticacion.routes import get_current_user
from ..superadmin.repositories import SuperadminRepository
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

# --- Endpoint público para cualquier usuario autenticado ---

@router.get("/contacto", response_model=RespuestaBase, summary="Datos de contacto del soporte")
def obtener_contacto_soporte(
    usuario: dict = Depends(get_current_user),
    repo: SuperadminRepository = Depends()
):
    """Devuelve el teléfono y nombre del superadministrador. Accesible para cualquier rol."""
    with repo.db.cursor() as cur:
        cur.execute("""
            SELECT s.nombres || ' ' || s.apellidos as nombre, s.telefono, u.email
            FROM sistema_facturacion.superadmin s
            JOIN sistema_facturacion.users u ON u.id = s.user_id
            WHERE s.activo = TRUE
            ORDER BY s.created_at ASC
            LIMIT 1
        """)
        row = cur.fetchone()
        data = dict(row) if row else {"nombre": "Soporte NousTI", "telefono": None, "email": None}
    return {"mensaje": "Contacto de soporte", "detalles": data}

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

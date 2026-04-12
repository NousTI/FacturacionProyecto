from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioLogs
from .schemas import LogEmisionLectura, LogEmisionCreacion, LogAuditoriaLectura
from ..autenticacion.routes import obtener_usuario_actual, requerir_superadmin

router = APIRouter()

@router.get("/", response_model=List[LogEmisionLectura])
def listar_logs(
    limite: int = 100,
    desplazar: int = 0,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioLogs = Depends()
):
    return servicio.listar_logs(limite, desplazar)

@router.get("/factura/{factura_id}", response_model=List[LogEmisionLectura])
def obtener_logs_factura(
    factura_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioLogs = Depends()
):
    return servicio.obtener_por_factura(factura_id)

@router.post("/", response_model=LogEmisionLectura, status_code=status.HTTP_201_CREATED)
def crear_log(
    datos: LogEmisionCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioLogs = Depends()
):
    return servicio.crear_log(datos)

@router.get("/auditoria", response_model=List[LogAuditoriaLectura])
def listar_auditoria(
    usuario: str = None,
    evento: str = None,
    fecha_inicio: str = None,
    fecha_fin: str = None,
    limit: int = 100,
    offset: int = 0,
    admin: dict = Depends(requerir_superadmin),
    servicio: ServicioLogs = Depends()
):
    filters = {
        "usuario": usuario,
        "evento": evento,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin
    }
    return servicio.listar_auditoria(filters, limit, offset)

@router.get("/auditoria/export")
def exportar_auditoria(
    usuario: str = None,
    evento: str = None,
    fecha_inicio: str = None,
    fecha_fin: str = None,
    admin: dict = Depends(requerir_superadmin),
    servicio: ServicioLogs = Depends()
):
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    
    filters = {
        "usuario": usuario,
        "evento": evento,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin
    }
    
    file_stream = servicio.exportar_auditoria(filters)
    filename = f"auditoria_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

from fastapi import Depends
from typing import List
from uuid import UUID

from .repository import RepositorioLogs
from .schemas import LogEmisionCreacion
from ...errors.app_error import AppError

class ServicioLogs:
    def __init__(self, repo: RepositorioLogs = Depends()):
        self.repo = repo

    def crear_log(self, datos: LogEmisionCreacion):
        res = self.repo.crear_log(datos.model_dump())
        if not res: raise AppError("Error al crear log", 500, "LOG_CREATE_ERROR")
        return res

    def listar_logs(self, limite: int = 100, desplazar: int = 0):
        return self.repo.listar_logs(limite, desplazar)

    def obtener_por_factura(self, factura_id: UUID):
        return self.repo.obtener_por_factura(factura_id)

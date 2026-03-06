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

    def listar_auditoria(self, filters: dict = None, limit: int = 100, offset: int = 0):
        return self.repo.listar_auditoria(filters, limit, offset)

    def registrar_evento(self, user_id: UUID, evento: str, detail: str = None, ip: str = None, ua: str = None, origen: str = 'SISTEMA'):
        return self.repo.registrar_evento(user_id, evento, detail, ip, ua, origen)

from fastapi import Depends
from typing import List, Optional
from .repository import RepositorioConfiguracion
from .schemas import ConfigActualizacion, FlagActualizacion
from ...errors.app_error import AppError

class ServicioConfiguracion:
    def __init__(self, repo: RepositorioConfiguracion = Depends()):
        self.repo = repo

    def listar_config(self):
        return self.repo.listar_config()

    def obtener_valor(self, clave: str, default: str = None) -> Optional[str]:
        config = self.repo.obtener_por_clave(clave)
        return config['valor'] if config else default

    def actualizar_config(self, clave: str, datos: ConfigActualizacion):
        if self.repo.actualizar_config(clave, datos.valor):
            return {"message": f"Configuración {clave} actualizada correctamente"}
        raise AppError(f"Configuración {clave} no encontrada", 404, "CONFIG_NOT_FOUND")

    def listar_flags(self):
        return self.repo.listar_flags()

    def actualizar_flag(self, codigo: str, datos: FlagActualizacion):
        if self.repo.actualizar_flag(codigo, datos.activo):
            return {"message": f"Flag {codigo} actualizado correctamente"}
        raise AppError(f"Flag {codigo} no encontrado", 404, "FLAG_NOT_FOUND")

    def listar_catalogos(self):
        return self.repo.listar_catalogos()

    def listar_plantillas(self):
        return self.repo.listar_plantillas()

from fastapi import Depends
from typing import List, Optional
from .repository import RepositorioConfiguracion
from .schemas import ConfigActualizacion, FlagActualizacion
from ...errors.app_error import AppError
from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

class ServicioConfiguracion:
    def __init__(self, repo: RepositorioConfiguracion = Depends()):
        self.repo = repo

    def listar_config(self):
        return self.repo.listar_config()

    def actualizar_config(self, clave: str, datos: ConfigActualizacion):
        if self.repo.actualizar_config(clave, datos.valor):
            return {"message": f"Configuración {clave} actualizada correctamente"}
        
        raise AppError(
            message=AppMessages.DB_NOT_FOUND, 
            status_code=404, 
            code=ErrorCodes.DB_NOT_FOUND,
            description=f"La configuración con clave '{clave}' no existe."
        )

    def listar_flags(self):
        return self.repo.listar_flags()

    def actualizar_flag(self, codigo: str, datos: FlagActualizacion):
        if self.repo.actualizar_flag(codigo, datos.activo):
            return {"message": f"Flag {codigo} actualizado correctamente"}
        
        raise AppError(
            message=AppMessages.DB_NOT_FOUND, 
            status_code=404, 
            code=ErrorCodes.DB_NOT_FOUND,
            description=f"El feature flag '{codigo}' no existe."
        )

    def listar_catalogos(self):
        return self.repo.listar_catalogos()

    def listar_plantillas(self):
        return self.repo.listar_plantillas()

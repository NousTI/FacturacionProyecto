from fastapi import Depends
from .repository import RepositorioDashboardVendedor
from .....constants.enums import AuthKeys
from .....errors.app_error import AppError

class ServicioDashboardVendedor:
    def __init__(self, repo: RepositorioDashboardVendedor = Depends()):
        self.repo = repo

    def obtener_metricas(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
            raise AppError("Solo los vendedores pueden acceder a estas métricas", 403)
        
        vendedor_id = usuario_actual.get(AuthKeys.INTERNAL_VENDEDOR_ID)
        if not vendedor_id:
            raise AppError("Identificador de vendedor no encontrado", 400)
            
        return self.repo.obtener_metricas(vendedor_id)

from fastapi import Depends
from repositories.empresa_repository import EmpresaRepository

class SubscriptionMonitorService:
    def __init__(self, empresa_repo: EmpresaRepository = Depends()):
        self.empresa_repo = empresa_repo

    def process_expired_subscriptions(self) -> dict:
        """
        Verifica y actualiza las suscripciones vencidas.
        """
        count = self.empresa_repo.update_expired_subscriptions()
        return {
            "status": "success", 
            "message": "Proceso de verificación completado", 
            "updated_count": count
        }

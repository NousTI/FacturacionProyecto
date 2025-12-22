from fastapi import Depends
from repositories.empresa_repository import EmpresaRepository
from utils.enums import SubscriptionStatus
from datetime import datetime

class SubscriptionMonitorService:
    def __init__(self, empresa_repo: EmpresaRepository = Depends()):
        self.empresa_repo = empresa_repo

    def process_expired_subscriptions(self) -> dict:
        """
        Verifica y actualiza las suscripciones vencidas.
        La lógica de negocio (regla de vencimiento) se orquesta aquí.
        """
        cutoff_date = datetime.now()
        
        # 1. Obtains IDs of companies that meet expiration criteria
        expired_ids = self.empresa_repo.get_companies_with_expired_subscription(cutoff_date)
        
        updated_count = 0
        
        # 2. Iterate and update status
        # This allows granular control, emitting events in the future (e.g. "Send Email"), etc.
        for empresa_id in expired_ids:
            # Business Rule: Change status to 'VENCIDA'
            if self.empresa_repo.update_company_status(empresa_id, SubscriptionStatus.VENCIDA.value):
                updated_count += 1
                
        return {
            "status": "success", 
            "message": "Proceso de verificación completado", 
            "updated_count": updated_count
        }

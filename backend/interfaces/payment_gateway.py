from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PaymentGateway(ABC):
    @abstractmethod
    def process_payment(self, amount: float, currency: str, payment_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment request.
        Returns a dict with transaction status and ID.
        Raises exception on failure.
        """
        pass

    @abstractmethod
    def verify_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Check the status of a transaction.
        """
        pass

from utils.enums import PaymentStatus

class ManualPaymentGateway(PaymentGateway):
    def process_payment(self, amount: float, currency: str, payment_details: Dict[str, Any]) -> Dict[str, Any]:
        # For manual payments (Transfer/Cash), we assume the admin has verified it externally
        # or it is being recorded "after the fact".
        # We just return success.
        return {
            "status": PaymentStatus.COMPLETED.value,
            "transaction_id": f"MANUAL-{payment_details.get('referencia', 'NA')}",
            "raw_response": {"message": "Pago registrado manualmente"}
        }

    def verify_status(self, transaction_id: str) -> Dict[str, Any]:
        return {"status": PaymentStatus.COMPLETED.value, "provider": "MANUAL"}

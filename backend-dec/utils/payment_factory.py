from interfaces.payment_gateway import PaymentGateway, ManualPaymentGateway
from utils.enums import PaymentMethod

class PaymentFactory:
    @staticmethod
    def get_gateway(method_name: str) -> PaymentGateway:
        try:
            method = PaymentMethod(method_name.upper())
        except ValueError:
             # Default or handle error. For now, defaulting to Manual for strings that might map to it?
             # Or strict behavior.
             # Given current logic, let's check against manual types.
             pass
             
        # Simplify: If it matches our manual enums
        if method_name.upper() in [
            PaymentMethod.TRANSFERENCIA.value, 
            PaymentMethod.EFECTIVO.value, 
            PaymentMethod.CHEQUE.value, 
            PaymentMethod.MANUAL.value
        ]:
            return ManualPaymentGateway()
        
        # Future:
        # if method_name.upper() == PaymentMethod.STRIPE.value: return StripeGateway()
        
        return ManualPaymentGateway()

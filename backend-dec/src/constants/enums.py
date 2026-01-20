from enum import Enum

class SubscriptionStatus(str, Enum):
    ACTIVA = "ACTIVA"
    PENDIENTE = "PENDIENTE"
    VENCIDA = "VENCIDA"
    CANCELADA = "CANCELADA"

class PaymentStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    REFUNDED = "REFUNDED"

class CommissionStatus(str, Enum):
    PENDIENTE = "PENDIENTE"
    PAGADA = "PAGADA"
    CANCELADA = "CANCELADA"

class PaymentMethod(str, Enum):
    TRANSFERENCIA = "TRANSFERENCIA"
    EFECTIVO = "EFECTIVO"
    CHEQUE = "CHEQUE"
    MANUAL = "MANUAL"
    STRIPE = "STRIPE"
    PAYPAL = "PAYPAL"

# RolCodigo mooved to roles.py
# PermissionCodes moved to permissions.py

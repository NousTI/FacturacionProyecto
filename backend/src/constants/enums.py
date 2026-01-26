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
    APROBADA = "APROBADA"
    PAGADA = "PAGADA"
    RECHAZADA = "RECHAZADA"
    CANCELADA = "CANCELADA"

class PaymentMethod(str, Enum):
    TRANSFERENCIA = "TRANSFERENCIA"
    EFECTIVO = "EFECTIVO"
    CHEQUE = "CHEQUE"
    MANUAL = "MANUAL"
    STRIPE = "STRIPE"
    PAYPAL = "PAYPAL"

from .roles import RolCodigo
from .permissions import PermissionCodes

class AuthKeys:
    IS_SUPERADMIN = "is_superadmin"
    IS_VENDEDOR = "is_vendedor"
    IS_USUARIO = "is_usuario"
    ROL_ID = "rol_id"

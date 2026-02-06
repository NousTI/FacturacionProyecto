"""
Schemas para logs de factura.

Estos schemas manejan:
- Log de emisión: Intentos de envío al SRI
- Autorización SRI: Datos de autorización final
- Log de pagos: Historial de pagos de factura
"""

from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal, List, Any
from pydantic import BaseModel, Field


# ===================================================================
# ENUMS para validación
# ===================================================================

TipoIntentoEmision = Literal['INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION']
EstadoIntentoEmision = Literal['EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_OTRO']
EstadoAutorizacion = Literal['AUTORIZADO', 'NO_AUTORIZADO', 'DEVUELTO', 'CANCELADO']
MetodoPago = Literal['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE', 'DEPOSITO', 'OTRO']


# ===================================================================
# LOG EMISIÓN FACTURAS
# ===================================================================

class LogEmisionBase(BaseModel):
    """Base para log de intentos de emisión al SRI."""
    
    tipo_intento: TipoIntentoEmision = Field(
        default='INICIAL',
        description="INICIAL | REINTENTO | CONTINGENCIA | RECTIFICACION"
    )
    estado: EstadoIntentoEmision = Field(
        ...,
        description="EN_PROCESO | EXITOSO | ERROR_VALIDACION | ERROR_CONECTIVIDAD | ERROR_OTRO"
    )
    intento_numero: int = Field(default=1, ge=1, description="Número de intento (1 = primer intento)")
    codigo_error: Optional[str] = Field(None, max_length=50, description="Código de error del SRI")
    mensaje_error: Optional[str] = Field(None, description="Mensaje de error detallado")
    observaciones: Optional[str] = Field(None, description="Notas adicionales")


class LogEmisionCreacion(LogEmisionBase):
    """Schema para crear un registro de log de emisión."""
    
    factura_id: UUID = Field(..., description="ID de la factura")
    facturacion_programada_id: Optional[UUID] = Field(None, description="ID de la programación si aplica")
    usuario_id: UUID = Field(..., description="Usuario que realiza el intento")
    xml_enviado: Optional[str] = Field(None, description="XML enviado al SRI")
    xml_respuesta: Optional[str] = Field(None, description="XML de respuesta del SRI")


class LogEmisionLectura(LogEmisionBase):
    """Schema de lectura para log de emisión."""
    
    id: UUID
    factura_id: UUID
    facturacion_programada_id: Optional[UUID] = None
    usuario_id: UUID
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None
    timestamp: datetime
    
    # Campos computados/relacionados
    usuario_nombre: Optional[str] = Field(None, description="Nombre completo del usuario")

    class Config:
        from_attributes = True


class LogEmisionListado(BaseModel):
    """Schema resumido para listado de logs de emisión (sin XML completos)."""
    
    id: UUID
    factura_id: UUID
    tipo_intento: str
    estado: str
    intento_numero: int
    codigo_error: Optional[str] = None
    mensaje_error: Optional[str] = None
    usuario_nombre: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ===================================================================
# AUTORIZACIÓN SRI
# ===================================================================

class AutorizacionSRIBase(BaseModel):
    """Base para autorización del SRI."""
    
    numero_autorizacion: str = Field(
        ...,
        min_length=10,
        max_length=49,
        description="Número de autorización del SRI"
    )
    fecha_autorizacion: datetime = Field(..., description="Fecha/hora de autorización")
    estado: EstadoAutorizacion = Field(
        ...,
        description="AUTORIZADO | NO_AUTORIZADO | DEVUELTO | CANCELADO"
    )


class AutorizacionSRICreacion(AutorizacionSRIBase):
    """Schema para crear un registro de autorización."""
    
    factura_id: UUID = Field(..., description="ID de la factura autorizada")
    mensajes: Optional[List[Any]] = Field(None, description="Mensajes/advertencias del SRI")
    xml_enviado: Optional[str] = Field(None, description="XML original enviado")
    xml_respuesta: Optional[str] = Field(None, description="XML de respuesta del SRI")


class AutorizacionSRILectura(AutorizacionSRIBase):
    """Schema de lectura para autorización SRI."""
    
    id: UUID
    factura_id: UUID
    mensajes: Optional[List[Any]] = None
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AutorizacionSRIResumen(BaseModel):
    """Schema resumido para mostrar en factura (sin XMLs)."""
    
    numero_autorizacion: str
    fecha_autorizacion: datetime
    estado: str

    class Config:
        from_attributes = True


# ===================================================================
# LOG PAGO FACTURAS
# ===================================================================

class LogPagoBase(BaseModel):
    """Base para log de pagos de factura."""
    
    monto: Decimal = Field(..., gt=0, description="Monto pagado (debe ser > 0)")
    fecha_pago: date = Field(default_factory=date.today, description="Fecha del pago")
    metodo_pago: MetodoPago = Field(
        ...,
        description="EFECTIVO | TRANSFERENCIA | TARJETA | CHEQUE | DEPOSITO | OTRO"
    )
    numero_referencia: Optional[str] = Field(
        None,
        max_length=100,
        description="Referencia bancaria, número de cheque, etc."
    )
    comprobante_url: Optional[str] = Field(None, description="URL del comprobante")
    observaciones: Optional[str] = Field(None, description="Notas sobre el pago")


class LogPagoCreacion(LogPagoBase):
    """Schema para crear un registro de pago."""
    
    factura_id: UUID = Field(..., description="ID de la factura")
    usuario_id: Optional[UUID] = Field(None, description="Usuario que registra (se obtiene del token)")


class LogPagoLectura(LogPagoBase):
    """Schema de lectura para log de pago."""
    
    id: UUID
    factura_id: UUID
    usuario_id: UUID
    timestamp: datetime
    
    # Campos computados/relacionados
    usuario_nombre: Optional[str] = Field(None, description="Nombre completo del usuario")

    class Config:
        from_attributes = True


# ===================================================================
# SCHEMAS AUXILIARES
# ===================================================================

class ResumenPagos(BaseModel):
    """Resumen de pagos de una factura."""
    
    total_factura: Decimal = Field(..., description="Total de la factura")
    total_pagado: Decimal = Field(default=Decimal('0.00'), description="Suma de todos los pagos")
    saldo_pendiente: Decimal = Field(..., description="Lo que falta por pagar")
    cantidad_pagos: int = Field(default=0, ge=0, description="Número de pagos realizados")
    ultimo_pago: Optional[datetime] = Field(None, description="Fecha del último pago")


class HistorialEmision(BaseModel):
    """Historial completo de emisión de una factura."""
    
    factura_id: UUID
    numero_factura: str
    estado_actual: str
    total_intentos: int
    logs: List[LogEmisionListado]
    autorizacion: Optional[AutorizacionSRIResumen] = None


class HistorialPagos(BaseModel):
    """Historial completo de pagos de una factura."""
    
    factura_id: UUID
    numero_factura: str
    resumen: ResumenPagos
    pagos: List[LogPagoLectura]

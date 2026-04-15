from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal, Any
from pydantic import BaseModel, Field, field_validator

# ===================================================================
# ENUMS Y TIPOS
# ===================================================================

EstadoNotaCredito = Literal['PENDIENTE', 'RECIBIDO', 'AUTORIZADO', 'RECHAZADO', 'DEVUELTA', 'ANULADA']
TipoIntentoNC = Literal['INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION', 'CONSULTA']
EstadoIntentoNC = Literal['EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_SISTEMA']
FaseFallaNC = Literal['RECEPCION', 'AUTORIZACION', 'FIRMA', 'SISTEMA', 'AUTORIZACION_CONSULTA']
EstadoAutorizacionNC = Literal['AUTORIZADO', 'NO_AUTORIZADO', 'DEVUELTO', 'CANCELADO']

# ===================================================================
# DETALLE DE NOTA DE CRÉDITO
# ===================================================================

class NotaCreditoDetalleBase(BaseModel):
    """Campos base para el detalle de la Nota de Crédito."""
    producto_id: Optional[UUID] = None
    factura_detalle_id: Optional[UUID] = None
    codigo_producto: str
    nombre: str
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0, description="Soporta hasta 6 decimales según SRI")
    descuento: Decimal = Field(default=Decimal('0.00'), ge=0)
    subtotal: Decimal = Field(..., ge=0)
    valor_iva: Decimal = Field(default=Decimal('0.00'), ge=0)

class NotaCreditoDetalleCreacion(NotaCreditoDetalleBase):
    """Schema para crear un detalle."""
    nota_credito_id: Optional[UUID] = None # Se asigna en el backend

class NotaCreditoDetalleLectura(NotaCreditoDetalleBase):
    """Schema para leer un detalle."""
    id: UUID
    nota_credito_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ===================================================================
# NOTA DE CRÉDITO (CABECERA)
# ===================================================================

class NotaCreditoBase(BaseModel):
    """Campos base de la Nota de Crédito."""
    factura_id: UUID
    establecimiento: str = Field(..., pattern=r'^\d{3}$', description="Ej: 001")
    punto_emision: str = Field(..., pattern=r'^\d{3}$', description="Ej: 100")
    secuencial: str = Field(..., pattern=r'^\d{9}$', description="Ej: 000000001")
    
    # SRI Context
    ambiente: int = Field(default=1, description="1=Pruebas, 2=Producción")
    tipo_emision: int = Field(default=1, description="1=Normal")
    
    # Modificación
    cod_doc_modificado: str = Field(default='01', description="01=Factura")
    num_doc_modificado: str = Field(..., pattern=r'^\d{3}-\d{3}-\d{9}$', description="Número de la factura original")
    fecha_emision_docs_modificado: date
    motivo_anulacion: str = Field(..., min_length=1, max_length=300)
    
    # Totales
    subtotal_15_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    subtotal_0_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    iva_total: Decimal = Field(default=Decimal('0.00'), ge=0)
    valor_total_anulado: Decimal = Field(..., ge=0)

class NotaCreditoCreacion(NotaCreditoBase):
    """Schema para crear una Nota de Crédito."""
    fecha_emision: Optional[datetime] = Field(default_factory=datetime.now)
    detalles: List[NotaCreditoDetalleCreacion] = Field(..., min_items=1)

class NotaCreditoLectura(NotaCreditoBase):
    """Schema para lectura completa."""
    id: UUID
    clave_acceso: Optional[str] = None
    numero_autorizacion: Optional[str] = None
    fecha_emision: datetime
    estado_sri: EstadoNotaCredito
    
    created_at: datetime
    updated_at: datetime
    
    # Relacionados
    detalles: Optional[List[NotaCreditoDetalleLectura]] = None
    
    class Config:
        from_attributes = True

# ===================================================================
# LOGS DE EMISIÓN
# ===================================================================

class LogEmisionNCBase(BaseModel):
    tipo_intento: TipoIntentoNC = Field(default='INICIAL')
    estado: EstadoIntentoNC
    ambiente: int = Field(1)
    clave_acceso: Optional[str] = Field(None, max_length=49)
    sri_estado_raw: Optional[str] = None
    fase_falla: Optional[FaseFallaNC] = None
    duracion_ms: Optional[int] = None
    mensajes: List[dict] = Field(default_factory=list)
    client_info: dict = Field(default_factory=dict)
    intento_numero: int = Field(default=1, ge=0)

class LogEmisionNCCreacion(LogEmisionNCBase):
    nota_credito_id: UUID
    usuario_id: UUID
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None

class LogEmisionNCLectura(LogEmisionNCBase):
    id: UUID
    nota_credito_id: UUID
    usuario_id: UUID
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None
    timestamp: datetime
    
    # Opcional para vista
    usuario_nombre: Optional[str] = None

    class Config:
        from_attributes = True

# ===================================================================
# AUTORIZACIÓN SRI
# ===================================================================

class AutorizacionSRINCBase(BaseModel):
    numero_autorizacion: str = Field(..., max_length=49)
    fecha_autorizacion: datetime
    estado: EstadoAutorizacionNC

class AutorizacionSRINCCreacion(AutorizacionSRINCBase):
    nota_credito_id: UUID
    mensajes: Optional[List[Any]] = None
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None

class AutorizacionSRINCLectura(AutorizacionSRINCBase):
    id: UUID
    nota_credito_id: UUID
    mensajes: Optional[List[Any]] = None
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

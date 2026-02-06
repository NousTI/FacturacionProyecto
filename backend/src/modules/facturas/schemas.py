"""
Schemas para el módulo de facturas.

Estos schemas definen la estructura de datos para crear, actualizar y leer facturas
según las normativas del SRI Ecuador.
"""

from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator, model_validator

from .schemas_snapshots import (
    SnapshotEmpresa,
    SnapshotCliente,
    SnapshotEstablecimiento,
    SnapshotPuntoEmision,
    SnapshotUsuario
)
from .schemas_logs import AutorizacionSRIResumen, ResumenPagos


# ===================================================================
# ENUMS DE ESTADO
# ===================================================================

EstadoFactura = Literal['BORRADOR', 'EMITIDA', 'ANULADA']
EstadoPago = Literal['PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO']
TipoEmision = Literal['NORMAL', 'CONTINGENCIA']
Ambiente = Literal['PRODUCCION', 'PRUEBAS']


# ===================================================================
# FACTURA BASE Y CREACIÓN
# ===================================================================

class FacturaBase(BaseModel):
    """Campos base compartidos por todas las operaciones de factura."""
    
    establecimiento_id: UUID
    punto_emision_id: UUID
    cliente_id: UUID
    facturacion_programada_id: Optional[UUID] = None
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    subtotal_sin_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    subtotal_con_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    descuento: Decimal = Field(default=Decimal('0.00'), ge=0)
    propina: Decimal = Field(default=Decimal('0.00'), ge=0)
    total: Decimal = Field(..., ge=0)
    origen: Optional[str] = Field(None, description="WEB | MOVIL | API | PROGRAMADA")
    observaciones: Optional[str] = None

    @field_validator('fecha_vencimiento')
    @classmethod
    def validar_fecha_vencimiento(cls, v: Optional[date], info) -> Optional[date]:
        """Fecha de vencimiento debe ser >= fecha de emisión."""
        if v is not None and 'fecha_emision' in info.data:
            fecha_emision = info.data['fecha_emision']
            if v < fecha_emision:
                raise ValueError('Fecha de vencimiento no puede ser anterior a fecha de emisión')
        return v


class FacturaCreacion(FacturaBase):
    """
    Schema para crear una factura.
    
    NOTAS:
    - empresa_id y usuario_id se obtienen del contexto de autenticación
    - Los snapshots se generan automáticamente en el service
    - La factura se crea en estado BORRADOR
    """
    
    empresa_id: Optional[UUID] = Field(None, description="Se obtiene del token si no se proporciona")
    usuario_id: Optional[UUID] = Field(None, description="Se obtiene del token si no se proporciona")

    @model_validator(mode='after')
    def validar_total(self) -> 'FacturaCreacion':
        """
        Valida que el total sea consistente con los subtotales.
        total = subtotal_sin_iva + subtotal_con_iva + iva + propina - descuento
        """
        calculado = (
            self.subtotal_sin_iva +
            self.subtotal_con_iva +
            self.iva +
            self.propina -
            self.descuento
        )
        # Permitir pequeña diferencia por redondeo (0.01)
        diferencia = abs(self.total - calculado)
        if diferencia > Decimal('0.01'):
            raise ValueError(
                f'Total ({self.total}) no coincide con el cálculo esperado ({calculado}). '
                f'total = subtotal_sin_iva + subtotal_con_iva + iva + propina - descuento'
            )
        return self




# ===================================================================
# FACTURA ACTUALIZACIÓN
# ===================================================================

class FacturaActualizacion(BaseModel):
    """
    Schema para actualizar una factura.
    
    RESTRICCIONES LEGALES:
    - Solo se puede actualizar si estado = BORRADOR
    - Una vez EMITIDA, la factura es inmutable (solo se puede anular)
    """
    
    # Solo campos permitidos en BORRADOR
    cliente_id: Optional[UUID] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    subtotal_sin_iva: Optional[Decimal] = Field(None, ge=0)
    subtotal_con_iva: Optional[Decimal] = Field(None, ge=0)
    iva: Optional[Decimal] = Field(None, ge=0)
    descuento: Optional[Decimal] = Field(None, ge=0)
    propina: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    origen: Optional[str] = None
    observaciones: Optional[str] = None
    

# ===================================================================
# FACTURA ANULACIÓN
# ===================================================================

class FacturaAnulacion(BaseModel):
    """
    Schema para anular una factura.
    
    RESTRICCIONES LEGALES:
    - Solo se puede anular si estado = EMITIDA
    - Si estado = BORRADOR, debe eliminarse en su lugar
    - Si estado = ANULADA, no se puede volver a anular
    - La razón es obligatoria para auditoría SRI
    """
    
    razon_anulacion: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Motivo de anulación (mínimo 10 caracteres para auditoría)"
    )
    
    @field_validator('razon_anulacion')
    @classmethod
    def validar_razon(cls, v: str) -> str:
        """La razón debe ser descriptiva."""
        v = v.strip()
        if len(v) < 10:
            raise ValueError('La razón de anulación debe tener al menos 10 caracteres')
        return v


# ===================================================================
# FACTURA LECTURA
# ===================================================================

class FacturaLectura(BaseModel):
    """
    Schema completo para lectura de factura.
    
    Incluye todos los snapshots capturados al momento de creación
    para garantizar trazabilidad y auditoría.
    """
    
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    establecimiento_id: UUID
    punto_emision_id: UUID
    cliente_id: UUID
    facturacion_programada_id: Optional[UUID] = None
    
    # Número de factura formato SRI: NNN-NNN-NNNNNNNNN
    numero_factura: str = Field(
        ...,
        pattern=r'^\d{3}-\d{3}-\d{9}$',
        description="Formato SRI: 001-001-000000001"
    )
    
    # Campos SRI
    clave_acceso: Optional[str] = Field(
        None,
        min_length=49,
        max_length=49,
        description="Clave de acceso SRI (49 dígitos)"
    )
    ambiente: Optional[Ambiente] = Field(None, description="PRODUCCION | PRUEBAS")
    tipo_emision: Optional[TipoEmision] = Field(None, description="NORMAL | CONTINGENCIA")
    
    # Estados
    estado: EstadoFactura = Field(..., description="BORRADOR | EMITIDA | ANULADA")
    estado_pago: EstadoPago = Field(..., description="PENDIENTE | PAGADO | PARCIAL | VENCIDO")
    razon_anulacion: Optional[str] = None
    
    # Montos
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    subtotal_sin_iva: Decimal
    subtotal_con_iva: Decimal
    iva: Decimal
    descuento: Decimal
    propina: Decimal
    total: Decimal
    
    # Otros
    origen: Optional[str] = None
    observaciones: Optional[str] = None
    
    # ===== SNAPSHOTS (inmutables desde creación) =====
    snapshot_empresa: Optional[SnapshotEmpresa] = Field(
        None,
        description="Datos de la empresa al momento de crear la factura"
    )
    snapshot_cliente: Optional[SnapshotCliente] = Field(
        None,
        description="Datos del cliente al momento de crear la factura"
    )
    snapshot_establecimiento: Optional[SnapshotEstablecimiento] = Field(
        None,
        description="Datos del establecimiento al momento de crear la factura"
    )
    snapshot_punto_emision: Optional[SnapshotPuntoEmision] = Field(
        None,
        description="Datos del punto de emisión al momento de crear la factura"
    )
    snapshot_usuario: Optional[SnapshotUsuario] = Field(
        None,
        description="Datos del usuario que creó la factura"
    )
    
    # ===== DATOS RELACIONADOS (opcionales, para UI) =====
    autorizacion: Optional[AutorizacionSRIResumen] = Field(
        None,
        description="Resumen de autorización SRI si existe"
    )
    resumen_pagos: Optional[ResumenPagos] = Field(
        None,
        description="Resumen de pagos si se solicita"
    )
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===================================================================
# SCHEMAS AUXILIARES
# ===================================================================

class FacturaListadoFiltros(BaseModel):
    """Filtros para listado de facturas."""
    
    estado: Optional[EstadoFactura] = None
    estado_pago: Optional[EstadoPago] = None
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    cliente_id: Optional[UUID] = None
    establecimiento_id: Optional[UUID] = None
    punto_emision_id: Optional[UUID] = None
    solo_propias: bool = Field(default=False, description="Filtrar solo mis facturas")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class FacturaResumen(BaseModel):
    """Schema resumido para listados (sin snapshots completos)."""
    
    id: UUID
    numero_factura: str
    cliente_razon_social: str
    fecha_emision: date
    total: Decimal
    estado: str
    estado_pago: str
    clave_acceso: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FacturaStats(BaseModel):
    """Estadísticas de facturas para dashboard."""
    
    total_facturas: int = 0
    total_borradores: int = 0
    total_emitidas: int = 0
    total_anuladas: int = 0
    monto_total_emitido: Decimal = Decimal('0.00')
    monto_total_cobrado: Decimal = Decimal('0.00')
    monto_pendiente: Decimal = Decimal('0.00')

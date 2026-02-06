"""
Schemas para snapshots de factura.

Los snapshots son copias inmutables de los datos de las entidades relacionadas
al momento de crear/emitir la factura. Esto garantiza la integridad para auditoría
y cumplimiento con normativas SRI Ecuador.

NOTA: Estos snapshots se almacenan como JSONB en PostgreSQL y NO deben modificarse
una vez creada la factura.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SnapshotEmpresa(BaseModel):
    """Snapshot de la empresa emisora al momento de crear la factura."""
    
    ruc: str = Field(..., description="RUC de la empresa emisora")
    razon_social: str = Field(..., description="Razón social registrada")
    nombre_comercial: Optional[str] = Field(None, description="Nombre comercial (si difiere)")
    direccion: str = Field(..., description="Dirección matriz")
    tipo_contribuyente: str = Field(..., description="NATURAL | JURIDICA | RISE")
    obligado_contabilidad: bool = Field(..., description="Si lleva contabilidad")
    email: Optional[str] = Field(None, description="Email de contacto")
    telefono: Optional[str] = Field(None, description="Teléfono de contacto")
    logo_url: Optional[str] = Field(None, description="URL del logo al momento de emisión")
    
    # Metadata del snapshot
    snapshot_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Momento en que se capturó el snapshot"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "ruc": "1791234567001",
                "razon_social": "EMPRESA EJEMPLO S.A.",
                "nombre_comercial": "MI NEGOCIO",
                "direccion": "Av. Principal 123, Quito",
                "tipo_contribuyente": "JURIDICA",
                "obligado_contabilidad": True,
                "email": "facturacion@empresa.com",
                "telefono": "0991234567",
                "snapshot_timestamp": "2026-02-06T10:30:00Z"
            }
        }


class SnapshotCliente(BaseModel):
    """Snapshot del cliente receptor al momento de crear la factura."""
    
    identificacion: str = Field(..., description="Cédula, RUC o pasaporte")
    tipo_identificacion: str = Field(..., description="CEDULA | RUC | PASAPORTE")
    razon_social: str = Field(..., description="Nombre o razón social del cliente")
    nombre_comercial: Optional[str] = Field(None, description="Nombre comercial si aplica")
    direccion: Optional[str] = Field(None, description="Dirección del cliente")
    email: Optional[str] = Field(None, description="Email del cliente")
    telefono: Optional[str] = Field(None, description="Teléfono del cliente")
    ciudad: Optional[str] = Field(None, description="Ciudad")
    provincia: Optional[str] = Field(None, description="Provincia")
    
    # Metadata del snapshot
    snapshot_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Momento en que se capturó el snapshot"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "identificacion": "1712345678",
                "tipo_identificacion": "CEDULA",
                "razon_social": "JUAN PÉREZ",
                "direccion": "Calle 10 de Agosto, Guayaquil",
                "email": "juan@email.com",
                "telefono": "0998765432",
                "ciudad": "Guayaquil",
                "provincia": "Guayas",
                "snapshot_timestamp": "2026-02-06T10:30:00Z"
            }
        }


class SnapshotEstablecimiento(BaseModel):
    """Snapshot del establecimiento emisor al momento de crear la factura."""
    
    codigo: str = Field(..., pattern=r'^\d{3}$', description="Código SRI del establecimiento (001-999)")
    nombre: str = Field(..., description="Nombre del establecimiento")
    direccion: str = Field(..., description="Dirección del establecimiento")
    
    # Metadata del snapshot
    snapshot_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Momento en que se capturó el snapshot"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "codigo": "001",
                "nombre": "Sucursal Principal",
                "direccion": "Av. Amazonas 456, Quito",
                "snapshot_timestamp": "2026-02-06T10:30:00Z"
            }
        }


class SnapshotPuntoEmision(BaseModel):
    """Snapshot del punto de emisión al momento de crear la factura."""
    
    codigo: str = Field(..., pattern=r'^\d{3}$', description="Código SRI del punto de emisión (001-999)")
    nombre: str = Field(..., description="Nombre del punto de emisión")
    secuencial_usado: int = Field(..., ge=1, description="Número secuencial asignado a esta factura")
    
    # Metadata del snapshot
    snapshot_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Momento en que se capturó el snapshot"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "codigo": "001",
                "nombre": "Caja 1",
                "secuencial_usado": 1234,
                "snapshot_timestamp": "2026-02-06T10:30:00Z"
            }
        }


class SnapshotUsuario(BaseModel):
    """Snapshot del usuario que crea/emite la factura."""
    
    nombres: str = Field(..., description="Nombres del usuario")
    apellidos: str = Field(..., description="Apellidos del usuario")
    email: str = Field(..., description="Email del usuario")
    rol_codigo: Optional[str] = Field(None, description="Código del rol asignado")
    rol_nombre: Optional[str] = Field(None, description="Nombre del rol asignado")
    
    # Metadata del snapshot
    snapshot_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Momento en que se capturó el snapshot"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "nombres": "María",
                "apellidos": "González",
                "email": "maria@empresa.com",
                "rol_codigo": "USUARIO",
                "rol_nombre": "Usuario",
                "snapshot_timestamp": "2026-02-06T10:30:00Z"
            }
        }


# Alias para uso en FacturaLectura
SnapshotsFactura = dict  # Para cuando se necesite el tipo genérico

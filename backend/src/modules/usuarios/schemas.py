from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UsuarioBase(BaseModel):
    empresa_id: UUID
    empresa_rol_id: UUID
    nombres: str
    apellidos: str
    telefono: str
    avatar_url: Optional[str] = None
    activo: bool = True

class UsuarioCreacion(BaseModel):
    email: Optional[EmailStr] = None
    password: str = "password"
    empresa_id: Optional[UUID] = None   # Se inyecta automáticamente desde el usuario actual si no se provee
    empresa_rol_id: Optional[UUID] = None
    nombres: str = Field(..., min_length=3)
    apellidos: str = Field(..., min_length=3)
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    avatar_url: Optional[str] = None

class UsuarioActualizacion(BaseModel):
    empresa_rol_id: Optional[UUID] = None
    nombres: Optional[str] = Field(None, min_length=3)
    apellidos: Optional[str] = Field(None, min_length=3)
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    avatar_url: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioLectura(UsuarioBase):
    id: UUID
    user_id: UUID
    email: Optional[str] = None
    empresa_nombre: Optional[str] = None
    rol_nombre: Optional[str] = None
    rol_codigo: Optional[str] = None
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Traceability fields (Optional)
    origen_creacion: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    creado_por_email: Optional[str] = None
    fecha_creacion_log: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PermisoSchema(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    modulo: str
    tipo: str
    descripcion: Optional[str] = None
    concedido: bool = False  # Indica si el usuario tiene este permiso otorgado

class EmpresaInfoSchema(BaseModel):
    id: UUID
    ruc: str
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: str
    direccion: str
    logo_url: Optional[str] = None

class PerfilUsuarioLectura(BaseModel):
    # Datos del Usuario (Perfil)
    id: Optional[UUID] = None # ID de perfil en empresa, puede ser nulo para superadmins
    user_id: UUID
    nombres: str
    apellidos: str
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None
    activo: bool # Estado en la empresa
    
    # Datos de Autenticación (Sistema)
    email: str
    system_role: str
    system_estado: str
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Datos de la Empresa
    empresa: Optional[EmpresaInfoSchema] = None
    
    # Datos del Rol y Permisos
    rol_nombre: Optional[str] = None
    rol_codigo: Optional[str] = None
    permisos: list[PermisoSchema]
    
    class Config:
        from_attributes = True

class UsuarioAdminLectura(BaseModel):
    id: UUID
    user_id: UUID
    nombres: str
    apellidos: str
    email: str
    telefono: str
    avatar_url: Optional[str] = None
    activo: bool
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    rol_nombre: str
    empresa_id: UUID
    empresa_nombre: str
    vendedor_id: Optional[UUID] = None
    origen_creacion: Optional[str] = None

    class Config:
        from_attributes = True

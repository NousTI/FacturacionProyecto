from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    empresa_id: UUID
    empresa_rol_id: UUID
    nombres: str
    apellidos: str
    telefono: str
    avatar_url: Optional[str] = None
    activo: bool = True

class UsuarioCreacion(BaseModel):
    email: EmailStr
    password: str
    empresa_id: UUID
    empresa_rol_id: Optional[UUID] = None
    nombres: str
    apellidos: str
    telefono: str
    avatar_url: Optional[str] = None

class UsuarioActualizacion(BaseModel):
    empresa_rol_id: Optional[UUID] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioLectura(UsuarioBase):
    id: UUID
    user_id: UUID
    email: Optional[str] = None
    empresa_nombre: Optional[str] = None
    rol_nombre: Optional[str] = None
    rol_codigo: Optional[str] = None
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
    id: UUID
    user_id: UUID
    nombres: str
    apellidos: str
    telefono: str
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
    empresa: EmpresaInfoSchema
    
    # Datos del Rol y Permisos
    rol_nombre: str
    rol_codigo: str
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

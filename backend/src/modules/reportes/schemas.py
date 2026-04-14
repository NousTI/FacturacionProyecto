from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ReporteBase(BaseModel):
    nombre: str
    tipo: str # 'VENTAS', 'GASTOS', etc.
    parametros: Optional[Dict[str, Any]] = None
    url_descarga: Optional[str] = None
    estado: str = 'PENDIENTE'

class ReporteCreacion(ReporteBase):
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None

class ReporteLectura(ReporteBase):
    id: UUID
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# R-031: REPORTE GLOBAL SUPERADMIN
# =========================================================

class EmpresaZonaRescate(BaseModel):
    id: UUID
    nombre_empresa: str
    plan_nombre: str
    ultimo_acceso: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    deadline: Optional[datetime] = None
    vendedor_nombre: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    representante: Optional[str] = None
    ultimo_acceso_fmt: Optional[str] = None
    deadline_fmt: Optional[str] = None
    antiguedad: Optional[str] = None

class EmpresaZonaUpgrade(BaseModel):
    id: UUID
    nombre_empresa: str
    plan_nombre: str
    max_facturas_mes: int
    facturas_mes: int
    porcentaje_uso: float

class ReporteGlobalSuperadmin(BaseModel):
    # KPIs
    empresas_activas: int = 0
    empresas_nuevas_mes: int = 0
    ingresos_anio: float = 0.0
    variacion_ingresos_anio: float = 0.0
    ingresos_mes: float = 0.0
    variacion_ingresos_mes: float = 0.0
    usuarios_nuevos_mes: int = 0
    tasa_crecimiento: float = 0.0
    tasa_abandono: float = 0.0
    zona_upgrade: int = 0
    zona_rescate: int = 0
    crecimiento_neto: int = 0
    # Tablas
    empresas_rescate: List[EmpresaZonaRescate] = []
    empresas_upgrade: List[EmpresaZonaUpgrade] = []
    # Gráficas
    planes_mas_vendidos: List[Dict[str, Any]] = []
    top_vendedores: List[Dict[str, Any]] = []


# =========================================================
# R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
# =========================================================

class KPIsComisionesSuperadmin(BaseModel):
    comisiones_pendientes: float = 0.0
    pagadas_mes: float = 0.0
    vendedores_activos: int = 0
    porcentaje_upgrades: Optional[float] = None
    porcentaje_clientes_perdidos: Optional[float] = None

class DetalleComisionSuperadmin(BaseModel):
    vendedor: str
    empresa: str
    tipo_venta: str
    plan: str
    comision: float
    estado: str
    fecha: Optional[str] = None

class ReporteComisionesSuperadmin(BaseModel):
    kpis: KPIsComisionesSuperadmin
    detalle: List[DetalleComisionSuperadmin] = []
    top_vendedores: List[Dict[str, Any]] = []
    planes_mas_vendidos: List[Dict[str, Any]] = []


# =========================================================
# R-033: USO DEL SISTEMA POR EMPRESA (SUPERADMIN)
# =========================================================

class UsoEmpresa(BaseModel):
    empresa: str
    total_usuarios: int = 0
    usuarios_activos: int = 0
    facturas_mes: int = 0
    max_facturas_mes: Optional[int] = None
    porcentaje_uso: float = 0.0
    modulos_usados: int = 0
    modulos_total: int = 5
    plan_nombre: Optional[str] = None
    estado_suscripcion: Optional[str] = None
    ultimo_acceso: Optional[datetime] = None

class ReporteUsoSistemaSuperadmin(BaseModel):
    empresas: List[UsoEmpresa] = []
    modulos_mas_usados: List[Dict[str, Any]] = []
    promedio_usuarios: Optional[float] = None
    max_usuarios: Optional[int] = None
    min_usuarios: Optional[int] = None

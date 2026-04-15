from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class MetricasVendedorLectura(BaseModel):
    total_empresas: int
    empresas_activas: int
    total_usuarios: int
    usuarios_activos: int
    total_vencidas: int = 0
    total_proximas: int = 0
    monto_comisiones: float = 0.0
    comisiones_mes: float = 0.0
    empresas_inactivas: int = 0
    tendencia_crecimiento: List[Dict[str, Any]] = []

# =========================================================
# VENDEDOR - R-031 REDUCIDO: MIS EMPRESAS
# =========================================================

class DetalleEmpresaVendedor(BaseModel):
    id: UUID
    empresa: str
    plan: str
    porcentaje_uso: float
    oportunidad_upgrade: str # "Si" / "No"
    prox_venc_fmt: str
    estado: str
    admin_nombre: Optional[str] = None
    admin_fecha_fmt: Optional[str] = None
    admin_antiguedad: Optional[str] = None
    antiguedad: Optional[str] = None

class ReporteEmpresasVendedor(BaseModel):
    # KPIs
    activas_total: int = 0
    activas_este_mes: int = 0
    comision_pendiente: float = 0.0
    vencen_pronto: int = 0
    planes_nuevos_mes: int = 0
    planes_nuevos_pct: float = 0.0
    upgrades_mes: int = 0
    upgrades_pct: float = 0.0
    renovaciones_mes: int = 0
    renovaciones_pct: float = 0.0
    # Tablas
    empresas: List[DetalleEmpresaVendedor] = []
    # Gráficas
    grafica_planes: List[Dict[str, Any]] = []
    grafica_ventas_mes: List[Dict[str, Any]] = []

# =========================================================
# VENDEDOR - R-032 REDUCIDO: MIS COMISIONES
# =========================================================

class DetalleComisionVendedor(BaseModel):
    empresa: str
    fecha_venta: Optional[datetime] = None
    plan: str
    mi_comision: float
    estado: str

class ReporteComisionesVendedor(BaseModel):
    # KPIs
    ya_depositado: float = 0.0
    pendiente_aprobacion: float = 0.0
    total_historico: float = 0.0
    comisiones_en_riesgo: float = 0.0
    # Tablas
    detalle: List[DetalleComisionVendedor] = []
    # Gráficas
    grafica_comparativa: Dict[str, Any] = {}

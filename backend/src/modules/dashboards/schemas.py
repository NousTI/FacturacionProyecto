from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardKPIs(BaseModel):
    # Superadmin / Vendedor
    empresas_activas: Optional[int] = None
    ingresos_mensuales: Optional[float] = None
    comisiones_pendientes: Optional[float] = None
    pagos_atrasados: Optional[int] = None
    empresas_por_vencer: Optional[int] = None
    variacion_ingresos: Optional[float] = 0.0
    
    # Empresa
    ventas_mes: Optional[float] = None
    ventas_hoy: Optional[float] = None
    cuentas_cobrar: Optional[float] = None
    productos_stock_bajo: Optional[int] = None
    facturas_rechazadas: Optional[int] = None

class DashboardAlerta(BaseModel):
    tipo: str
    cantidad: int
    nivel: str  # critical, warning, info
    mensaje: str

class DashboardAlertas(BaseModel):
    criticas: List[DashboardAlerta]
    advertencias: List[DashboardAlerta]
    informativas: List[DashboardAlerta]

class DashboardOverview(BaseModel):
    kpis: DashboardKPIs
    alertas: DashboardAlertas

class ResumenDashboard(BaseModel):
    total_empresas: int
    empresas_activas: int
    empresas_inactivas: int
    total_usuarios: int
    total_facturas: Any
    ingresos_totales: float
    comisiones_pendientes_monto: float
    comisiones_pendientes_count: int
    errores_sri_msg: str
    certificados_msg: str

class CharData(BaseModel):
    label: str
    value: float

class DashboardGraficos(BaseModel):
    facturas_mes: List[CharData]
    ingresos_saas: List[CharData]
    empresas_by_plan: List[Dict[str, Any]]
    sri_trend: List[int]

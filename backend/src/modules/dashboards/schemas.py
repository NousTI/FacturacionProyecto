from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardKPIs(BaseModel):
    empresas_activas: int
    ingresos_mensuales: float
    comisiones_pendientes: float
    pagos_atrasados: int
    empresas_por_vencer: int
    variacion_ingresos: float

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

from pydantic import BaseModel
from typing import List, Dict, Any

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

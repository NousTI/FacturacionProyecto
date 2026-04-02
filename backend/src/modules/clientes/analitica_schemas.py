"""
Schemas de respuesta para los reportes analíticos del módulo de Clientes.
R-017: Clientes Nuevos por Mes
R-018: Top Clientes (Mejores Compradores)
R-019: Clientes Inactivos
R-020: Análisis de Segmentación
"""
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date


# =====================================================================
# R-017: CLIENTES NUEVOS POR MES
# =====================================================================

class PeriodoNuevosClientes(BaseModel):
    """Fila de la tabla de clientes nuevos por mes."""
    mes: str                       # Ej: "Octubre 2024"
    anio: int
    mes_numero: int
    nuevos_clientes: int
    con_primera_compra: int        # Registrados y ya compraron
    sin_compras: int               # Registrados pero sin factura aún


class ReporteNuevosClientesResponse(BaseModel):
    """Respuesta completa de R-017."""
    periodos: List[PeriodoNuevosClientes]
    total_nuevos: int
    total_con_compra: int
    total_sin_compra: int


# =====================================================================
# R-018: TOP CLIENTES
# =====================================================================

class TopClienteItem(BaseModel):
    """Fila del ranking de mejores compradores."""
    ranking: int
    cliente_id: str
    razon_social: str
    total_facturas: int
    total_compras: Decimal
    ticket_promedio: Decimal
    ultima_compra: Optional[date] = None
    email: Optional[str] = None
    telefono: Optional[str] = None


class ReporteTopClientesResponse(BaseModel):
    """Respuesta completa de R-018."""
    clientes: List[TopClienteItem]
    criterio: str                 # 'monto' | 'facturas'
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    total_registros: int


# =====================================================================
# R-019: CLIENTES INACTIVOS
# =====================================================================

class ClienteInactivoItem(BaseModel):
    """Fila de un cliente inactivo."""
    cliente_id: str
    razon_social: str
    ultima_factura: Optional[date] = None
    dias_sin_comprar: int          # Calculado desde ultima_factura hasta hoy
    total_historico: Decimal       # Sumatoria de todas sus facturas autorizadas
    email: Optional[str] = None
    telefono: Optional[str] = None


class ReporteClientesInactivosResponse(BaseModel):
    """Respuesta completa de R-019."""
    clientes: List[ClienteInactivoItem]
    dias_umbral: int               # Parámetro recibido (default 90)
    total_inactivos: int
    total_sin_compras_historicas: int  # Clientes que nunca compraron


# =====================================================================
# R-020: ANÁLISIS DE SEGMENTACIÓN
# =====================================================================

class SegmentoCliente(BaseModel):
    """Un segmento dentro del análisis de cartera."""
    nombre: str                    # 'FRECUENTES' | 'REGULARES' | 'OCASIONALES' | 'NUEVOS'
    descripcion: str               # Criterio legible (ej: "> 10 facturas/mes")
    total_clientes: int
    monto_total: Decimal
    porcentaje_monto: float        # % del total de ventas
    porcentaje_clientes: float     # % del total de clientes


class ParetoItem(BaseModel):
    """Dato para el gráfico Pareto 80/20."""
    cliente_razon_social: str
    total_compras: Decimal
    porcentaje_acumulado: float


class ReporteAnalisisClientesResponse(BaseModel):
    """Respuesta completa de R-020."""
    segmentos: List[SegmentoCliente]
    pareto: List[ParetoItem]       # Top clientes que acumulan el 80% de las ventas
    total_clientes_analizados: int
    monto_total_general: Decimal
    periodo_meses: int             # Meses analizados para determinar frecuencia

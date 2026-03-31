from uuid import UUID
from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

# --- R-013: Cuentas por Pagar Resumen ---

class PagarPorProveedor(BaseModel):
    proveedor: str
    facturas_pendientes: int
    monto_total: Decimal
    proximo_vencimiento: Optional[date] = None

class ResumenEfectivoPagar(BaseModel):
    total_por_pagar: Decimal
    vigente: Decimal
    vencido: Decimal

class CuentasPagarOverview(BaseModel):
    resumen: ResumenEfectivoPagar
    por_proveedor: List[PagarPorProveedor]
    fecha_corte: date

# --- R-014: Gastos por Categoría ---

class GastoCategoriaDetalle(BaseModel):
    categoria: str
    total: Decimal
    porcentaje: float
    comparacion_mes_anterior: float  # Variación porcentual

class ReporteGastosCategoria(BaseModel):
    listado: List[GastoCategoriaDetalle]
    total_periodo: Decimal

# --- R-015: Gastos por Proveedor ---

class GastoProveedorDetalle(BaseModel):
    proveedor: str
    cantidad_facturas: int
    total_compras: Decimal
    promedio_factura: Decimal
    ultima_compra: Optional[date] = None

# --- R-016: Flujo de Caja ---

class PeriodoFlujoCaja(BaseModel):
    periodo: str
    ingresos: Decimal
    egresos: Decimal
    saldo: Decimal
    acumulado: Decimal

class ReporteFlujoCaja(BaseModel):
    datos: List[PeriodoFlujoCaja]
    total_ingresos: Decimal
    total_egresos: Decimal
    saldo_neto: Decimal

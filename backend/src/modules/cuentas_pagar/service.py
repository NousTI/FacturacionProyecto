from fastapi import Depends
from datetime import date
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from .repository import RepositorioCuentasPagar
from .schemas import (
    CuentasPagarOverview, ReporteGastosCategoria, 
    GastoCategoriaDetalle, GastoProveedorDetalle,
    ReporteFlujoCaja, PeriodoFlujoCaja
)

class ServicioCuentasPagar:
    def __init__(self, repo: RepositorioCuentasPagar = Depends()):
        self.repo = repo

    def obtener_resumen(self, empresa_id: UUID) -> CuentasPagarOverview:
        return self.repo.obtener_resumen_pagar(empresa_id)

    def obtener_gastos_por_categoria(self, empresa_id: UUID, inicio: date, fin: date) -> ReporteGastosCategoria:
        registros = self.repo.obtener_gastos_por_categoria(empresa_id, inicio, fin)
        total_periodo = sum(r['total'] for r in registros)
        
        listado = []
        for r in registros:
            # Calcular variación vs anterior
            total_actual = Decimal(str(r['total']))
            total_anterior = Decimal(str(r['total_anterior']))
            
            p_anterior = 0.0
            if total_anterior > 0:
                p_anterior = round(float((total_actual - total_anterior) / total_anterior) * 100, 2)
            elif total_actual > 0:
                p_anterior = 100.0 # Crecimiento del 100% de 0 a algo
                
            listado.append(GastoCategoriaDetalle(
                categoria=r['categoria'],
                total=total_actual,
                porcentaje=float(r['porcentaje']),
                comparacion_mes_anterior=p_anterior
            ))
            
        return ReporteGastosCategoria(
            listado=listado,
            total_periodo=total_periodo
        )

    def obtener_gastos_por_proveedor(self, empresa_id: UUID, inicio: date, fin: date) -> List[GastoProveedorDetalle]:
        registros = self.repo.obtener_gastos_por_proveedor(empresa_id, inicio, fin)
        return [GastoProveedorDetalle(**r) for r in registros]

    def obtener_flujo_caja(self, empresa_id: UUID, inicio: date, fin: date, agrupacion: str = 'week') -> ReporteFlujoCaja:
        intervalos = ['day', 'week', 'month']
        agrup_val = agrupacion if agrupacion in intervalos else 'week'
        
        registros = self.repo.obtener_flujo_caja(empresa_id, inicio, fin, agrup_val)
        
        acumulado = Decimal('0.00')
        datos = []
        total_ingresos = Decimal('0.00')
        total_egresos = Decimal('0.00')
        
        for r in registros:
            ingresos = Decimal(str(r['ingresos']))
            egresos = Decimal(str(r['egresos']))
            saldo = Decimal(str(r['saldo']))
            acumulado += saldo
            
            total_ingresos += ingresos
            total_egresos += egresos
            
            # Formatear periodo para humanos si es necesario
            periodo_label = r['periodo'] # Por ahora simplificado
            
            datos.append(PeriodoFlujoCaja(
                periodo=periodo_label,
                ingresos=ingresos,
                egresos=egresos,
                saldo=saldo,
                acumulado=acumulado
            ))
            
        return ReporteFlujoCaja(
            datos=datos,
            total_ingresos=total_ingresos,
            total_egresos=total_egresos,
            saldo_neto=total_ingresos - total_egresos
        )

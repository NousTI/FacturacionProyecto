from fastapi import Depends
from datetime import date
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from ...database.session import get_db

class RepositorioCuentasPagar:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_resumen_pagar(self, empresa_id: UUID) -> dict:
        """
        R-013: Cuentas por Pagar - Resumen. 
        Suma de saldos pendientes de gastos.
        """
        # Nota: Asumimos que el saldo es (total - pagado). 
        # Si no hay parciales, tratamos pendiente/vencido como saldo completo.
        # Basado en pagos_gasto.obtener_total_pagado, calculamos saldos.
        
        query_general = """
            WITH saldos AS (
                SELECT 
                    g.id,
                    g.total,
                    g.fecha_vencimiento,
                    (g.total - COALESCE((SELECT SUM(monto) FROM pago_gasto WHERE gasto_id = g.id), 0)) as saldo
                FROM gasto g
                WHERE g.empresa_id = %s AND g.estado_pago != 'pagado'
            )
            SELECT 
                COALESCE(SUM(saldo), 0) as total_por_pagar,
                COALESCE(SUM(CASE WHEN fecha_vencimiento >= CURRENT_DATE THEN saldo ELSE 0 END), 0) as vigente,
                COALESCE(SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN saldo ELSE 0 END), 0) as vencido
            FROM saldos
            WHERE saldo > 0
        """
        
        query_proveedores = """
            WITH saldos AS (
                SELECT 
                    g.id,
                    g.proveedor_id,
                    g.fecha_vencimiento,
                    (g.total - COALESCE((SELECT SUM(monto) FROM pago_gasto WHERE gasto_id = g.id), 0)) as saldo
                FROM gasto g
                WHERE g.empresa_id = %s AND g.estado_pago != 'pagado'
            )
            SELECT 
                p.razon_social as proveedor,
                COUNT(s.id) as facturas_pendientes,
                SUM(s.saldo) as monto_total,
                MIN(s.fecha_vencimiento) as proximo_vencimiento
            FROM saldos s
            JOIN proveedor p ON s.proveedor_id = p.id
            WHERE s.saldo > 0
            GROUP BY p.id, p.razon_social
            ORDER BY monto_total DESC
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_general, (str(empresa_id),))
            resumen = dict(cur.fetchone() or {"total_por_pagar": 0, "vigente": 0, "vencido": 0})
            
            cur.execute(query_proveedores, (str(empresa_id),))
            por_proveedor = [dict(row) for row in cur.fetchall()]
            
            return {
                "resumen": resumen,
                "por_proveedor": por_proveedor,
                "fecha_corte": date.today()
            }

    def obtener_gastos_por_categoria(self, empresa_id: UUID, inicio: date, fin: date) -> List[dict]:
        """
        R-014: Análisis de gastos por categoría con comparativa mes anterior.
        """
        query = """
            SELECT 
                cg.nombre as categoria,
                SUM(g.total) as total,
                ROUND((SUM(g.total) / NULLIF(SUM(SUM(g.total)) OVER(), 0)) * 100, 2) as porcentaje,
                -- Comparativa básica mes anterior
                COALESCE(
                    (SELECT SUM(total) FROM gasto 
                     WHERE categoria_gasto_id = g.categoria_gasto_id 
                     AND empresa_id = g.empresa_id
                     AND fecha_emision BETWEEN (%s::date - INTERVAL '1 month') AND (%s::date - INTERVAL '1 month')
                    ), 0
                ) as total_anterior
            FROM gasto g
            JOIN categoria_gasto cg ON g.categoria_gasto_id = cg.id
            WHERE g.empresa_id = %s AND g.fecha_emision BETWEEN %s AND %s
            GROUP BY g.categoria_gasto_id, cg.nombre, g.empresa_id
            ORDER BY total DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (inicio, fin, str(empresa_id), inicio, fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_gastos_por_proveedor(self, empresa_id: UUID, inicio: date, fin: date) -> List[dict]:
        """
        R-015: Gasto total por proveedor.
        """
        query = """
            SELECT 
                p.razon_social as proveedor,
                COUNT(g.id) as cantidad_facturas,
                SUM(g.total) as total_compras,
                ROUND(AVG(g.total), 2) as promedio_factura,
                MAX(g.fecha_emision) as ultima_compra
            FROM gasto g
            JOIN proveedor p ON g.proveedor_id = p.id
            WHERE g.empresa_id = %s AND g.fecha_emision BETWEEN %s AND %s
            GROUP BY p.id, p.razon_social
            ORDER BY total_compras DESC
            LIMIT 10
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), inicio, fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_flujo_caja(self, empresa_id: UUID, inicio: date, fin: date, agrupacion: str = 'week') -> List[dict]:
        """
        R-016: Flujo de Caja (Ingresos vs Egresos).
        Ingresos vienen de sistema_facturacion.log_pago_facturas.
        Egresos vienen de pago_gasto.
        """
        # Nota: log_pago_facturas no tiene empresa_id directamente, pero facturas sí.
        # Debemos unir con facturas para filtrar por empresa.
        
        query = f"""
            WITH ingresos_periodo AS (
                SELECT 
                    DATE_TRUNC(%s, lpf.timestamp) as periodo,
                    SUM(lpf.monto) as monto
                FROM sistema_facturacion.log_pago_facturas lpf
                JOIN sistema_facturacion.facturas f ON lpf.factura_id = f.id
                WHERE f.empresa_id = %s AND lpf.timestamp::date BETWEEN %s AND %s
                GROUP BY 1
            ),
            egresos_periodo AS (
                SELECT 
                    DATE_TRUNC(%s, pg.created_at) as periodo,
                    SUM(pg.monto) as monto
                FROM pago_gasto pg
                JOIN gasto g ON pg.gasto_id = g.id
                WHERE g.empresa_id = %s AND pg.created_at::date BETWEEN %s AND %s
                GROUP BY 1
            ),
            periodos_unidos AS (
                SELECT periodo FROM ingresos_periodo
                UNION
                SELECT periodo FROM egresos_periodo
            )
            SELECT 
                TO_CHAR(pu.periodo, 'YYYY-MM-DD') as periodo,
                COALESCE(i.monto, 0) as ingresos,
                COALESCE(e.monto, 0) as egresos,
                (COALESCE(i.monto, 0) - COALESCE(e.monto, 0)) as saldo
            FROM periodos_unidos pu
            LEFT JOIN ingresos_periodo i ON pu.periodo = i.periodo
            LEFT JOIN egresos_periodo e ON pu.periodo = e.periodo
            ORDER BY pu.periodo ASC
        """
        # PostgreSQL doesn't allow string injection in group by easily with placeholders for some things,
        # but for DATE_TRUNC it works if we pass the interval name.
        
        with self.db.cursor() as cur:
            cur.execute(query, (agrupacion, str(empresa_id), inicio, fin, agrupacion, str(empresa_id), inicio, fin))
            return [dict(row) for row in cur.fetchall()]

from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta
from .....database.session import get_db

class RepositorioR032Vendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis(self, vendedor_id: UUID) -> dict:
        query = """
            SELECT
                -- 1. Por cobrar (ya depositado/pagado)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PAGADA') as por_cobrar,

                -- 2. Pendiente aprobación (en revisión)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PENDIENTE') as pendiente_aprobacion,

                -- 3. Total histórico (acumulado)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s) as total_historico,

                -- 4. Futuras comisiones en riesgo (planes que vencen en < 30 días)
                (SELECT COALESCE(SUM(c.monto), 0)
                 FROM sistema_facturacion.comisiones c
                 JOIN sistema_facturacion.pagos_suscripciones ps ON c.pago_suscripcion_id = ps.id
                 JOIN sistema_facturacion.suscripciones s ON ps.empresa_id = s.empresa_id AND s.estado = 'ACTIVA'
                 WHERE c.vendedor_id = %s 
                   AND s.fecha_fin BETWEEN NOW() AND NOW() + INTERVAL '30 days') as comisiones_en_riesgo
        """
        params = [vendedor_id, vendedor_id, vendedor_id, vendedor_id]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {}

    def obtener_detalle_comisiones(self, vendedor_id: UUID) -> List[dict]:
        query = """
            SELECT
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                c.fecha_generacion as fecha_venta,
                p.nombre as plan,
                c.monto as mi_comision,
                c.estado
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.pagos_suscripciones ps ON c.pago_suscripcion_id = ps.id
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON ps.plan_id = p.id
            WHERE c.vendedor_id = %s
            ORDER BY c.fecha_generacion DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id,))
            return [dict(row) for row in cur.fetchall()]

    def obtener_grafica_comparativa(self, vendedor_id: UUID) -> dict:
        query_mes_actual = """
            SELECT COALESCE(SUM(monto), 0) as total
            FROM sistema_facturacion.comisiones
            WHERE vendedor_id = %s 
              AND DATE_TRUNC('month', fecha_generacion) = DATE_TRUNC('month', NOW())
        """
        query_mes_anterior = """
            SELECT COALESCE(SUM(monto), 0) as total
            FROM sistema_facturacion.comisiones
            WHERE vendedor_id = %s 
              AND DATE_TRUNC('month', fecha_generacion) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        """
        with self.db.cursor() as cur:
            cur.execute(query_mes_actual, (vendedor_id,))
            actual = cur.fetchone()['total']
            
            cur.execute(query_mes_anterior, (vendedor_id,))
            anterior = cur.fetchone()['total']
            
            return {
                "mes_actual": float(actual),
                "mes_anterior": float(anterior)
            }

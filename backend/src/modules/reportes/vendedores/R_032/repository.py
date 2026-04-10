from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta, datetime
from .....database.session import get_db

class RepositorioR032Vendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        # Si se proporciona rango, usar ese; si no, usar mes actual
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, today.month, 1).isoformat()
            fecha_fin = today.isoformat()

        query = """
            SELECT
                -- 1. Por cobrar (ya depositado/pagado)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PAGADA'
                   AND fecha_generacion >= %s AND fecha_generacion <= %s) as por_cobrar,

                -- 2. Pendiente aprobación (en revisión)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PENDIENTE'
                   AND fecha_generacion >= %s AND fecha_generacion <= %s) as pendiente_aprobacion,

                -- 3. Total histórico (acumulado total, sin filtro de fecha)
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
        params = [vendedor_id, fecha_inicio, fecha_fin, vendedor_id, fecha_inicio, fecha_fin, vendedor_id, vendedor_id]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {}

    def obtener_detalle_comisiones(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, today.month, 1).isoformat()
            fecha_fin = today.isoformat()

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
              AND c.fecha_generacion >= %s AND c.fecha_generacion <= %s
            ORDER BY c.fecha_generacion DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id, fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_grafica_comparativa(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        # Si se proporciona rango, usar ese; si no, usar mes actual
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, today.month, 1).isoformat()
            fecha_fin = today.isoformat()

        # Calcular período anterior con la misma duración
        from datetime import datetime
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        delta = (d2 - d1).days + 1

        fi_ant = (d1 - timedelta(days=delta)).isoformat()
        ff_ant = (d1 - timedelta(days=1)).isoformat()

        # Determinar label para el período actual
        dias_diff = (d2 - d1).days
        if dias_diff > 30:
            periodo_label = f"{d1.strftime('%b')} - {d2.strftime('%b %Y')}"
            periodo_ant_label = f"{(d1 - timedelta(days=delta)).strftime('%b')} - {(d1 - timedelta(days=1)).strftime('%b %Y')}"
        else:
            periodo_label = f"{d1.strftime('%Y-%m-%d')} a {d2.strftime('%Y-%m-%d')}"
            periodo_ant_label = f"{(d1 - timedelta(days=delta)).strftime('%Y-%m-%d')} a {(d1 - timedelta(days=1)).strftime('%Y-%m-%d')}"

        query_actual = """
            SELECT COALESCE(SUM(monto), 0) as total
            FROM sistema_facturacion.comisiones
            WHERE vendedor_id = %s
              AND fecha_generacion >= %s AND fecha_generacion <= %s
        """
        query_anterior = """
            SELECT COALESCE(SUM(monto), 0) as total
            FROM sistema_facturacion.comisiones
            WHERE vendedor_id = %s
              AND fecha_generacion >= %s AND fecha_generacion <= %s
        """
        with self.db.cursor() as cur:
            cur.execute(query_actual, (vendedor_id, fecha_inicio, fecha_fin))
            actual = cur.fetchone()['total']

            cur.execute(query_anterior, (vendedor_id, fi_ant, ff_ant))
            anterior = cur.fetchone()['total']

            return {
                "periodo_actual": periodo_label,
                "periodo_anterior": periodo_ant_label,
                "mes_actual": float(actual),
                "mes_anterior": float(anterior)
            }

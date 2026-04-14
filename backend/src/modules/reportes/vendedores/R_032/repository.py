from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta, datetime
from .....database.session import get_db

class RepositorioR032Vendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        # 1. Por cobrar (ya depositado -> PAGADA)
        # 2. Pendiente aprobación (en revisión -> PENDIENTE)
        # 3. Total histórico (acumulado -> PAGADA total)
        # 4. Futuras comisiones en riesgo (planes < 30 días)
        
        query = """
            SELECT
                -- 1. Ya depositado (PAGADA)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PAGADA') as por_cobrar,

                -- 2. Pendiente aprobación (PENDIENTE)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PENDIENTE') as pendiente_aprobacion,

                -- 3. Total histórico (PAGADA)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PAGADA') as total_historico,

                -- 4. Futuras comisiones en riesgo
                (SELECT COALESCE(SUM(c.monto), 0)
                 FROM sistema_facturacion.comisiones c
                 JOIN sistema_facturacion.pagos_suscripciones ps ON c.pago_suscripcion_id = ps.id
                 JOIN sistema_facturacion.suscripciones s ON ps.empresa_id = s.empresa_id 
                 WHERE c.vendedor_id = %s
                   AND s.estado = 'ACTIVA'
                   AND s.fecha_fin BETWEEN NOW() AND NOW() + INTERVAL '30 days') as comisiones_en_riesgo
        """
        params = [vendedor_id, vendedor_id, vendedor_id, vendedor_id]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            if not row: return {}
            
            return {
                "por_cobrar": float(row['por_cobrar']),
                "pendiente_aprobacion": float(row['pendiente_aprobacion']),
                "total_historico": float(row['total_historico']),
                "comisiones_en_riesgo": float(row['comisiones_en_riesgo'])
            }

    def obtener_detalle_comisiones(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
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
            rows = [dict(row) for row in cur.fetchall()]
            
            # Formatear estados para visualización y asegurar tipos serializables
            for row in rows:
                row['mi_comision'] = float(row.get('mi_comision', 0))
                if row['estado'] == 'PENDIENTE':
                    row['estado_display'] = 'Pendiente'
                elif row['estado'] == 'APROBADA':
                    row['estado_display'] = 'Aprobada'
                elif row['estado'] == 'PAGADA':
                    row['estado_display'] = 'Pagada'
                else:
                    row['estado_display'] = row['estado'].capitalize()
            
            return rows

    def obtener_grafica_comparativa(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        # Calcular este mes vs mes anterior para Pie Chart
        today = date.today()
        fi_actual = date(today.year, today.month, 1)
        ff_actual = today
        
        # Mes anterior
        if today.month == 1:
            fi_anterior = date(today.year - 1, 12, 1)
        else:
            fi_anterior = date(today.year, today.month - 1, 1)
        
        # Último día del mes anterior
        ff_anterior = fi_actual - timedelta(days=1)

        query = """
            SELECT 
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s 
                   AND fecha_generacion >= %s AND fecha_generacion <= %s) as actual,
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s 
                   AND fecha_generacion >= %s AND fecha_generacion <= %s) as anterior
        """
        
        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id, fi_actual, ff_actual, vendedor_id, fi_anterior, ff_anterior))
            row = cur.fetchone()
            
            return {
                "total_actual": float(row['actual']) if row else 0,
                "total_anterior": float(row['anterior']) if row else 0
            }


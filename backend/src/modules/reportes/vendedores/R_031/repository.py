from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta
from .....database.session import get_db

class RepositorioR031Vendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        today = date.today()

        # Si se proporciona rango, usarlo; si no, usar mes actual
        if fecha_inicio and fecha_fin:
            fi_mes = fecha_inicio
            ff_mes = fecha_fin
        else:
            fi_mes = date(today.year, today.month, 1).isoformat()
            ff_mes = today.isoformat()

        # Calcular período anterior con la misma duración
        from datetime import datetime
        d1 = datetime.strptime(fi_mes, '%Y-%m-%d').date()
        d2 = datetime.strptime(ff_mes, '%Y-%m-%d').date()
        delta = (d2 - d1).days + 1

        fi_mes_ant = (d1 - timedelta(days=delta)).isoformat()
        ff_mes_ant = (d1 - timedelta(days=1)).isoformat()

        query = """
            SELECT
                -- 1. Mis empresas activas
                (SELECT COUNT(DISTINCT e.id)
                 FROM sistema_facturacion.empresas e
                 JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND s.estado = 'ACTIVA' AND s.fecha_fin >= NOW()) as activas_total,
                 
                (SELECT COUNT(id)
                 FROM sistema_facturacion.empresas
                 WHERE vendedor_id = %s AND created_at >= %s) as activas_este_mes,

                -- 2. Comisión pendiente
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.comisiones
                 WHERE vendedor_id = %s AND estado = 'PENDIENTE') as comision_pendiente,

                -- 3. Vencen pronto (< 30 días)
                (SELECT COUNT(DISTINCT s.id)
                 FROM sistema_facturacion.suscripciones s
                 JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND s.estado = 'ACTIVA' 
                   AND s.fecha_fin BETWEEN NOW() AND NOW() + INTERVAL '30 days') as vencen_pronto,

                -- 4. Planes nuevos (Este mes vs Anterior)
                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'NUEVO' AND ps.fecha_pago >= %s) as planes_nuevos_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'NUEVO' AND ps.fecha_pago BETWEEN %s AND %s) as planes_nuevos_mes_ant,

                -- 5. Upgrades (Este mes vs Anterior)
                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'UPGRADE' AND ps.fecha_pago >= %s) as upgrades_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'UPGRADE' AND ps.fecha_pago BETWEEN %s AND %s) as upgrades_mes_ant,

                -- 6. Renovaciones (Este mes vs Anterior)
                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'RENOVACION' AND ps.fecha_pago >= %s) as renovaciones_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'RENOVACION' AND ps.fecha_pago BETWEEN %s AND %s) as renovaciones_mes_ant
        """
        
        params = [
            vendedor_id, # activas_total
            vendedor_id, fi_mes, # activas_este_mes
            vendedor_id, # comision_pendiente
            vendedor_id, # vencen_pronto
            vendedor_id, fi_mes, # planes_nuevos_mes
            vendedor_id, fi_mes_ant, ff_mes_ant, # planes_nuevos_mes_ant
            vendedor_id, fi_mes, # upgrades_mes
            vendedor_id, fi_mes_ant, ff_mes_ant, # upgrades_mes_ant
            vendedor_id, fi_mes, # renovaciones_mes
            vendedor_id, fi_mes_ant, ff_mes_ant  # renovaciones_mes_ant
        ]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            data = dict(row) if row else {}
            
            # Calcular porcentajes de cambio
            def calc_pct(actual, anterior):
                if anterior == 0:
                    return 100.0 if actual > 0 else 0.0
                return round(((actual - anterior) / anterior) * 100, 1)

            data['planes_nuevos_pct'] = calc_pct(data.get('planes_nuevos_mes', 0), data.get('planes_nuevos_mes_ant', 0))
            data['upgrades_pct'] = calc_pct(data.get('upgrades_mes', 0), data.get('upgrades_mes_ant', 0))
            data['renovaciones_pct'] = calc_pct(data.get('renovaciones_mes', 0), data.get('renovaciones_mes_ant', 0))
            
            return data

    def obtener_detalle_empresas(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        # Usar mes actual si no se provee rango
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, today.month, 1).isoformat()
            fecha_fin = today.isoformat()

        query = """
            SELECT
                e.id,
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                p.nombre as plan,
                p.max_facturas_mes,
                (SELECT COUNT(f.id) FROM sistema_facturacion.facturas f
                 WHERE f.empresa_id = e.id AND f.estado != 'ANULADA'
                   AND f.fecha_emision >= %s AND f.fecha_emision <= %s) as facturas_mes,
                s.fecha_fin as prox_vencimiento,
                s.estado,
                e.created_at as fecha_registro
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id AND s.estado = 'ACTIVA'
            JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            WHERE e.vendedor_id = %s
            ORDER BY s.fecha_fin ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fecha_inicio, fecha_fin, vendedor_id))
            rows = [dict(row) for row in cur.fetchall()]
            
            now = date.today()
            for row in rows:
                # 1. % de uso
                max_f = row.get('max_facturas_mes', 0)
                used_f = row.get('facturas_mes', 0)
                row['porcentaje_uso'] = round((used_f / max_f * 100), 1) if max_f > 0 else 0
                
                # 2. Oportunidad de Upgrade
                row['oportunidad_upgrade'] = "Si" if row['porcentaje_uso'] >= 80 else "No"
                
                # 3. Formatear próximo vencimiento y estado
                venc = row.get('prox_vencimiento')
                if venc:
                    # Normalizar a date para la resta
                    from datetime import datetime
                    venc_date = venc.date() if isinstance(venc, datetime) else venc
                    diff = (venc_date - now).days
                    if diff < 0:
                        row['prox_venc_fmt'] = "Vencida"
                    elif diff < 5:
                        row['prox_venc_fmt'] = f"en menos de 5 días"
                    elif diff < 30:
                        row['prox_venc_fmt'] = f"en menos de 1 mes"
                    else:
                        row['prox_venc_fmt'] = venc.strftime('%Y-%m-%d')
                else:
                    row['prox_venc_fmt'] = "N/A"

            return rows

    def obtener_grafica_planes(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, today.month, 1).isoformat()
            fecha_fin = today.isoformat()

        query = """
            SELECT p.nombre, COUNT(ps.id) as cantidad
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.planes p ON ps.plan_id = p.id
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            WHERE e.vendedor_id = %s AND ps.estado = 'PAGADO'
              AND ps.fecha_pago >= %s AND ps.fecha_pago <= %s
            GROUP BY p.nombre
            ORDER BY cantidad DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id, fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_grafica_ventas_mes(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        if not fecha_inicio or not fecha_fin:
            today = date.today()
            fecha_inicio = date(today.year, 1, 1).isoformat()  # Año completo
            fecha_fin = today.isoformat()

        # Determinar si mostrar por mes (rango > 60 días) o por día (rango <= 60 días)
        from datetime import datetime
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        dias_diff = (d2 - d1).days

        if dias_diff > 60:
            # Mostrar por mes (formato: Ene 2026, Feb 2026, etc.)
            query = """
                SELECT TO_CHAR(DATE_TRUNC('month', ps.fecha_pago), 'Mon YYYY') as mes, SUM(ps.monto) as total
                FROM sistema_facturacion.pagos_suscripciones ps
                JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                WHERE e.vendedor_id = %s AND ps.estado = 'PAGADO'
                  AND ps.fecha_pago >= %s AND ps.fecha_pago <= %s
                GROUP BY DATE_TRUNC('month', ps.fecha_pago)
                ORDER BY DATE_TRUNC('month', ps.fecha_pago) ASC
            """
        else:
            # Mostrar por día (formato: 2026-04-01, 2026-04-02, etc.)
            query = """
                SELECT TO_CHAR(DATE(ps.fecha_pago), 'YYYY-MM-DD') as mes, SUM(ps.monto) as total
                FROM sistema_facturacion.pagos_suscripciones ps
                JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                WHERE e.vendedor_id = %s AND ps.estado = 'PAGADO'
                  AND ps.fecha_pago >= %s AND ps.fecha_pago <= %s
                GROUP BY DATE(ps.fecha_pago)
                ORDER BY DATE(ps.fecha_pago) ASC
            """

        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id, fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

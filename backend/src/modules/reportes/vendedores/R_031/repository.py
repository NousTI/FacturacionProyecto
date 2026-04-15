from fastapi import Depends
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, timedelta, datetime
from .....database.session import get_db

class RepositorioR031Vendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # =========================================================
    # MÉTODOS PÚBLICOS (ENTRADAS DE REPORTE)
    # =========================================================

    def obtener_kpis(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        today = date.today()
        fi_mes, ff_mes, fi_mes_ant, ff_mes_ant = self._calcular_rangos_kpis(fecha_inicio, fecha_fin, today)

        query = """
            SELECT
                -- 1. Mis empresas activas
                (SELECT COUNT(id)
                 FROM sistema_facturacion.empresas
                 WHERE vendedor_id = %s AND activo = TRUE) as activas_total,

                (SELECT COUNT(id)
                 FROM sistema_facturacion.empresas
                 WHERE vendedor_id = %s AND activo = TRUE
                   AND created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as activas_este_mes,

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
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'NUEVO' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as planes_nuevos_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'NUEVO' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as planes_nuevos_mes_ant,

                -- 5. Upgrades (Este mes vs Anterior)
                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'UPGRADE' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as upgrades_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'UPGRADE' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as upgrades_mes_ant,

                -- 6. Renovaciones (Este mes vs Anterior)
                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'RENOVACION' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as renovaciones_mes,

                (SELECT COUNT(ps.id)
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND ps.tipo_pago = 'RENOVACION' AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as renovaciones_mes_ant
        """
        
        params = [
            vendedor_id, # activas_total
            vendedor_id, fi_mes, ff_mes, # activas_este_mes
            vendedor_id, # comision_pendiente
            vendedor_id, # vencen_pronto
            vendedor_id, fi_mes, ff_mes, # planes_nuevos_mes
            vendedor_id, fi_mes_ant, ff_mes_ant, # planes_nuevos_mes_ant
            vendedor_id, fi_mes, ff_mes, # upgrades_mes
            vendedor_id, fi_mes_ant, ff_mes_ant, # upgrades_mes_ant
            vendedor_id, fi_mes, ff_mes, # renovaciones_mes
            vendedor_id, fi_mes_ant, ff_mes_ant  # renovaciones_mes_ant
        ]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            data = dict(row) if row else {}

            # Asegurar tipos serializables (Decimal -> float)
            data['comision_pendiente'] = float(data.get('comision_pendiente', 0))
            data['planes_nuevos_pct'] = self._calc_pct(data.get('planes_nuevos_mes', 0), data.get('planes_nuevos_mes_ant', 0))
            data['upgrades_pct'] = self._calc_pct(data.get('upgrades_mes', 0), data.get('upgrades_mes_ant', 0))
            data['renovaciones_pct'] = self._calc_pct(data.get('renovaciones_mes', 0), data.get('renovaciones_mes_ant', 0))
            
            return data

    def obtener_detalle_empresas(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
SELECT
                e.id,
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                p.nombre as plan,
                p.max_facturas_mes, p.max_usuarios, p.max_establecimientos, p.max_programaciones,
                
                -- Facturas (Actual / Cupo)
                (SELECT COUNT(f.id) FROM sistema_facturacion.facturas f
                 WHERE f.empresa_id = e.id AND f.estado != 'ANULADA'
                   AND f.fecha_emision >= s.fecha_inicio 
                   AND (s.fecha_fin IS NULL OR f.fecha_emision <= s.fecha_fin)) as facturas_actuales,
                
                -- Usuarios (Total Absoluto / Cupo)
                (SELECT COUNT(*) FROM sistema_facturacion.usuarios 
                 WHERE empresa_id = e.id) as usuarios_actuales,
                
                -- Establecimientos (Actual / Cupo)
                (SELECT COUNT(*) FROM sistema_facturacion.establecimientos 
                 WHERE empresa_id = e.id) as establecimientos_actuales,
                
                -- Programaciones (Dentro de suscripción / Cupo)
                (SELECT COUNT(*) FROM sistema_facturacion.facturacion_programada 
                 WHERE empresa_id = e.id AND activo = TRUE
                   AND created_at >= s.fecha_inicio 
                   AND (s.fecha_fin IS NULL OR created_at <= s.fecha_fin)) as programadas_actuales,
                
                -- Cálculo unificado de Porcentaje de Uso (SQL)
                ROUND(GREATEST(
                    CASE WHEN p.max_facturas_mes > 0 THEN 
                        ((SELECT COUNT(f2.id) FROM sistema_facturacion.facturas f2 WHERE f2.empresa_id = e.id AND f2.estado != 'ANULADA' AND f2.fecha_emision >= s.fecha_inicio AND (s.fecha_fin IS NULL OR f2.fecha_emision <= s.fecha_fin))::numeric / p.max_facturas_mes * 100)
                    ELSE 0 END,
                    CASE WHEN p.max_usuarios > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.usuarios u2 WHERE u2.empresa_id = e.id)::numeric / p.max_usuarios * 100)
                    ELSE 0 END,
                    CASE WHEN p.max_establecimientos > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.establecimientos est2 WHERE est2.empresa_id = e.id)::numeric / p.max_establecimientos * 100)
                    ELSE 0 END,
                    CASE WHEN p.max_programaciones > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.facturacion_programada fp2 WHERE fp2.empresa_id = e.id AND fp2.activo = TRUE AND fp2.created_at >= s.fecha_inicio AND (s.fecha_fin IS NULL OR fp2.created_at <= s.fecha_fin))::numeric / p.max_programaciones * 100)
                    ELSE 0 END
                ), 1) as porcentaje_uso,

                (SELECT u.nombres || ' ' || u.apellidos FROM sistema_facturacion.usuarios u 
                 JOIN sistema_facturacion.users us ON u.user_id = us.id 
                 WHERE u.empresa_id = e.id ORDER BY us.created_at ASC LIMIT 1) as admin_nombre,
                (SELECT us.created_at FROM sistema_facturacion.usuarios u 
                 JOIN sistema_facturacion.users us ON u.user_id = us.id 
                 WHERE u.empresa_id = e.id ORDER BY us.created_at ASC LIMIT 1) as admin_fecha_creacion,
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
            cur.execute(query, (vendedor_id,))
            rows = [dict(row) for row in cur.fetchall()]
            
            today = date.today()
            for row in rows:
                # El porcentaje_uso ya viene calculado desde SQL (GREATEST)
                row['oportunidad_upgrade'] = "Si" if row.get('porcentaje_uso', 0) >= 80 else "No"
                
                # Info Administrador
                admin_info = self._formatear_info_admin(row.get('admin_fecha_creacion'), today)
                row['admin_antiguedad'] = admin_info['antiguedad']
                row['admin_fecha_fmt'] = admin_info['fecha_fmt']
                
                # Vencimiento
                row['prox_venc_fmt'] = self._formatear_vencimiento(row.get('prox_vencimiento'), today)

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
              AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            GROUP BY p.nombre
            ORDER BY cantidad DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (vendedor_id, fecha_inicio, fecha_fin))
            return [{"nombre": row['nombre'], "cantidad": int(row['cantidad'])} for row in cur.fetchall()]

    def obtener_grafica_ventas_mes(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        f_ini, f_fin = self._calcular_rango_grafica_ventas(fecha_inicio, fecha_fin)
        
        # 1. Obtener el rango real de los datos para decidir adaptabilidad
        range_query = """
            SELECT MIN(ps.fecha_pago) as min_fecha, MAX(ps.fecha_pago) as max_fecha
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            WHERE e.vendedor_id = %s AND ps.estado = 'PAGADO'
              AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        
        with self.db.cursor() as cur:
            cur.execute(range_query, (vendedor_id, f_ini, f_fin))
            range_res = cur.fetchone()
            
            # Decidir si mostrar detalle diario
            # Caso A: El filtro de fechas ya es corto (<= 31 días)
            d1 = datetime.strptime(f_ini, '%Y-%m-%d').date()
            d2 = datetime.strptime(f_fin, '%Y-%m-%d').date()
            es_filtro_corto = (d2 - d1).days <= 31
            
            # Caso B: Los datos reales están concentrados en un mes o menos
            es_data_concentrada = False
            if range_res and range_res['min_fecha'] and range_res['max_fecha']:
                d_min = range_res['min_fecha'].date() if isinstance(range_res['min_fecha'], (datetime, date)) else range_res['min_fecha']
                d_max = range_res['max_fecha'].date() if isinstance(range_res['max_fecha'], (datetime, date)) else range_res['max_fecha']
                if (d_max - d_min).days <= 31:
                    es_data_concentrada = True

            es_rango_corto = es_filtro_corto or es_data_concentrada

            trunc_formato = "day" if es_rango_corto else "month"
            label_formato = "DD Mon" if es_rango_corto else "Mon YYYY"

            query = f"""
                SELECT TO_CHAR(DATE_TRUNC('{trunc_formato}', ps.fecha_pago), '{label_formato}') as label, 
                       SUM(ps.monto) as total
                FROM sistema_facturacion.pagos_suscripciones ps
                JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
                WHERE e.vendedor_id = %s AND ps.estado = 'PAGADO'
                  AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                GROUP BY DATE_TRUNC('{trunc_formato}', ps.fecha_pago)
                ORDER BY DATE_TRUNC('{trunc_formato}', ps.fecha_pago) ASC
            """

            cur.execute(query, (vendedor_id, f_ini, f_fin))
            return [{"mes": row['label'], "total": float(row['total'])} for row in cur.fetchall()]

    # =========================================================
    # FUNCIONES AUXILIARES (LÓGICA INTERNA)
    # =========================================================

    def _calcular_rangos_kpis(self, f_ini, f_fin, today):
        if f_ini and f_fin:
            fi = f_ini
            ff = f_fin
        else:
            fi = date(today.year, today.month, 1).isoformat()
            ff = today.isoformat()

        d1 = datetime.strptime(fi, '%Y-%m-%d').date()
        d2 = datetime.strptime(ff, '%Y-%m-%d').date()
        delta = (d2 - d1).days + 1

        fi_ant = (d1 - timedelta(days=delta)).isoformat()
        ff_ant = (d1 - timedelta(days=1)).isoformat()
        
        return fi, ff, fi_ant, ff_ant

    def _calcular_porcentaje_uso(self, row) -> float:
        pcts = []
        for max_key, cur_key in [('max_facturas_mes', 'facturas_actuales'), 
                                 ('max_usuarios', 'usuarios_actuales'), 
                                 ('max_establecimientos', 'establecimientos_actuales'),
                                 ('max_programaciones', 'programadas_actuales')]:
            limit = row.get(max_key, 0)
            if limit > 0:
                pcts.append((row.get(cur_key, 0) / limit) * 100)
        return round(max(pcts), 1) if pcts else 0.0

    def _formatear_info_admin(self, created_at, today) -> dict:
        if not created_at:
            return {"antiguedad": "N/A", "fecha_fmt": "N/A"}
        a_date = created_at.date() if isinstance(created_at, datetime) else created_at
        return {
            "antiguedad": self._calcular_antiguedad_texto(a_date, today),
            "fecha_fmt": a_date.strftime('%Y-%m-%d')
        }

    def _formatear_vencimiento(self, venc, today) -> str:
        if not venc: return "N/A"
        v_date = venc.date() if isinstance(venc, datetime) else venc
        diff = (v_date - today).days
        if diff < 0: return "Vencida"
        if diff < 5: return "en menos de 5 días"
        if diff < 30: return "en menos de 30 días"
        return v_date.strftime('%Y-%m-%d')

    def _calcular_antiguedad_texto(self, start_date, today) -> str:
        diff = today - start_date
        years = diff.days // 365
        months = (diff.days % 365) // 30
        if years > 0:
            return f"{years} año{'s' if years > 1 else ''}, {months} mes{'es' if months != 1 else ''}"
        if months > 0:
            return f"{months} mes{'es' if months != 1 else ''}"
        return f"{diff.days} día{'s' if diff.days != 1 else ''}"

    def _calcular_rango_grafica_ventas(self, fi, ff):
        if not fi or not ff:
            today = date.today()
            # Default: Últimos 12 meses
            start = date(today.year - 1, today.month, 1).isoformat()
            return start, today.isoformat()
        
        return fi, ff

    def _calc_pct(self, actual, anterior):
        if anterior == 0:
            return 100.0 if actual > 0 else 0.0
        return round(((actual - anterior) / anterior) * 100, 1)

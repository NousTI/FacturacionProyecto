from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date, timedelta
from .....database.session import get_db

class RepositorioR031:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_globales(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        today = date.today()
        first_day = date(today.year, today.month, 1)
        fi_use = fecha_inicio or first_day.isoformat()
        ff_use = fecha_fin or today.isoformat()

        # Calcular período anterior de igual duración
        fi_date = date.fromisoformat(fi_use)
        ff_date = date.fromisoformat(ff_use)
        duracion = (ff_date - fi_date).days + 1
        fi_anterior = (fi_date - timedelta(days=duracion)).isoformat()
        ff_anterior = (fi_date - timedelta(days=1)).isoformat()

        f_inicio = "%s"
        f_fin = "%s::timestamp + interval '1 day' - interval '1 second'"
        f_fin_date = "%s::date"

        query = """
            SELECT
                -- Empresas activas (suscripción activa y vigente al final del periodo)
                (SELECT COUNT(DISTINCT e.id)
                 FROM sistema_facturacion.empresas e
                 JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                 WHERE s.estado = 'ACTIVA' AND s.fecha_inicio <= {f_fin_date} AND s.fecha_fin >= {f_fin_date}) as empresas_activas,

                -- Nuevas empresas en el período
                (SELECT COUNT(id)
                 FROM sistema_facturacion.empresas
                 WHERE created_at BETWEEN {f_inicio} AND {f_fin}) as empresas_nuevas_mes,

                -- Ingresos del año de la fecha seleccionada (pagos confirmados)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM {f_fin_date})) as ingresos_anio,

                -- Ingresos del año anterior para comparativa
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM {f_fin_date}) - 1) as ingresos_anio_anterior,

                -- Ingresos en el período seleccionado
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND fecha_pago BETWEEN {f_inicio} AND {f_fin}) as ingresos_mes,

                -- Ingresos del período anterior (misma duración) para comparativa
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND fecha_pago BETWEEN %s AND %s) as ingresos_mes_anterior,

                -- Usuarios nuevos en el período
                (SELECT COUNT(id)
                 FROM sistema_facturacion.usuarios
                 WHERE created_at BETWEEN {f_inicio} AND {f_fin}) as usuarios_nuevos_mes,

                -- Tasa de crecimiento: empresas activas comparadas con el mes anterior a la fecha inicio
                (SELECT COUNT(DISTINCT s.empresa_id)
                 FROM sistema_facturacion.suscripciones s
                 WHERE s.estado = 'ACTIVA'
                   AND s.fecha_inicio <= ({f_inicio_date} - INTERVAL '1 month') 
                   AND s.fecha_fin >= ({f_inicio_date} - INTERVAL '1 month')) as empresas_activas_mes_anterior,

                -- Zona upgrade: empresas que usaron >=80 por ciento de facturas del plan en el período
                (SELECT COUNT(DISTINCT f.empresa_id)
                 FROM (
                     SELECT f.empresa_id, COUNT(f.id) as facturas_periodo
                     FROM sistema_facturacion.facturas f
                     WHERE f.fecha_emision BETWEEN {f_inicio} AND {f_fin}
                       AND f.estado != 'ANULADA'
                     GROUP BY f.empresa_id
                 ) f
                 JOIN sistema_facturacion.suscripciones s ON s.empresa_id = f.empresa_id AND s.estado = 'ACTIVA'
                 JOIN sistema_facturacion.planes p ON p.id = s.plan_id
                 WHERE f.facturas_periodo >= (p.max_facturas_mes * 0.8)) as zona_upgrade,

                -- Zona rescate: empresas bloqueadas (suscripción VENCIDA/SUSPENDIDA y empresa inactiva)
                (SELECT COUNT(DISTINCT e.id)
                 FROM sistema_facturacion.empresas e
                 JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                 WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA') AND e.activo = FALSE
                   AND s.fecha_fin BETWEEN {f_inicio} AND {f_fin}) as zona_rescate
        """

        query = query.format(
            f_inicio=f_inicio,
            f_fin=f_fin,
            f_fin_date=f_fin_date,
            f_inicio_date="%s::date"
        )

        params = [
            ff_use, ff_use,           # empresas_activas
            fi_use, ff_use,           # empresas_nuevas_mes
            ff_use,                   # ingresos_anio
            ff_use,                   # ingresos_anio_anterior
            fi_use, ff_use,           # ingresos_mes
            fi_anterior, ff_anterior, # ingresos_mes_anterior (BETWEEN %s AND %s)
            fi_use, ff_use,           # usuarios_nuevos_mes
            fi_use, fi_use,           # empresas_activas_mes_anterior
            fi_use, ff_use,           # zona_upgrade
            fi_use, ff_use            # zona_rescate
        ]

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            data = dict(row) if row else {}

            # Calcular tasas
            emp_act = int(data.get('empresas_activas', 0))
            emp_ant = int(data.get('empresas_activas_mes_anterior', 0))
            data['tasa_crecimiento'] = round(
                ((emp_act - emp_ant) / emp_ant * 100) if emp_ant > 0 else (100.0 if emp_act > 0 else 0.0), 2
            )
            rescate = int(data.get('zona_rescate', 0))
            data['tasa_abandono'] = round((rescate / emp_act * 100) if emp_act > 0 else 0.0, 2)

            ing_anio = float(data.get('ingresos_anio', 0))
            ing_anio_ant = float(data.get('ingresos_anio_anterior', 0))
            data['variacion_ingresos_anio'] = round(
                ((ing_anio - ing_anio_ant) / ing_anio_ant * 100) if ing_anio_ant > 0 else (100.0 if ing_anio > 0 else 0.0), 2
            )
            ing_mes = float(data.get('ingresos_mes', 0))
            ing_mes_ant = float(data.get('ingresos_mes_anterior', 0))
            data['variacion_ingresos_mes'] = round(
                ((ing_mes - ing_mes_ant) / ing_mes_ant * 100) if ing_mes_ant > 0 else (100.0 if ing_mes > 0 else 0.0), 2
            )
            return data

    def obtener_zona_rescate(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        """Empresas bloqueadas con deadline de 9 días desde el vencimiento."""
        query = """
            SELECT
                e.id,
                COALESCE(e.nombre_comercial, e.razon_social) as nombre_empresa,
                p.nombre as plan_nombre,
                -- Último intento de acceso: max de ultimo_acceso de todos los usuarios de la empresa
                (SELECT MAX(u2.ultimo_acceso)
                 FROM sistema_facturacion.users u2
                 JOIN sistema_facturacion.usuarios us2 ON us2.user_id = u2.id
                 WHERE us2.empresa_id = e.id) as ultimo_acceso,
                s.fecha_fin as fecha_vencimiento,
                e.email,
                e.telefono,
                -- Deadline: 9 días desde la fecha de vencimiento
                (s.fecha_fin + INTERVAL '9 days') as deadline,
                -- Tooltip data
                COALESCE(v.nombres || ' ' || v.apellidos, 'Sin vendedor') as vendedor_nombre,
                e.created_at as fecha_registro,
                NULL::text as representante
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            LEFT JOIN sistema_facturacion.vendedores v ON v.id = e.vendedor_id
            WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
              AND e.activo = FALSE
        """
        params = []
        if fecha_inicio:
            query += " AND s.fecha_fin >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND s.fecha_fin <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)
            
        query += " ORDER BY deadline ASC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_zona_upgrade(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        """Empresas con >=80 por ciento de uso de facturas del plan en el mes actual."""
        query = """
            SELECT
                e.id,
                COALESCE(e.nombre_comercial, e.razon_social) as nombre_empresa,
                p.nombre as plan_nombre,
                p.max_facturas_mes,
                COUNT(f.id) as facturas_mes,
                ROUND(COUNT(f.id)::numeric / NULLIF(p.max_facturas_mes, 0) * 100, 1) as porcentaje_uso
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id AND s.estado = 'ACTIVA'
            JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            LEFT JOIN sistema_facturacion.facturas f ON f.empresa_id = e.id
                AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                AND f.estado != 'ANULADA'
            GROUP BY e.id, e.nombre_comercial, e.razon_social, p.nombre, p.max_facturas_mes
            HAVING COUNT(f.id) >= (p.max_facturas_mes * 0.8)
            ORDER BY porcentaje_uso DESC
        """
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        with self.db.cursor() as cur:
            cur.execute(query, (fi, ff))
            return [dict(row) for row in cur.fetchall()]

    def obtener_planes_mas_vendidos(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, vendedor_id: Optional[str] = None) -> list:
        fi = fecha_inicio or date(date.today().year, 1, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            SELECT p.nombre as plan, COUNT(ps.id) as ventas, COALESCE(SUM(ps.monto), 0) as ingresos
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.planes p ON p.id = ps.plan_id
            LEFT JOIN sistema_facturacion.empresas e ON e.id = ps.empresa_id
            WHERE ps.estado = 'PAGADO'
              AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        params = [fi, ff]
        if vendedor_id:
            query += " AND e.vendedor_id = %s"
            params.append(vendedor_id)
            
        query += " GROUP BY p.id, p.nombre ORDER BY ventas DESC LIMIT 5"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_top_vendedores(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, vendedor_id: Optional[str] = None) -> list:
        fi = fecha_inicio or date(date.today().year, 1, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            SELECT
                v.nombres || ' ' || v.apellidos as vendedor,
                COUNT(DISTINCT e.id) as empresas,
                COALESCE(SUM(ps.monto), 0) as ingresos_generados
            FROM sistema_facturacion.vendedores v
            JOIN sistema_facturacion.empresas e ON e.vendedor_id = v.id
            LEFT JOIN sistema_facturacion.pagos_suscripciones ps ON ps.empresa_id = e.id AND ps.estado = 'PAGADO'
                AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            WHERE 1=1
        """
        params = [fi, ff]
        if vendedor_id:
            query += " AND v.id = %s"
            params.append(vendedor_id)
            
        query += """
            GROUP BY v.id, v.nombres, v.apellidos
            HAVING COALESCE(SUM(ps.monto), 0) > 0
            ORDER BY ingresos_generados DESC
            LIMIT 10
        """
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

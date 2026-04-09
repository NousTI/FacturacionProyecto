import json
from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioReportes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict) -> Optional[dict]:
        if data.get('parametros'): data['parametros'] = json.dumps(data['parametros'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO reporte_generado ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT * FROM reporte_generado"
        params = []
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
        query += " ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM reporte_generado WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM reporte_generado WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_metricas_vendedor(self, vendedor_id: UUID) -> dict:
        query = """
            SELECT 
                COUNT(DISTINCT e.id) as total_empresas,
                COALESCE(COUNT(DISTINCT CASE WHEN e.activo = TRUE THEN e.id END), 0) as empresas_activas,
                COUNT(u.id) as total_usuarios,
                COALESCE(COUNT(CASE WHEN u.activo = TRUE THEN u.id END), 0) as usuarios_activos
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON e.id = u.empresa_id
            WHERE e.vendedor_id = %s
        """
        
        query_crecimiento = """
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                COUNT(id) as nuevas_empresas
            FROM sistema_facturacion.empresas
            WHERE vendedor_id = %s AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY 1 ORDER BY 1 ASC
        """
        
        query_extras = """
            SELECT
                (SELECT COUNT(s.id) FROM sistema_facturacion.suscripciones s
                 JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND s.estado IN ('VENCIDA', 'SUSPENDIDA')) as total_vencidas,
                 
                (SELECT COUNT(s.id) FROM sistema_facturacion.suscripciones s
                 JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s 
                   AND s.estado = 'ACTIVA' 
                   AND s.fecha_fin BETWEEN NOW() AND NOW() + INTERVAL '15 days') as total_proximas,
                   
                (SELECT COALESCE(SUM(c.monto), 0) FROM sistema_facturacion.comisiones c
                 WHERE c.vendedor_id = %s) as monto_comisiones,
                 
                (SELECT COALESCE(SUM(c.monto), 0) FROM sistema_facturacion.comisiones c
                 WHERE c.vendedor_id = %s 
                   AND DATE_TRUNC('month', c.fecha_generacion) = DATE_TRUNC('month', NOW())) as comisiones_mes,
                   
                (SELECT COUNT(e.id) FROM sistema_facturacion.empresas e
                 WHERE e.vendedor_id = %s AND e.activo = FALSE) as empresas_inactivas
        """
        
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id),))
            row = cur.fetchone()
            metricas = dict(row) if row else {"total_empresas": 0, "empresas_activas": 0, "total_usuarios": 0, "usuarios_activos": 0}
            
            # Parametros para cada subtarea
            params_extras = (
                str(vendedor_id), # total_vencidas
                str(vendedor_id), # total_proximas
                str(vendedor_id), # monto_comisiones
                str(vendedor_id), # comisiones_mes
                str(vendedor_id)  # empresas_inactivas
            )
            cur.execute(query_extras, params_extras)
            row_extras = cur.fetchone()
            if row_extras:
                metricas.update(dict(row_extras))
            else:
                metricas.update({"total_vencidas": 0, "total_proximas": 0, "monto_comisiones": 0.0, "comisiones_mes": 0.0, "empresas_inactivas": 0})
            
            cur.execute(query_crecimiento, (str(vendedor_id),))
            metricas['tendencia_crecimiento'] = [dict(r) for r in cur.fetchall()]
            
            return metricas

    def obtener_suscripciones_vencidas(self, vendedor_id: UUID) -> List[dict]:
        query = """
            SELECT e.razon_social, e.ruc, e.telefono, e.email, s.fecha_fin, p.nombre as plan_nombre
            FROM sistema_facturacion.suscripciones s
            JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            WHERE e.vendedor_id = %s AND s.estado IN ('VENCIDA', 'SUSPENDIDA')
            ORDER BY s.fecha_fin DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_suscripciones_proximas(self, vendedor_id: UUID, dias: int = 15) -> List[dict]:
        query = """
            SELECT e.razon_social, e.ruc, e.telefono, e.email, s.fecha_fin, p.nombre as plan_nombre
            FROM sistema_facturacion.suscripciones s
            JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            WHERE e.vendedor_id = %s 
              AND s.estado = 'ACTIVA' 
              AND s.fecha_fin BETWEEN NOW() AND NOW() + (CAST(%s AS INTEGER) * INTERVAL '1 day')
            ORDER BY s.fecha_fin ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id), dias))
            return [dict(row) for row in cur.fetchall()]

    def obtener_comisiones_mes(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                e.razon_social, c.monto, c.porcentaje_aplicado, c.estado, 
                TO_CHAR(c.fecha_generacion, 'YYYY-MM-DD') as fecha_generacion,
                p.nombre as plan_nombre
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.pagos_suscripciones ps ON c.pago_suscripcion_id = ps.id
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON ps.plan_id = p.id
            WHERE c.vendedor_id = %s
        """
        params = [str(vendedor_id)]

        if fecha_inicio:
            query += " AND c.fecha_generacion >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND c.fecha_generacion <= %s"
            params.append(fecha_fin + " 23:59:59")

        query += " ORDER BY c.fecha_generacion DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_empresas_vendedor_detalle(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                e.ruc, 
                e.razon_social, 
                e.nombre_comercial,
                e.email,
                e.activo,
                TO_CHAR(e.created_at, 'YYYY-MM-DD') as fecha_registro,
                COUNT(u.id) as usuarios_registrados
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON e.id = u.empresa_id
            WHERE e.vendedor_id = %s
        """
        params = [str(vendedor_id)]

        if fecha_inicio:
            query += " AND e.created_at >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND e.created_at <= %s"
            params.append(fecha_fin + " 23:59:59")

        query += """
            GROUP BY e.id
            ORDER BY e.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ingresos_financieros(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, estado: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                TO_CHAR(ps.fecha_pago, 'YYYY-MM-DD HH24:MI:SS') as fecha_pago,
                COALESCE(e.razon_social, e.nombre_comercial) as empresa_cliente,
                'Suscripción ' || p.nombre as concepto,
                ps.monto as monto_total,
                ps.estado as estado
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON ps.plan_id = p.id
            WHERE 1=1
        """
        params = []
        if fecha_inicio:
            query += " AND ps.fecha_pago >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND ps.fecha_pago <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)
        if estado:
            query += " AND ps.estado = %s"
            params.append(estado)
            
        query += " ORDER BY ps.fecha_pago DESC NULLS LAST"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_comisiones_pagos(self, vendedor_id: Optional[str] = None, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                v.nombres || ' ' || v.apellidos as vendedor,
                TO_CHAR(c.fecha_generacion, 'YYYY-MM-DD') as periodo,
                c.monto as monto_comision,
                c.estado as estado
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.vendedores v ON c.vendedor_id = v.id
            WHERE 1=1
        """
        params = []
        if vendedor_id:
            query += " AND c.vendedor_id = %s"
            params.append(str(vendedor_id))
        if fecha_inicio:
            query += " AND c.fecha_generacion >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND c.fecha_generacion <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)
            
        query += " ORDER BY c.fecha_generacion DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    # =========================================================
    # NUEVOS REPORTES DE VENTAS (R-001 a R-005)
    # =========================================================

    def obtener_ventas_resumen(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str, establecimiento_id: Optional[UUID] = None, punto_emision_id: Optional[UUID] = None, usuario_id: Optional[UUID] = None, estado: Optional[str] = None) -> dict:
        """R-001: Agregaciones de ventas general."""
        query = """
            SELECT 
                COUNT(*) as cantidad_facturas,
                COALESCE(SUM(subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva), 0) as subtotal_total,
                COALESCE(SUM(subtotal_con_iva), 0) as subtotal_15,
                COALESCE(SUM(iva), 0) as total_iva,
                COALESCE(SUM(descuento), 0) as total_descuento,
                COALESCE(SUM(propina), 0) as total_propinas,
                COALESCE(SUM(total), 0) as total_general,
                CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as ticket_promedio
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s AND fecha_emision BETWEEN %s AND %s
        """
        params = [str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"]

        if establecimiento_id:
            query += " AND establecimiento_id = %s"
            params.append(str(establecimiento_id))
        if punto_emision_id:
            query += " AND punto_emision_id = %s"
            params.append(str(punto_emision_id))
        if usuario_id:
            query += " AND usuario_id = %s"
            params.append(str(usuario_id))
        if estado:
            query += " AND estado = %s"
            params.append(estado)
        else:
            query += " AND estado != 'ANULADA'"

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return dict(cur.fetchone())

    def obtener_ventas_por_establecimiento(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[dict]:
        """R-001: Ventas por establecimiento para gráficos."""
        query = """
            SELECT e.nombre as label, SUM(f.total) as value
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.establecimientos e ON f.establecimiento_id = e.id
            WHERE f.empresa_id = %s AND f.fecha_emision BETWEEN %s AND %s AND f.estado != 'ANULADA'
            GROUP BY e.id, e.nombre
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ventas_por_pago(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[dict]:
        """R-001: Distribución por forma de pago."""
        query = """
            SELECT fp.forma_pago_sri as cod, SUM(fp.valor) as value
            FROM sistema_facturacion.formas_pago fp
            JOIN sistema_facturacion.facturas f ON fp.factura_id = f.id
            WHERE f.empresa_id = %s AND f.fecha_emision BETWEEN %s AND %s AND f.estado != 'ANULADA'
            GROUP BY fp.forma_pago_sri
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ventas_periodicas(self, empresa_id: UUID, anio: int) -> List[dict]:
        """R-002: Ventas agrupadas por mes."""
        query = """
            SELECT 
                TO_CHAR(fecha_emision, 'YYYY-MM') as mes,
                COUNT(*) as facturas,
                SUM(subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva) as subtotal,
                SUM(iva) as iva,
                SUM(total) as total
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s AND EXTRACT(YEAR FROM fecha_emision) = %s AND estado != 'ANULADA'
            GROUP BY 1 ORDER BY 1 ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), anio))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ventas_por_usuario(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[dict]:
        """R-003: Ventas por usuario facturador."""
        query = """
            SELECT 
                CONCAT(u.nombres, ' ', u.apellidos) as usuario,
                COUNT(f.id) as facturas,
                SUM(f.total) as total_ventas,
                CASE WHEN COUNT(f.id) > 0 THEN SUM(f.total) / COUNT(f.id) ELSE 0 END as ticket_promedio
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            WHERE f.empresa_id = %s AND f.fecha_emision BETWEEN %s AND %s AND f.estado != 'ANULADA'
            GROUP BY u.id, u.nombres, u.apellidos
            ORDER BY total_ventas DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return [dict(row) for row in cur.fetchall()]

    def obtener_facturas_anuladas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str, usuario_id: Optional[UUID] = None) -> List[dict]:
        """R-004: Listado de facturas anuladas."""
        query = """
            SELECT 
                f.numero_factura,
                f.fecha_emision,
                c.razon_social as cliente,
                f.total,
                CONCAT(u.nombres, ' ', u.apellidos) as usuario_anulo,
                f.razon_anulacion as motivo,
                f.updated_at as fecha_anulacion
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            WHERE f.empresa_id = %s AND f.estado = 'ANULADA' AND f.updated_at BETWEEN %s AND %s
        """
        params = [str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"]
        if usuario_id:
            query += " AND f.usuario_id = %s"
            params.append(str(usuario_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_facturas_rechazadas_sri(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str, estado: Optional[str] = None) -> List[dict]:
        """R-005: Facturas con problemas SRI."""
        query = """
            SELECT 
                f.numero_factura,
                c.razon_social as cliente,
                l.timestamp as fecha_intento,
                l.mensajes::text as mensaje_sri,
                f.estado as estado_actual
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            JOIN (
                SELECT DISTINCT ON (factura_id) * 
                FROM sistema_facturacion.log_emision_facturas 
                ORDER BY factura_id, timestamp DESC
            ) l ON f.id = l.factura_id
            WHERE f.empresa_id = %s AND f.estado IN ('DEVUELTA', 'NO_AUTORIZADA')
            AND f.fecha_emision BETWEEN %s AND %s
        """
        params = [str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"]
        if estado:
            query += " AND f.estado = %s"
            params.append(estado)
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    # =========================================================
    # R-031: REPORTE GLOBAL SUPERADMIN
    # =========================================================

    def obtener_kpis_globales(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        fi_param = fecha_inicio
        ff_param = fecha_fin

        query = """
            SELECT
                -- Empresas activas (suscripción activa y vigente)
                (SELECT COUNT(DISTINCT e.id)
                 FROM sistema_facturacion.empresas e
                 JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                 WHERE s.estado = 'ACTIVA' AND s.fecha_inicio <= %s::date AND s.fecha_fin >= %s::date) as empresas_activas,

                -- Nuevas empresas en el período
                (SELECT COUNT(id)
                 FROM sistema_facturacion.empresas
                 WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as empresas_nuevas_mes,

                -- Ingresos del año de la fecha seleccionada (pagos confirmados)
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM %s::date)) as ingresos_anio,

                -- Ingresos del año anterior para comparativa
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM %s::date) - 1) as ingresos_anio_anterior,

                -- Ingresos en el período seleccionado
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as ingresos_mes,

                -- Ingresos del período anterior (misma duración) para comparativa
                (SELECT COALESCE(SUM(monto), 0)
                 FROM sistema_facturacion.pagos_suscripciones
                 WHERE estado = 'PAGADO'
                   AND fecha_pago BETWEEN %s AND %s) as ingresos_mes_anterior,

                -- Usuarios nuevos en el período
                (SELECT COUNT(id)
                 FROM sistema_facturacion.usuarios
                 WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as usuarios_nuevos_mes,

                -- Tasa de crecimiento: empresas activas comparadas con el mes anterior a la fecha inicio
                (SELECT COUNT(DISTINCT s.empresa_id)
                 FROM sistema_facturacion.suscripciones s
                 WHERE s.estado = 'ACTIVA'
                   AND s.fecha_inicio <= (%s::date - INTERVAL '1 month') 
                   AND s.fecha_fin >= (%s::date - INTERVAL '1 month')) as empresas_activas_mes_anterior,

                -- Zona upgrade: empresas que usaron >=80%% de facturas del plan en el período
                (SELECT COUNT(DISTINCT f.empresa_id)
                 FROM (
                     SELECT f.empresa_id, COUNT(f.id) as facturas_periodo
                     FROM sistema_facturacion.facturas f
                     WHERE f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
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
                   AND s.fecha_fin BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second') as zona_rescate
        """

        from datetime import date, timedelta
        today = date.today()
        first_day = date(today.year, today.month, 1)
        default_fi = first_day.isoformat()
        default_ff = today.isoformat()

        fi_use = fi_param or default_fi
        ff_use = ff_param or default_ff

        # Calcular período anterior de igual duración
        fi_date = date.fromisoformat(fi_use)
        ff_date = date.fromisoformat(ff_use)
        duracion = (ff_date - fi_date).days + 1
        fi_anterior = (fi_date - timedelta(days=duracion)).isoformat()
        ff_anterior = (fi_date - timedelta(days=1)).isoformat()

        params = (
            ff_use, ff_use,           # empresas_activas (al final del periodo)
            fi_use, ff_use,           # empresas_nuevas_mes
            ff_use,                   # ingresos_anio (año de ff_use)
            ff_use,                   # ingresos_anio_anterior (año de ff_use - 1)
            fi_use, ff_use,           # ingresos_mes
            fi_anterior, ff_anterior, # ingresos_mes_anterior
            fi_use, ff_use,           # usuarios_nuevos_mes
            fi_use, fi_use,           # empresas_activas_mes_anterior (mes previo a fi_use)
            fi_use, ff_use,           # zona_upgrade
            fi_use, ff_use            # zona_rescate
        )

        with self.db.cursor() as cur:
            cur.execute(query, params)
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
        """Empresas con >=80% de uso de facturas del plan en el mes actual."""
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
        from datetime import date
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        with self.db.cursor() as cur:
            cur.execute(query, (fi, ff))
            return [dict(row) for row in cur.fetchall()]

    def obtener_planes_mas_vendidos(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, vendedor_id: Optional[str] = None) -> list:
        from datetime import date
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
        from datetime import date
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

    # =========================================================
    # R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
    # =========================================================

    def obtener_kpis_comisiones_superadmin(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        vendedor_id: Optional[str] = None,
        estado: Optional[str] = None
    ) -> dict:
        query = """
            SELECT
                -- Comisiones pendientes acumuladas hasta la fecha seleccionada
                (SELECT COALESCE(SUM(c1.monto), 0)
                 FROM sistema_facturacion.comisiones c1
                 WHERE c1.estado = 'PENDIENTE'
                   AND c1.fecha_generacion <= {f_fin}
                   {v_filter_c1}) as comisiones_pendientes,

                -- Comisiones pagadas en el período
                (SELECT COALESCE(SUM(c2.monto), 0)
                 FROM sistema_facturacion.comisiones c2
                 WHERE c2.estado = 'PAGADA'
                   AND c2.fecha_pago BETWEEN {f_inicio} AND {f_fin}
                   {v_filter_c2}) as pagadas_mes,

                -- Vendedores activos en el periodo
                (SELECT COUNT(v3.id) FROM sistema_facturacion.vendedores v3 
                 WHERE v3.activo = TRUE 
                   AND v3.created_at <= {f_fin}
                   {v_filter_v3}) as vendedores_activos,

                -- Upgrades concretados
                (SELECT ROUND(
                    COUNT(DISTINCT ps.empresa_id)::numeric /
                    NULLIF((SELECT COUNT(DISTINCT ps3.empresa_id) FROM sistema_facturacion.pagos_suscripciones ps3 JOIN sistema_facturacion.empresas emp3 ON emp3.id = ps3.empresa_id WHERE ps3.estado='PAGADO' AND ps3.fecha_pago <= {f_fin} {v_filter_ps3}), 0) * 100, 1
                 )
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas emp_up ON emp_up.id = ps.empresa_id
                 WHERE ps.estado = 'PAGADO'
                   AND ps.fecha_pago BETWEEN {f_inicio} AND {f_fin}
                   {v_filter_ps}
                   AND EXISTS (
                       SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps2
                       WHERE ps2.empresa_id = ps.empresa_id
                         AND ps2.plan_id != ps.plan_id
                         AND ps2.fecha_pago < ps.fecha_pago
                   )) as porcentaje_upgrades,

                -- Clientes perdidos
                (SELECT ROUND(
                    (SELECT COUNT(DISTINCT e.id)
                     FROM sistema_facturacion.empresas e
                     JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                     WHERE s.estado IN ('VENCIDA','SUSPENDIDA') AND e.activo = FALSE
                     {v_filter_e})::numeric /
                    NULLIF((SELECT COUNT(id) FROM sistema_facturacion.empresas e2 WHERE 1=1 AND e2.created_at <= {f_fin} {v_filter_e2}), 0) * 100, 1
                )) as porcentaje_clientes_perdidos
        """
        from datetime import date
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        
        # Filtros básicos
        f_inicio = "%s"
        f_fin = "%s::timestamp + interval '1 day' - interval '1 second'"
        v_filter_c1 = ""
        v_filter_c2 = ""
        v_filter_v3 = ""
        v_filter_ps = ""
        v_filter_ps3 = ""
        v_filter_e = ""
        v_filter_e2 = ""
        
        params = [ff, fi, ff, ff, ff, fi, ff, ff] # f_fin (c1), f_inicio, f_fin (c2), f_fin (v3), f_fin (ps3), f_inicio, f_fin (ps), f_fin (e2)
        # Sequence check: 
        # 1. {f_fin} (c1)
        # 2. {f_inicio} (c2)
        # 3. {f_fin} (c2)
        # 4. {f_fin} (v3)
        # 5. {f_fin} (ps3)
        # 6. {f_inicio} (ps)
        # 7. {f_fin} (ps)
        # 8. {f_fin} (e2)

        if vendedor_id:
            v_filter_c1 = f" AND c1.vendedor_id = '{vendedor_id}'"
            v_filter_c2 = f" AND c2.vendedor_id = '{vendedor_id}'"
            v_filter_v3 = f" AND v3.id = '{vendedor_id}'"
            v_filter_ps = f" AND emp_up.vendedor_id = '{vendedor_id}'"
            v_filter_ps3 = f" AND emp3.vendedor_id = '{vendedor_id}'"
            v_filter_e = f" AND e.vendedor_id = '{vendedor_id}'"
            v_filter_e2 = f" AND e2.vendedor_id = '{vendedor_id}'"
        
        query = query.format(
            f_inicio=f_inicio,
            f_fin=f_fin,
            v_filter_c1=v_filter_c1,
            v_filter_c2=v_filter_c2,
            v_filter_v3=v_filter_v3,
            v_filter_ps=v_filter_ps,
            v_filter_ps3=v_filter_ps3,
            v_filter_e=v_filter_e,
            v_filter_e2=v_filter_e2
        )

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {}

    def obtener_detalle_comisiones_superadmin(
        self,
        vendedor_id: Optional[str] = None,
        estado: Optional[str] = None,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None
    ) -> list:
        query = """
            SELECT
                v.nombres || ' ' || v.apellidos as vendedor,
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                -- Tipo de venta: NUEVA si no hay pagos anteriores, RENOVACION si hay, UPGRADE si cambió de plan
                CASE
                    WHEN NOT EXISTS (
                        SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps_prev
                        WHERE ps_prev.empresa_id = ps.empresa_id AND ps_prev.fecha_pago < ps.fecha_pago
                    ) THEN 'Nueva'
                    WHEN EXISTS (
                        SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps_prev2
                        WHERE ps_prev2.empresa_id = ps.empresa_id
                          AND ps_prev2.plan_id != ps.plan_id
                          AND ps_prev2.fecha_pago < ps.fecha_pago
                    ) THEN 'Upgrade'
                    ELSE 'Renovación'
                END as tipo_venta,
                p.nombre as plan,
                c.monto as comision,
                c.estado,
                TO_CHAR(c.fecha_generacion, 'YYYY-MM-DD') as fecha
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.vendedores v ON v.id = c.vendedor_id
            JOIN sistema_facturacion.pagos_suscripciones ps ON ps.id = c.pago_suscripcion_id
            JOIN sistema_facturacion.empresas e ON e.id = ps.empresa_id
            JOIN sistema_facturacion.planes p ON p.id = ps.plan_id
            WHERE 1=1
        """
        params = []
        if vendedor_id:
            query += " AND c.vendedor_id = %s"
            params.append(vendedor_id)
        if estado:
            query += " AND c.estado = %s"
            params.append(estado)
        if fecha_inicio:
            query += " AND c.fecha_generacion >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND c.fecha_generacion <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)
        query += " ORDER BY c.fecha_generacion DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    # =========================================================
    # R-033: USO DEL SISTEMA POR EMPRESA (SUPERADMIN)
    # =========================================================

    def obtener_uso_sistema_por_empresa(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        from datetime import date
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            SELECT
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                COUNT(DISTINCT u.id) as total_usuarios,
                COUNT(DISTINCT CASE WHEN u.activo = TRUE THEN u.id END) as usuarios_activos,
                -- Facturas en el período seleccionado
                COALESCE((
                    SELECT COUNT(f.id)
                    FROM sistema_facturacion.facturas f
                    WHERE f.empresa_id = e.id
                      AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                      AND f.estado != 'ANULADA'
                ), 0) as facturas_mes,
                p.max_facturas_mes,
                -- Porcentaje de uso de facturas
                CASE
                    WHEN p.max_facturas_mes > 0 THEN
                        ROUND(
                            COALESCE((
                                SELECT COUNT(f.id)
                                FROM sistema_facturacion.facturas f
                                WHERE f.empresa_id = e.id
                                  AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                                  AND f.estado != 'ANULADA'
                            ), 0)::numeric / p.max_facturas_mes * 100, 1
                        )
                    ELSE 0
                END as porcentaje_uso,
                -- Módulos activos: proxy por tablas existentes (5 módulos)
                (
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.establecimientos est WHERE est.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.productos prod WHERE prod.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.clientes cli WHERE cli.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.proveedores prov WHERE prov.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.facturas fac WHERE fac.empresa_id = e.id) THEN 1 ELSE 0 END)
                ) as modulos_usados,
                5 as modulos_total,
                p.nombre as plan_nombre,
                s.estado as estado_suscripcion,
                (
                    SELECT MAX(usr.ultimo_acceso)
                    FROM sistema_facturacion.users usr
                    JOIN sistema_facturacion.usuarios usu ON usu.user_id = usr.id
                    WHERE usu.empresa_id = e.id
                ) as ultimo_acceso
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON u.empresa_id = e.id
            LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id AND s.estado = 'ACTIVA'
            LEFT JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            WHERE e.activo = TRUE
            GROUP BY e.id, e.nombre_comercial, e.razon_social, p.nombre, p.max_facturas_mes, s.estado
            ORDER BY porcentaje_uso DESC NULLS LAST
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fi, ff, fi, ff))
            return [dict(row) for row in cur.fetchall()]

    def obtener_modulos_mas_usados(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        """Distribución de uso de módulos como porcentaje sobre empresas activas."""
        from datetime import date
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            WITH empresas_activas AS (
                SELECT COUNT(DISTINCT e.id) as total
                FROM sistema_facturacion.empresas e
                JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                WHERE s.estado = 'ACTIVA' AND e.activo = TRUE
            )
            SELECT modulo, COUNT(DISTINCT empresa_id) as empresas_usando,
                   ROUND(COUNT(DISTINCT empresa_id)::numeric / NULLIF((SELECT total FROM empresas_activas), 0) * 100, 1) as porcentaje
            FROM (
                SELECT 'Facturación' as modulo, empresa_id FROM sistema_facturacion.facturas
                    WHERE fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                UNION ALL SELECT 'Clientes', empresa_id FROM sistema_facturacion.clientes
                    WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                UNION ALL SELECT 'Productos', empresa_id FROM sistema_facturacion.productos
                    WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                UNION ALL SELECT 'Proveedores', empresa_id FROM sistema_facturacion.proveedores
                    WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                UNION ALL SELECT 'Establecimientos', empresa_id FROM sistema_facturacion.establecimientos
                    WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            ) datos
            GROUP BY modulo
            ORDER BY empresas_usando DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fi, ff, fi, ff, fi, ff, fi, ff, fi, ff))
            return [dict(row) for row in cur.fetchall()]

    def obtener_promedio_usuarios_por_empresa(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        query = """
            SELECT
                ROUND(AVG(cnt), 1) as promedio_usuarios,
                MAX(cnt) as max_usuarios,
                MIN(cnt) as min_usuarios
            FROM (
                -- Usuarios registrados hasta la fecha fin del periodo
                SELECT e.id, COUNT(u.id) as cnt
                FROM sistema_facturacion.empresas e
                LEFT JOIN sistema_facturacion.usuarios u ON u.empresa_id = e.id
                    AND u.created_at <= %s::timestamp + interval '1 day'
                WHERE e.activo = TRUE
                GROUP BY e.id
            ) sub
        """
        from datetime import date
        ff = fecha_fin or date.today().isoformat()
        with self.db.cursor() as cur:
            cur.execute(query, (ff,))
            row = cur.fetchone()
            return dict(row) if row else {}


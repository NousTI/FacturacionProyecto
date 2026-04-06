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

    def obtener_comisiones_mes(self, vendedor_id: UUID) -> List[dict]:
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
            ORDER BY c.fecha_generacion DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id),))
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

    def obtener_estado_resultados(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> dict:
        """Obtiene datos para el Estado de Resultados (PyG)."""
        res = {}
        with self.db.cursor() as cur:
            # 1. Ingresos
            cur.execute("""
                SELECT COALESCE(SUM(total), 0) as total, COALESCE(SUM(total_descuento), 0) as descuentos
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado = 'AUTORIZADA'
                AND fecha_emision BETWEEN %s AND %s
            """, (str(empresa_id), fecha_inicio, fecha_fin))
            row_ingresos = cur.fetchone()
            ventas = float(row_ingresos['total'])
            descuentos = float(row_ingresos['descuentos'])
            res['ventas'] = ventas
            res['descuentos'] = descuentos
            res['ingresos_netos'] = ventas - descuentos

            # 2. Costo de Ventas (Desde Movimientos de Inventario)
            cur.execute("""
                SELECT COALESCE(SUM(costo_total), 0) as total
                FROM sistema_facturacion.movimientos_inventario
                WHERE empresa_id = %s AND tipo_movimiento = 'SALIDA'
                AND created_at::date BETWEEN %s AND %s
            """, (str(empresa_id), fecha_inicio, fecha_fin))
            res['costo_ventas'] = float(cur.fetchone()['total'])

            # 3. Gastos Operativos (Agrupados por categoría)
            cur.execute("""
                SELECT cg.nombre, SUM(g.total) as total
                FROM sistema_facturacion.gasto g
                JOIN sistema_facturacion.categoria_gasto cg ON g.categoria_id = cg.id
                WHERE g.empresa_id = %s AND cg.tipo = 'OPERATIVO'
                AND g.fecha_emision BETWEEN %s AND %s
                GROUP BY cg.nombre
            """, (str(empresa_id), fecha_inicio, fecha_fin))
            gastos_op = [dict(r) for r in cur.fetchall()]
            res['gastos_operativos'] = [{"nombre": g['nombre'], "valor": float(g['total'])} for g in gastos_op]
            res['total_gastos_operativos'] = sum(g['valor'] for g in res['gastos_operativos'])

            # 4. Otros Ingresos/Gastos
            cur.execute("""
                SELECT COALESCE(SUM(g.total), 0) as total
                FROM sistema_facturacion.gasto g
                JOIN sistema_facturacion.categoria_gasto cg ON g.categoria_id = cg.id
                WHERE g.empresa_id = %s AND cg.tipo = 'FINANCIERO'
                AND g.fecha_emision BETWEEN %s AND %s
            """, (str(empresa_id), fecha_inicio, fecha_fin))
            res['gastos_financieros'] = float(cur.fetchone()['total'])

            res['otros_ingresos'] = 0.0 # Placeholder si no hay tabla específica

        return res

    def obtener_reporte_iva(self, empresa_id: UUID, mes: int, anio: int) -> dict:
        """Obtiene datos para el Reporte de IVA (Formulario 104)."""
        res = {}
        with self.db.cursor() as cur:
            # Ventas Tarifa 0% y 12/15%
            # Nota: Asumimos código '2' para 12%, '4' para 0%, y campos base_0, base_imponible, valor_iva en facturas_detalle
            cur.execute("""
                SELECT 
                    SUM(CASE WHEN tarifa = '0' THEN subtotal ELSE 0 END) as ventas_0,
                    SUM(CASE WHEN tarifa != '0' THEN subtotal ELSE 0 END) as base_gravada,
                    SUM(CASE WHEN tarifa != '0' THEN valor_iva ELSE 0 END) as iva_cobrado
                FROM sistema_facturacion.facturas f
                JOIN sistema_facturacion.facturas_detalle fd ON f.id = fd.factura_id
                WHERE f.empresa_id = %s AND f.estado = 'AUTORIZADA'
                AND EXTRACT(MONTH FROM f.fecha_emision) = %s
                AND EXTRACT(YEAR FROM f.fecha_emision) = %s
            """, (str(empresa_id), mes, anio))
            row_v = cur.fetchone()
            res['ventas_tarifa_0'] = float(row_v['ventas_0'] or 0)
            res['ventas_tarifa_gravada'] = float(row_v['base_gravada'] or 0)
            res['iva_cobrado'] = float(row_v['iva_cobrado'] or 0)

            # Compras (Gastos)
            cur.execute("""
                SELECT 
                    SUM(CASE WHEN iva = 0 THEN subtotal ELSE 0 END) as compras_0,
                    SUM(CASE WHEN iva > 0 THEN subtotal ELSE 0 END) as compras_gravada,
                    SUM(iva) as iva_pagado
                FROM sistema_facturacion.gasto
                WHERE empresa_id = %s
                AND EXTRACT(MONTH FROM fecha_emision) = %s
                AND EXTRACT(YEAR FROM fecha_emision) = %s
            """, (str(empresa_id), mes, anio))
            row_c = cur.fetchone()
            res['compras_tarifa_0'] = float(row_c['compras_0'] or 0)
            res['compras_tarifa_gravada'] = float(row_c['compras_gravada'] or 0)
            res['iva_pagado'] = float(row_c['iva_pagado'] or 0)

        return res


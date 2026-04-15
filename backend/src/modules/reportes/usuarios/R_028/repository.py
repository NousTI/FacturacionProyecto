from uuid import UUID
from typing import Dict, Any, List
from .....database.session import get_db
from fastapi import Depends
from .....constants.sri_constants import SRI_FORMAS_PAGO

class RepositorioR028:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_financieros(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene indicadores clave financieros (Ventas del periodo y Recaudación real del periodo)."""
        # 1. Ventas Totales y Facturas Emitidas (Basado en fecha de emisión)
        query_ventas = """
            SELECT
                COALESCE(SUM(cc.monto_total), 0) as total_facturado,
                COUNT(cc.id) as facturas_emitidas
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE cc.empresa_id = %s
              AND f.fecha_emision BETWEEN %s AND %s
              AND f.estado = 'AUTORIZADA'
        """
        
        # 2. Recaudación Real (Dinero que entró en el periodo, sin importar cuando se emitió la factura)
        query_recaudado = """
            SELECT COALESCE(SUM(p.monto), 0) as total_recaudado
            FROM sistema_facturacion.pagos_factura p
            JOIN sistema_facturacion.cuentas_cobrar cc ON p.cuenta_cobrar_id = cc.id
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE f.empresa_id = %s
              AND p.fecha_pago BETWEEN %s AND %s
              AND f.estado = 'AUTORIZADA'
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_ventas, (str(empresa_id), fecha_inicio, fecha_fin))
            v = cur.fetchone()
            
            cur.execute(query_recaudado, (str(empresa_id), fecha_inicio, fecha_fin))
            r = cur.fetchone()
            
            return {
                "total_facturado": v['total_facturado'],
                "total_recaudado": r['total_recaudado'],
                "facturas_emitidas": v['facturas_emitidas']
            }

    def obtener_desglose_pagos(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Desglose por dinero REAL ingresado según el método de pago (del flujo de caja)."""
        query = """
            SELECT
                COALESCE(SUM(p.monto) FILTER (WHERE p.metodo_pago_sri = '01'), 0) as efectivo,
                COALESCE(SUM(p.monto) FILTER (WHERE p.metodo_pago_sri IN ('16', '18', '19')), 0) as tarjeta,
                COALESCE(SUM(p.monto) FILTER (WHERE p.metodo_pago_sri NOT IN ('01', '16', '18', '19')), 0) as otros
            FROM sistema_facturacion.pagos_factura p
            JOIN sistema_facturacion.cuentas_cobrar cc ON p.cuenta_cobrar_id = cc.id
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE f.empresa_id = %s
              AND p.fecha_pago BETWEEN %s AND %s
              AND f.estado = 'AUTORIZADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            result = cur.fetchone()
            return dict(result) if result else {"efectivo": 0, "tarjeta": 0, "otros": 0}

    def obtener_datos_cartera(self, empresa_id: UUID) -> Dict[str, Any]:
        """Datos de cuentas por cobrar para dashboard."""
        query = """
            SELECT
                COALESCE(SUM(cc.saldo_pendiente), 0) as por_cobrar_total,
                COALESCE(SUM(cc.saldo_pendiente) FILTER (WHERE CURRENT_DATE - cc.fecha_vencimiento > 30), 0) as en_mora_30
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 AND f.estado = 'AUTORIZADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            result = cur.fetchone()
            return dict(result) if result else {"por_cobrar_total": 0, "en_mora_30": 0}

    def obtener_clientes_metricas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Clientes nuevos (período) y VIP (año completo del período)."""
        from datetime import datetime
        anio = datetime.strptime(fecha_inicio, '%Y-%m-%d').year
        anio_inicio = f"{anio}-01-01"
        anio_fin    = f"{anio}-12-31"

        # 1. Clientes nuevos en el período seleccionado
        query_nuevos = """
            SELECT COUNT(*) as count
            FROM sistema_facturacion.clientes
            WHERE empresa_id = %s AND created_at BETWEEN %s AND %s
        """

        # 2. Clientes VIP — criterio anual: >= 4 compras en el año, acumulan el 20% del promedio
        #    mensual de ventas totales, y 0 días de mora desde su primer compra
        query_vip = """
            WITH stats_clientes AS (
                SELECT
                    cliente_id,
                    COUNT(*) as frecuencia,
                    SUM(total) as total_gastado
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado = 'AUTORIZADA'
                  AND fecha_emision BETWEEN %s AND %s
                GROUP BY cliente_id
                HAVING COUNT(*) >= 4
            ),
            ventas_totales AS (
                SELECT COALESCE(SUM(total) / 12.0, 1) as promedio_mensual
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado = 'AUTORIZADA'
                  AND fecha_emision BETWEEN %s AND %s
            ),
            mora_clientes AS (
                SELECT DISTINCT cliente_id
                FROM sistema_facturacion.cuentas_cobrar
                WHERE empresa_id = %s AND saldo_pendiente > 0
                  AND fecha_vencimiento < CURRENT_DATE
            )
            SELECT COUNT(sc.cliente_id) as vip_count
            FROM stats_clientes sc
            CROSS JOIN ventas_totales vt
            WHERE sc.total_gastado >= (vt.promedio_mensual * 0.2)
              AND sc.cliente_id NOT IN (SELECT cliente_id FROM mora_clientes)
        """

        with self.db.cursor() as cur:
            cur.execute(query_nuevos, (str(empresa_id), fecha_inicio, fecha_fin))
            row_nuevos = cur.fetchone()
            nuevos = row_nuevos['count'] if row_nuevos else 0

            cur.execute(query_vip, (
                str(empresa_id), anio_inicio, anio_fin,
                str(empresa_id), anio_inicio, anio_fin,
                str(empresa_id)
            ))
            row_vips = cur.fetchone()
            vips = row_vips['vip_count'] if row_vips else 0

        return {"clientes_nuevos": nuevos, "clientes_vip": vips}

    def obtener_radar_gestion(self, empresa_id: UUID) -> List[Dict[str, Any]]:
        """Radar de gestión inmediata: ventas en mora >5 días y stock crítico."""
        radar = []

        # 1. Ventas en mora > 5 días — responsable con rol/nombre
        query_mora = """
            SELECT
                'Venta' as origen,
                'Factura #' || f.numero_factura || ' – ' || c.razon_social as detalle,
                cc.saldo_pendiente as monto,
                'Mora ' || (CURRENT_DATE - cc.fecha_vencimiento) || ' días' as estado,
                COALESCE(er.nombre, 'Sin rol') || ' / ' || COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') as responsable
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            LEFT JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            LEFT JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0
              AND (CURRENT_DATE - cc.fecha_vencimiento) > 5
            ORDER BY cc.fecha_vencimiento ASC
            LIMIT 5
        """

        # 2. Stock crítico (< 10 unidades)
        query_stock = """
            SELECT
                'Inventario' as origen,
                nombre || ' (quedan ' || stock_actual || ')' as detalle,
                NULL as monto,
                'Stock Crítico' as estado,
                'Bodega' as responsable
            FROM sistema_facturacion.productos
            WHERE empresa_id = %s AND activo = TRUE AND maneja_inventario = TRUE
              AND stock_actual < 10
            ORDER BY stock_actual ASC
            LIMIT 3
        """

        with self.db.cursor() as cur:
            cur.execute(query_mora, (str(empresa_id),))
            radar.extend([dict(r) for r in cur.fetchall()])

            cur.execute(query_stock, (str(empresa_id),))
            radar.extend([dict(r) for r in cur.fetchall()])

        return radar

    def obtener_monitor_productos(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Monitor de rentabilidad (Top 5 productos por cantidad vendida)."""
        query = """
            SELECT
                p.nombre as productos,
                COALESCE(SUM(fd.cantidad), 0)::INTEGER as vendidos,
                p.stock_actual as existencias,
                COALESCE(SUM(fd.cantidad * (fd.precio_unitario - COALESCE(p.costo, 0))), 0) as utilidad_neta,
                CASE
                    WHEN p.stock_actual < 10 THEN 'Stock Crítico'
                    WHEN p.stock_actual < 20 THEN 'Stock en alerta'
                    ELSE 'Stock saludable'
                END as estado
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.facturas_detalle fd ON fd.producto_id = p.id
            LEFT JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE p.empresa_id = %s
              AND (f.id IS NULL OR (f.estado = 'AUTORIZADA' AND f.fecha_emision BETWEEN %s AND %s))
            GROUP BY p.id, p.nombre, p.stock_actual, p.costo
            ORDER BY vendidos DESC
            LIMIT 5
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_monitor_productos_por_utilidad(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Monitor de rentabilidad (Top 5 productos por utilidad generada)."""
        query = """
            SELECT
                p.nombre as productos,
                COALESCE(SUM(fd.cantidad), 0)::INTEGER as vendidos,
                p.stock_actual as existencias,
                COALESCE(SUM(fd.cantidad * (fd.precio_unitario - COALESCE(p.costo, 0))), 0) as utilidad_neta,
                CASE
                    WHEN p.stock_actual < 10 THEN 'Stock Crítico'
                    WHEN p.stock_actual < 20 THEN 'Stock en alerta'
                    ELSE 'Stock saludable'
                END as estado
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.facturas_detalle fd ON fd.producto_id = p.id
            LEFT JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE p.empresa_id = %s
              AND (f.id IS NULL OR (f.estado = 'AUTORIZADA' AND f.fecha_emision BETWEEN %s AND %s))
            GROUP BY p.id, p.nombre, p.stock_actual, p.costo
            ORDER BY utilidad_neta DESC
            LIMIT 5
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_gastos_detalle(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene total de gastos del período para comparativa."""
        query = """
            SELECT
                COALESCE(SUM(total), 0) as total_gastos
            FROM sistema_facturacion.gastos
            WHERE empresa_id = %s AND fecha_emision BETWEEN %s AND %s AND deleted_at IS NULL
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            result = cur.fetchone()
            return dict(result) if result else {"total_gastos": 0}

    def obtener_formas_pago_detalle(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Detalle de todas las formas de pago reales registradas en el periodo."""
        # Se utilizan las constantes globales para evitar hardcodeo
        query = """
            SELECT
                p.metodo_pago_sri,
                COALESCE(SUM(p.monto), 0) as total
            FROM sistema_facturacion.pagos_factura p
            JOIN sistema_facturacion.cuentas_cobrar cc ON p.cuenta_cobrar_id = cc.id
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE f.empresa_id = %s
              AND p.fecha_pago BETWEEN %s AND %s
              AND f.estado = 'AUTORIZADA'
            GROUP BY p.metodo_pago_sri
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            totales = {row['metodo_pago_sri']: float(row['total']) for row in cur.fetchall()}

        return [
            {"metodo_pago": fp["codigo"], "label": fp["label"], "total": totales.get(fp["codigo"], 0.0)}
            for fp in SRI_FORMAS_PAGO
        ]

    def obtener_costo_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> float:
        """Costo total de los productos vendidos en el período (para calcular utilidad neta real)."""
        query = """
            SELECT COALESCE(SUM(fd.cantidad * COALESCE(p.costo, 0)), 0) as costo_ventas
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            LEFT JOIN sistema_facturacion.productos p ON fd.producto_id = p.id
            WHERE f.empresa_id = %s
              AND f.fecha_emision BETWEEN %s AND %s
              AND f.estado = 'AUTORIZADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            result = cur.fetchone()
            return float(result['costo_ventas']) if result else 0.0

    def obtener_ventas_anio_anterior(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene ventas del año anterior para comparativa gráfica."""
        from datetime import datetime, timedelta
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')

        # Año anterior
        prev_inicio = (d1 - timedelta(days=365)).strftime('%Y-%m-%d')
        prev_fin = (d2 - timedelta(days=365)).strftime('%Y-%m-%d')

        query = """
            SELECT
                COALESCE(SUM(total), 0) as total_anio_anterior
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s
              AND fecha_emision BETWEEN %s AND %s
              AND estado = 'AUTORIZADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), prev_inicio, prev_fin))
            result = cur.fetchone()
            return dict(result) if result else {"total_anio_anterior": 0}

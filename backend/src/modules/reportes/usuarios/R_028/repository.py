from uuid import UUID
from typing import Dict, Any, List
from .....database.session import get_db
from fastapi import Depends

class RepositorioR028:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene indicadores clave de ventas (Total Facturado)."""
        query = """
            SELECT 
                COALESCE(SUM(total), 0) as total_facturado,
                COUNT(*) as facturas_emitidas
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s 
              AND fecha_emision BETWEEN %s AND %s
              AND estado != 'ANULADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return dict(cur.fetchone())

    def obtener_desglose_pagos(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Desglose por forma de pago (Efectivo, Tarjeta, Otros)."""
        query = """
            SELECT 
                COALESCE(SUM(fp.valor) FILTER (WHERE fp.forma_pago_sri = '01'), 0) as efectivo,
                COALESCE(SUM(fp.valor) FILTER (WHERE fp.forma_pago_sri IN ('16','19','20')), 0) as tarjeta,
                COALESCE(SUM(fp.valor) FILTER (WHERE fp.forma_pago_sri NOT IN ('01','16','19','20')), 0) as otros
            FROM sistema_facturacion.formas_pago fp
            JOIN sistema_facturacion.facturas f ON fp.factura_id = f.id
            WHERE f.empresa_id = %s 
              AND f.fecha_emision BETWEEN %s AND %s
              AND f.estado != 'ANULADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return dict(cur.fetchone())

    def obtener_datos_cartera(self, empresa_id: UUID) -> Dict[str, Any]:
        """Datos de cuentas por cobrar para dashboard."""
        query = """
            SELECT 
                COALESCE(SUM(saldo_pendiente), 0) as por_cobrar_total,
                COALESCE(SUM(saldo_pendiente) FILTER (WHERE CURRENT_DATE - fecha_vencimiento >= 30), 0) as en_mora_30
            FROM sistema_facturacion.cuentas_cobrar
            WHERE empresa_id = %s AND saldo_pendiente > 0
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return dict(cur.fetchone())

    def obtener_clientes_metricas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Clientes nuevos y VIP."""
        # 1. Clientes nuevos
        query_nuevos = "SELECT COUNT(*) FROM sistema_facturacion.clientes WHERE empresa_id = %s AND created_at BETWEEN %s AND %s"
        
        # 2. Clientes VIP (Criterio: 20% promedio ventas, >= 4 veces/mes, 0 días mora)
        query_vip = """
            WITH stats_clientes AS (
                SELECT 
                    cliente_id,
                    COUNT(*) as frecuencia,
                    SUM(total) as total_gastado
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado != 'ANULADA'
                  AND fecha_emision BETWEEN %s AND %s
                GROUP BY cliente_id
                HAVING COUNT(*) >= 4
            ),
            ventas_totales AS (
                SELECT COALESCE(SUM(total), 1) as total_empresa FROM sistema_facturacion.facturas 
                WHERE empresa_id = %s AND estado != 'ANULADA' AND fecha_emision BETWEEN %s AND %s
            ),
            mora_clientes AS (
                SELECT cliente_id FROM sistema_facturacion.cuentas_cobrar
                WHERE empresa_id = %s AND saldo_pendiente > 0 AND fecha_vencimiento < CURRENT_DATE
                GROUP BY cliente_id
            )
            SELECT COUNT(sc.cliente_id) as vip_count
            FROM stats_clientes sc
            CROSS JOIN ventas_totales vt
            WHERE sc.total_gastado >= (vt.total_empresa * 0.2)
              AND sc.cliente_id NOT IN (SELECT cliente_id FROM mora_clientes)
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_nuevos, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            row_nuevos = cur.fetchone()
            nuevos = row_nuevos['count'] if row_nuevos else 0
            
            cur.execute(query_vip, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59", str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59", str(empresa_id)))
            row_vips = cur.fetchone()
            vips = row_vips['vip_count'] if row_vips else 0
            
        return {"clientes_nuevos": nuevos, "clientes_vip": vips}

    def obtener_radar_gestion(self, empresa_id: UUID) -> List[Dict[str, Any]]:
        """Radar de gestión inmediata (Ventas mora > 5 días, Stock crítico)."""
        radar = []
        
        # 1. Ventas en mora > 5 días
        query_mora = """
            SELECT 
                'Venta' as origen,
                'Factura #' || f.numero_factura || ' - ' || c.razon_social as detalle,
                cc.saldo_pendiente as monto,
                'Mora ' || (CURRENT_DATE - cc.fecha_vencimiento) || ' días' as estado,
                u.nombres as responsable
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 
              AND (CURRENT_DATE - cc.fecha_vencimiento) >= 5
            ORDER BY cc.fecha_vencimiento ASC LIMIT 2
        """
        
        # 2. Stock Crítico (< 10 unidades)
        query_stock = """
            SELECT 
                'Inventario' as origen,
                nombre || ' (quedan ' || stock_actual || ')' as detalle,
                0 as monto,
                'Stock Crítico' as estado,
                'Bodega' as responsable
            FROM sistema_facturacion.productos
            WHERE empresa_id = %s AND activo = TRUE AND maneja_inventario = TRUE
              AND stock_actual < 10
            LIMIT 2
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_mora, (str(empresa_id),))
            radar.extend([dict(row) for row in cur.fetchall()])
            
            cur.execute(query_stock, (str(empresa_id),))
            radar.extend([dict(row) for row in cur.fetchall()])
            
        # Añadir dummy de caja si no hay resultados para que el radar no esté vacío
        if not radar:
            radar.append({
                "origen": "Caja",
                "detalle": "Apertura de caja principal",
                "monto": 0.0,
                "estado": "Pendiente Cierre",
                "responsable": "Admin"
            })
            
        return radar

    def obtener_monitor_productos(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Monitor de rentabilidad (Top 5 productos)."""
        query = """
            SELECT 
                p.nombre as productos,
                SUM(fd.cantidad) as vendidos,
                p.stock_actual as existencias,
                SUM(fd.cantidad * (fd.precio_unitario - COALESCE(p.costo, 0))) as utilidad_neta,
                CASE 
                    WHEN p.stock_actual < 10 THEN 'Stock Crítico'
                    WHEN p.stock_actual < 20 THEN 'Stock en alerta'
                    ELSE 'Stock saludable'
                END as estado
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            JOIN sistema_facturacion.productos p ON fd.producto_id = p.id
            WHERE f.empresa_id = %s AND f.estado != 'ANULADA'
              AND f.fecha_emision BETWEEN %s AND %s
            GROUP BY p.id, p.nombre, p.stock_actual, p.costo
            ORDER BY vendidos DESC
            LIMIT 5
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return [dict(row) for row in cur.fetchall()]

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


    # =========================================================
    # REPORTES VENDEDORES (MOVIDOS A /vendedores/...)
    # =========================================================


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
    # R-031: REPORTE GLOBAL SUPERADMIN (MOVIDO A superadmin/R_031/repository.py)
    # =========================================================

    # =========================================================
    # R-032: COMISIONES POR VENDEDOR (MOVIDO A superadmin/R_032/repository.py)
    # =========================================================

    # =========================================================
    # R-033: USO DEL SISTEMA POR EMPRESA (MOVIDO A superadmin/R_033/repository.py)
    # =========================================================

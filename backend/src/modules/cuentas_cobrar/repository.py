from fastapi import Depends
from datetime import date
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioCuentasCobrar:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_cuenta(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.cuentas_cobrar ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.cuentas_cobrar WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_cuentas(self, empresa_id: Optional[UUID] = None, cliente_id: Optional[UUID] = None, factura_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.cuentas_cobrar"
        params = []
        conditions = []
        
        if empresa_id:
            conditions.append("empresa_id = %s")
            params.append(str(empresa_id))
            
        if cliente_id:
            conditions.append("cliente_id = %s")
            params.append(str(cliente_id))

        if factura_id:
            conditions.append("factura_id = %s")
            params.append(str(factura_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_cuenta(self, id: UUID, data: dict, cur=None) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE sistema_facturacion.cuentas_cobrar SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        if cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None
            
        with db_transaction(self.db) as cur_new:
            cur_new.execute(query, tuple(clean_values))
            row = cur_new.fetchone()
            return dict(row) if row else None

    def actualizar_por_factura(self, factura_id: UUID, data: dict, cur=None) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(factura_id))

        query = f"UPDATE sistema_facturacion.cuentas_cobrar SET {', '.join(set_clauses)}, updated_at = NOW() WHERE factura_id = %s RETURNING *"
        
        if cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None
            
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_cuenta(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.cuentas_cobrar WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_resumen_cobros(self, empresa_id: UUID, fecha_corte: date, estado_filtro: Optional[str] = None, cliente_id_filtro: Optional[UUID] = None) -> dict:
        """
        Calcula el resumen de cuentas por cobrar segmentado por antigüedad.
        Calculado a partir de la fecha de corte proporcionada.
        """
        params = [str(empresa_id), fecha_corte]
        condiciones = ["cc.empresa_id = %s", "cc.fecha_emision <= %s"]
        
        if estado_filtro:
            condiciones.append("cc.estado = %s")
            params.append(estado_filtro)
            
        if cliente_id_filtro:
            condiciones.append("cc.cliente_id = %s")
            params.append(str(cliente_id_filtro))
            
        where_clause = " WHERE " + " AND ".join(condiciones)

        # 1. LISTADO DETALLADO
        query_listado = f"""
            SELECT 
                cc.id,
                c.razon_social as cliente_nombre,
                cc.numero_documento,
                cc.fecha_emision,
                cc.fecha_vencimiento,
                cc.monto_total,
                cc.monto_pagado,
                cc.saldo_pendiente,
                cc.estado,
                CASE 
                    WHEN cc.fecha_vencimiento >= %s THEN 0
                    ELSE (%s - cc.fecha_vencimiento)
                END as dias_vencido
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            {where_clause}
            AND cc.saldo_pendiente > 0
            ORDER BY cc.fecha_vencimiento ASC
        """
        # Note: we reuse some params but need to prepend the fecha_corte twice for the CASE
        listado_params = [fecha_corte, fecha_corte] + params
        
        with self.db.cursor() as cur:
            cur.execute(query_listado, tuple(listado_params))
            listado = [dict(row) for row in cur.fetchall()]
            
            # 2. AGREGACIONES PARA EL RESUMEN
            total_por_cobrar = sum(item['saldo_pendiente'] for item in listado)
            
            resumen = {
                "total_por_cobrar": total_por_cobrar,
                "vigente": {"monto": 0, "porcentaje": 0},
                "vencido_1_30": {"monto": 0, "porcentaje": 0},
                "vencido_31_60": {"monto": 0, "porcentaje": 0},
                "vencido_60_mas": {"monto": 0, "porcentaje": 0}
            }
            
            if total_por_cobrar > 0:
                for item in listado:
                    dv = item['dias_vencido']
                    monto = item['saldo_pendiente']
                    
                    if dv <= 0: bucket = "vigente"
                    elif dv <= 30: bucket = "vencido_1_30"
                    elif dv <= 60: bucket = "vencido_31_60"
                    else: bucket = "vencido_60_mas"
                    
                    resumen[bucket]["monto"] += monto
                
                # Calcular porcentajes
                for k in ["vigente", "vencido_1_30", "vencido_31_60", "vencido_60_mas"]:
                    resumen[k]["porcentaje"] = round(float(resumen[k]["monto"] / total_por_cobrar) * 100, 2)

            # 3. GRÁFICOS (Top 10 Morosos)
            query_morosos = f"""
                SELECT 
                    c.razon_social as label,
                    SUM(cc.saldo_pendiente) as value
                FROM sistema_facturacion.cuentas_cobrar cc
                JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
                {where_clause}
                AND cc.saldo_pendiente > 0
                GROUP BY c.razon_social
                ORDER BY value DESC
                LIMIT 10
            """
            cur.execute(query_morosos, tuple(params))
            top_morosos = [dict(row) for row in cur.fetchall()]
            
            return {
                "resumen": resumen,
                "listado": listado,
                "graficos": {
                    "distribucion_antiguedad": [
                        {"label": "Vigente", "value": float(resumen["vigente"]["monto"])},
                        {"label": "Vencido 1-30", "value": float(resumen["vencido_1_30"]["monto"])},
                        {"label": "Vencido 31-60", "value": float(resumen["vencido_31_60"]["monto"])},
                        {"label": "Vencido > 60", "value": float(resumen["vencido_60_mas"]["monto"])}
                    ],
                    "top_clientes_morosos": top_morosos
                },
                "fecha_corte": fecha_corte
            }

    def obtener_antiguedad_por_cliente(self, empresa_id: UUID, fecha_corte: date) -> List[dict]:
        """R-009: Antigüedad de Saldos por Cliente"""
        query = """
            SELECT 
                c.razon_social as cliente,
                SUM(CASE WHEN cc.fecha_vencimiento >= %s THEN cc.saldo_pendiente ELSE 0 END) as vigente,
                SUM(CASE WHEN cc.fecha_vencimiento < %s AND cc.fecha_vencimiento >= %s - INTERVAL '30 days' THEN cc.saldo_pendiente ELSE 0 END) as vencido_1_30,
                SUM(CASE WHEN cc.fecha_vencimiento < %s - INTERVAL '30 days' AND cc.fecha_vencimiento >= %s - INTERVAL '60 days' THEN cc.saldo_pendiente ELSE 0 END) as vencido_31_60,
                SUM(CASE WHEN cc.fecha_vencimiento < %s - INTERVAL '60 days' THEN cc.saldo_pendiente ELSE 0 END) as vencido_mas_60,
                SUM(cc.saldo_pendiente) as total
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 AND cc.fecha_emision <= %s
            GROUP BY c.razon_social ORDER BY total DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fecha_corte, fecha_corte, fecha_corte, fecha_corte, fecha_corte, fecha_corte, str(empresa_id), fecha_corte))
            return [dict(row) for row in cur.fetchall()]

    def obtener_clientes_morosos(self, empresa_id: UUID, dias_minimos_mora: int = 1) -> List[dict]:
        """R-010: Clientes Morosos con datos de contacto"""
        query = """
            SELECT 
                c.razon_social as cliente,
                COUNT(cc.id) as total_facturas_vencidas,
                SUM(cc.saldo_pendiente) as monto_total_adeudado,
                MAX(CURRENT_DATE - cc.fecha_vencimiento) as mayor_antiguedad_dias,
                (SELECT MAX(pf.fecha_pago) FROM sistema_facturacion.pagos_factura pf WHERE pf.cuenta_cobrar_id IN (SELECT id FROM sistema_facturacion.cuentas_cobrar WHERE cliente_id = cc.cliente_id)) as ultima_fecha_pago,
                c.telefono,
                c.email
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 AND cc.fecha_vencimiento < CURRENT_DATE
            GROUP BY cc.cliente_id, c.razon_social, c.telefono, c.email
            HAVING MAX(CURRENT_DATE - cc.fecha_vencimiento) >= %s
            ORDER BY monto_total_adeudado DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), dias_minimos_mora))
            return [dict(row) for row in cur.fetchall()]

    def obtener_historial_pagos(self, empresa_id: UUID, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None, cliente_id: Optional[UUID] = None) -> List[dict]:
        """R-011: Historial de Pagos Recibidos"""
        query = """
            SELECT 
                pf.fecha_pago,
                c.razon_social as cliente,
                f.numero_factura as numero_factura,
                pf.numero_recibo as numero_recibo,
                pf.monto as monto_pagado,
                pf.metodo_pago_sri as metodo_pago,
                u.nombres || ' ' || u.apellidos as usuario_registro,
                pf.observaciones as observaciones
            FROM sistema_facturacion.pagos_factura pf
            JOIN sistema_facturacion.cuentas_cobrar cc_link ON pf.cuenta_cobrar_id = cc_link.id
            JOIN sistema_facturacion.facturas f ON cc_link.factura_id = f.id
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            LEFT JOIN sistema_facturacion.usuarios u ON pf.usuario_id = u.id
            WHERE f.empresa_id = %s
        """
        params = [str(empresa_id)]
        
        if fecha_inicio:
            query += " AND pf.fecha_pago >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND pf.fecha_pago <= %s"
            params.append(fecha_fin)
        if cliente_id:
            query += " AND f.cliente_id = %s"
            params.append(str(cliente_id))
            
        query += " ORDER BY pf.fecha_pago DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_proyeccion_cobros(self, empresa_id: UUID) -> List[dict]:
        """R-012: Proyección de Cobros por mes de vencimiento"""
        query = """
            SELECT 
                TO_CHAR(fecha_vencimiento, 'Month YYYY') as mes,
                COUNT(*) as facturas_vencen,
                SUM(saldo_pendiente) as monto_total
            FROM sistema_facturacion.cuentas_cobrar
            WHERE empresa_id = %s AND saldo_pendiente > 0 AND fecha_vencimiento >= CURRENT_DATE
            GROUP BY mes, TO_CHAR(fecha_vencimiento, 'YYYYMM')
            ORDER BY TO_CHAR(fecha_vencimiento, 'YYYYMM') ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

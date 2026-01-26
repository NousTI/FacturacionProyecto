from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
import json
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioSuscripciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Planes ---
    def listar_planes(self) -> List[dict]:
        with self.db.cursor() as cur:
            query = """
                SELECT p.*,
                (
                    SELECT COUNT(DISTINCT e.id)
                    FROM empresa e
                    JOIN pago_suscripcion ps ON e.id = ps.empresa_id
                    WHERE ps.plan_id = p.id
                    AND ps.estado = 'PAGADO'
                    AND e.fecha_vencimiento >= CURRENT_DATE
                    AND e.activo = true
                    AND ps.fecha_inicio_periodo = (
                        SELECT MAX(fecha_inicio_periodo) 
                        FROM pago_suscripcion 
                        WHERE empresa_id = e.id
                    )
                ) as active_companies
                FROM plan p
                ORDER BY p.orden ASC
            """
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_plan_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_plan(self, data: dict) -> Optional[dict]:
        if 'caracteristicas' in data:
            if hasattr(data['caracteristicas'], 'model_dump_json'):
                data['caracteristicas'] = data['caracteristicas'].model_dump_json()
            elif isinstance(data['caracteristicas'], dict):
                data['caracteristicas'] = json.dumps(data['caracteristicas'])
                
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO plan ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_plan(self, id: UUID, data: dict) -> Optional[dict]:
        if 'caracteristicas' in data:
            if hasattr(data['caracteristicas'], 'model_dump_json'):
                data['caracteristicas'] = data['caracteristicas'].model_dump_json()
            elif isinstance(data['caracteristicas'], dict):
                data['caracteristicas'] = json.dumps(data['caracteristicas'])

        fields = [f"{k} = %s" for k in data.keys()]
        values = list(data.values())
        values.append(str(id))
        query = f"UPDATE plan SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_plan(self, id: UUID) -> bool:
        # Check if plan has subscribers before deleting (logic could be soft delete too)
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM plan WHERE id = %s", (str(id),))
            return cur.rowcount > 0

    def listar_empresas_por_plan(self, plan_id: UUID) -> List[dict]:
        query = """
            SELECT e.id, e.razon_social, e.nombre_comercial, e.ruc, e.email, e.telefono, 
                   e.fecha_activacion, e.fecha_vencimiento, e.activo, e.created_at
            FROM empresa e
            JOIN pago_suscripcion ps ON e.id = ps.empresa_id
            WHERE ps.plan_id = %s
            AND ps.estado = 'PAGADO'
            AND e.fecha_vencimiento >= CURRENT_DATE
            AND ps.fecha_inicio_periodo = (
                SELECT MAX(fecha_inicio_periodo) 
                FROM pago_suscripcion 
                WHERE empresa_id = e.id
            )
            ORDER BY e.fecha_activacion DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(plan_id),))
            return [dict(row) for row in cur.fetchall()]

    # --- Suscripciones / Pagos ---
    def registrar_suscripcion_atomica(self, pago_data: dict, empresa_data: dict, comision_data: Optional[dict]):
        with db_transaction(self.db) as cur:
            # 1. Pago
            p_fields = list(pago_data.keys())
            p_values = [str(v) if isinstance(v, UUID) else v for v in pago_data.values()]
            cur.execute(f"INSERT INTO pago_suscripcion ({', '.join(p_fields)}) VALUES ({', '.join(['%s']*len(p_fields))}) RETURNING id", tuple(p_values))
            pago_id = cur.fetchone()['id']

            # 2. Empresa
            cur.execute("""
                UPDATE empresa SET fecha_activacion = %s, fecha_vencimiento = %s, estado_suscripcion = %s, updated_at = NOW()
                WHERE id = %s
            """, (empresa_data['fecha_activacion'], empresa_data['fecha_vencimiento'], empresa_data['estado'], str(empresa_data['id'])))

            # 3. Comision
            if comision_data:
                comision_data['pago_suscripcion_id'] = str(pago_id)
                c_fields = list(comision_data.keys())
                cur.execute(f"INSERT INTO comision ({', '.join(c_fields)}) VALUES ({', '.join(['%s']*len(c_fields))})", tuple(comision_data.values()))
            
            return pago_id

    def listar_pagos(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT p.*, e.razon_social as razon_social, pl.nombre as plan_nombre FROM pago_suscripcion p " \
                "JOIN empresa e ON p.empresa_id = e.id JOIN plan pl ON p.plan_id = pl.id"
        params = []
        if empresa_id:
            query += " WHERE p.empresa_id = %s"
            params.append(str(empresa_id))
        query += " ORDER BY p.fecha_pago DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params) if params else None)
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats_dashboard(self) -> dict:
        with self.db.cursor() as cur:
            # 1. MRR (Total pagado en el último mes)
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total_mrr 
                FROM pago_suscripcion 
                WHERE fecha_pago >= NOW() - INTERVAL '30 days'
            """)
            total_mrr = cur.fetchone()['total_mrr']

            # 2. Suscripciones Activas
            cur.execute("SELECT COUNT(*) as activas FROM empresa WHERE activo = true AND fecha_vencimiento >= CURRENT_DATE")
            activas = cur.fetchone()['activas']

            # 3. Plan más rentable
            cur.execute("""
                SELECT pl.nombre 
                FROM plan pl
                JOIN pago_suscripcion p ON pl.id = p.plan_id
                GROUP BY pl.id, pl.nombre
                ORDER BY SUM(p.monto) DESC
                LIMIT 1
            """)
            row_plan = cur.fetchone()
            plan_rentable = row_plan['nombre'] if row_plan else "N/A"

            return {
                "total_mrr": total_mrr,
                "suscripciones_activas": activas,
                "plan_mas_rentable": plan_rentable,
                "crecimiento": 10.5 # Mocked growth for now
            }

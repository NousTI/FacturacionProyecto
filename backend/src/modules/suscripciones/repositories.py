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
                    SELECT COUNT(DISTINCT s.empresa_id)
                    FROM sistema_facturacion.suscripciones s
                    WHERE s.plan_id = p.id
                    AND s.estado = 'ACTIVA'
                    AND s.fecha_fin >= CURRENT_DATE
                ) as active_companies
                FROM sistema_facturacion.planes p
                ORDER BY p.orden ASC
            """
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_plan_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.planes WHERE id = %s", (str(id),))
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
        query = f"INSERT INTO sistema_facturacion.planes ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
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
        query = f"UPDATE sistema_facturacion.planes SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_plan(self, id: UUID) -> bool:
        # Check if plan has subscribers before deleting (logic could be soft delete too)
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM sistema_facturacion.planes WHERE id = %s", (str(id),))
            return cur.rowcount > 0

    def listar_empresas_por_plan(self, plan_id: UUID) -> List[dict]:
        query = """
            SELECT e.id, e.razon_social, e.nombre_comercial, e.ruc, e.email, e.telefono, 
                   s.fecha_inicio as fecha_activacion, s.fecha_fin as fecha_vencimiento, 
                   e.activo, e.created_at
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
            WHERE s.plan_id = %s
            AND s.estado = 'ACTIVA'
            AND s.fecha_fin >= CURRENT_DATE
            ORDER BY s.fecha_inicio DESC
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
            cur.execute(f"INSERT INTO sistema_facturacion.pagos_suscripciones ({', '.join(p_fields)}) VALUES ({', '.join(['%s']*len(p_fields))}) RETURNING id", tuple(p_values))
            pago_id = cur.fetchone()['id']

            # 2. Suscripcion (UPSERT)
            cur.execute("""
                INSERT INTO sistema_facturacion.suscripciones (empresa_id, plan_id, fecha_inicio, fecha_fin, estado)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (empresa_id) DO UPDATE SET
                    plan_id = EXCLUDED.plan_id,
                    fecha_inicio = EXCLUDED.fecha_inicio,
                    fecha_fin = EXCLUDED.fecha_fin,
                    estado = EXCLUDED.estado,
                    updated_at = NOW()
            """, (str(empresa_data['id']), str(pago_data['plan_id']), empresa_data['fecha_activacion'], empresa_data['fecha_vencimiento'], empresa_data['estado']))

            # 3. Comision
            if comision_data:
                comision_data['pago_suscripcion_id'] = str(pago_id)
                c_fields = list(comision_data.keys())
                cur.execute(f"INSERT INTO sistema_facturacion.comisiones ({', '.join(c_fields)}) VALUES ({', '.join(['%s']*len(c_fields))})", tuple(comision_data.values()))
            
            return pago_id

    def listar_pagos(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT p.*, e.razon_social as razon_social, pl.nombre as plan_nombre FROM sistema_facturacion.pagos_suscripciones p " \
                "JOIN sistema_facturacion.empresas e ON p.empresa_id = e.id JOIN sistema_facturacion.planes pl ON p.plan_id = pl.id"
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
                FROM sistema_facturacion.pagos_suscripciones 
                WHERE fecha_pago >= NOW() - INTERVAL '30 days'
            """)
            total_mrr = cur.fetchone()['total_mrr']

            # 2. Suscripciones Activas
            cur.execute("SELECT COUNT(*) as activas FROM sistema_facturacion.suscripciones WHERE estado = 'ACTIVA' AND fecha_fin >= CURRENT_DATE")
            activas = cur.fetchone()['activas']

            # 3. Plan más rentable
            cur.execute("""
                SELECT pl.nombre 
                FROM sistema_facturacion.planes pl
                JOIN sistema_facturacion.pagos_suscripciones p ON pl.id = p.plan_id
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

    # --- Suscripciones Table CRUD ---
    def crear_suscripcion(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ['%s'] * len(fields)
        update_fields = [f'{k} = EXCLUDED.{k}' for k in fields if k not in ['empresa_id', 'created_at']]
        update_fields.append('updated_at = NOW()')
        query = f"""
            INSERT INTO sistema_facturacion.suscripciones ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            ON CONFLICT (empresa_id) DO UPDATE SET {', '.join(update_fields)}
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None


    # --- Audit Logging ---
    def registrar_log_suscripcion(self, log_data: dict):
        """Insert audit log entry"""
        fields = list(log_data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in log_data.values()]
        placeholders = ['%s'] * len(fields)
        query = f"""
            INSERT INTO sistema_facturacion.suscripciones_log ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_historial_suscripcion(self, suscripcion_id: UUID):
        """Get audit log history for a subscription"""
        query = """
            SELECT sl.*, 
                   pa.nombre as plan_anterior_nombre, 
                   pn.nombre as plan_nuevo_nombre, 
                   u.email as cambiado_por_email
            FROM sistema_facturacion.suscripciones_log sl
            LEFT JOIN sistema_facturacion.planes pa ON sl.plan_anterior = pa.id
            LEFT JOIN sistema_facturacion.planes pn ON sl.plan_nuevo = pn.id
            LEFT JOIN sistema_facturacion.usuarios u ON sl.cambiado_por = u.id
            WHERE sl.suscripcion_id = %s
            ORDER BY sl.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(suscripcion_id),))
            return [dict(row) for row in cur.fetchall()]


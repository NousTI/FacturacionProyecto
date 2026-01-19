from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional
import json

class PlanRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def _normalize_row(self, row: dict) -> dict:
        """Convert legacy fields to match new schema."""
        if not row: return row
        
        # Convert Dictionary 'caracteristicas' to List[str]
        features = row.get('caracteristicas')
        if isinstance(features, dict):
            # Convert legacy Dict to List[Dict] structure
            row['caracteristicas'] = [{"nombre": str(k), "descripcion": str(v)} for k, v in features.items()]
        elif isinstance(features, list):
             # Ensure list content is correct structure if migrating from List[str]
             valid_features = []
             for f in features:
                 if isinstance(f, str):
                     parts = f.split(':', 1)
                     if len(parts) == 2:
                         valid_features.append({"nombre": parts[0].strip(), "descripcion": parts[1].strip()})
                     else:
                         valid_features.append({"nombre": f, "descripcion": ""})
                 elif isinstance(f, dict):
                     valid_features.append(f)
             row['caracteristicas'] = valid_features
        elif features is None:
            row['caracteristicas'] = []
            
        return row

    def create_plan(self, plan_data: dict) -> Optional[dict]:
        if not self.db: return None
        
        # Ensure json field is serialized
        if 'caracteristicas' in plan_data and (isinstance(plan_data['caracteristicas'], dict) or isinstance(plan_data['caracteristicas'], list)):
            plan_data['caracteristicas'] = json.dumps(plan_data['caracteristicas'])

        fields = list(plan_data.keys())
        clean_values = self._serialize_uuids(list(plan_data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO plan ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return self._normalize_row(dict(row)) if row else None

    def get_plan(self, plan_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE id = %s", (str(plan_id),))
            row = cur.fetchone()
            return self._normalize_row(dict(row)) if row else None

    def get_plan_by_codigo(self, codigo: str) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE codigo = %s", (codigo,))
            row = cur.fetchone()
            return self._normalize_row(dict(row)) if row else None

    def list_plans(self) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan ORDER BY orden ASC, created_at DESC")
            rows = cur.fetchall()
            return [self._normalize_row(dict(row)) for row in rows]

    def update_plan(self, plan_id: UUID, plan_data: dict) -> Optional[dict]:
        if not self.db or not plan_data: return None
        
        # Ensure json field is serialized
        if 'caracteristicas' in plan_data and (isinstance(plan_data['caracteristicas'], dict) or isinstance(plan_data['caracteristicas'], list)):
            plan_data['caracteristicas'] = json.dumps(plan_data['caracteristicas'])

        set_clauses = [f"{key} = %s" for key in plan_data.keys()]
        clean_values = self._serialize_uuids(list(plan_data.values()))
        clean_values.append(str(plan_id))

        query = f"""
            UPDATE plan
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return self._normalize_row(dict(row)) if row else None

    def delete_plan(self, plan_id: UUID) -> bool:
        query = "DELETE FROM plan WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(plan_id),))
            return cur.fetchone() is not None

    def get_companies_by_plan(self, plan_id: UUID) -> List[dict]:
        if not self.db: return []
        
        # We look for companies that currently have this plan as their active subscription
        # Based on EmpresaRepository logic for 'plan_id'
        query = """
            SELECT e.id, e.ruc, e.razon_social, e.nombre_comercial, e.email, e.estado_suscripcion,
            (
                SELECT ps.fecha_vencimiento 
                FROM empresa e2
                WHERE e2.id = e.id
            ) as fecha_vencimiento -- Actually fecha_vencimiento is in empresa table
            FROM empresa e
            WHERE e.id IN (
                SELECT ps.empresa_id 
                FROM pago_suscripcion ps 
                WHERE ps.plan_id = %s 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            )
        """
        # Wait, the subquery should probably be more efficient or corrected.
        # Actually, let's just find companies whose LATEST paid subscription is for this plan.
        
        query = """
            SELECT e.id, e.ruc, e.razon_social, e.nombre_comercial, e.email, e.estado_suscripcion, e.fecha_vencimiento
            FROM empresa e
            WHERE (
                SELECT ps.plan_id 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) = %s
            ORDER BY e.razon_social ASC
        """
        
        with self.db.cursor() as cur:
            cur.execute(query, (str(plan_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_plan_order(self, order_updates: List[tuple]) -> bool:
        if not self.db or not order_updates: return False
        
        # order_updates is a list of (id, order)
        query = "UPDATE plan SET orden = %s, updated_at = NOW() WHERE id = %s"
        
        # Prepare data for executemany: (order, id) because SQL is SET orden=%s ... WHERE id=%s
        data = [(order, str(pid)) for pid, order in order_updates]
        
        with db_transaction(self.db) as cur:
            cur.executemany(query, data)
            return True

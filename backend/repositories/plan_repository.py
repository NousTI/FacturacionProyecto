from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
import json

class PlanRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_plan(self, plan_data: dict):
        if not self.db: return None
        
        # Ensure json field is serialized
        if 'caracteristicas' in plan_data and isinstance(plan_data['caracteristicas'], dict):
            plan_data['caracteristicas'] = json.dumps(plan_data['caracteristicas'])

        fields = list(plan_data.keys())
        values = list(plan_data.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO plan ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_plan(self, plan_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE id = %s", (str(plan_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_plan_by_codigo(self, codigo: str):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE codigo = %s", (codigo,))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_plans(self):
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan ORDER BY created_at DESC")
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_plan(self, plan_id: UUID, plan_data: dict):
        if not self.db or not plan_data: return None
        
        # Ensure json field is serialized
        if 'caracteristicas' in plan_data and isinstance(plan_data['caracteristicas'], dict):
            plan_data['caracteristicas'] = json.dumps(plan_data['caracteristicas'])

        set_clauses = [f"{key} = %s" for key in plan_data.keys()]
        values = list(plan_data.values())
        values.append(str(plan_id))

        query = f"""
            UPDATE plan
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete_plan(self, plan_id: UUID):
        query = "DELETE FROM plan WHERE id = %s RETURNING id"
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, (str(plan_id),))
                return cur.fetchone() is not None
        except Exception:
            return False

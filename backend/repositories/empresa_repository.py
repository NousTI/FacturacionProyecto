from fastapi import Depends
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class EmpresaRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create_empresa(self, empresa_data: dict) -> Optional[dict]:
        if not self.db: return None
        fields = list(empresa_data.keys())
        clean_values = self._serialize_uuids(list(empresa_data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO empresa ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_empresa_by_id(self, empresa_id: UUID) -> Optional[dict]:
        if not self.db: return None
        query = """
            SELECT e.*, 
            (
                SELECT p.nombre 
                FROM pago_suscripcion ps 
                JOIN plan p ON ps.plan_id = p.id 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as plan,
            (
                SELECT ps.plan_id 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as plan_id,
            (
                SELECT ps.fecha_inicio_periodo 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as fecha_inicio_plan,
            (
                SELECT ps.fecha_fin_periodo 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as fecha_fin_plan
            FROM empresa e 
            WHERE e.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_empresa_by_ruc(self, ruc: str) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE ruc=%s", (ruc,))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_empresas(self, vendedor_id: Optional[UUID] = None, empresa_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        
        # Subquery to get the latest active plan name
        # We look for the most recent 'PAGADO' subscription.
        # If there are multiple, we take the one with the latest start date.
        
        query = """
            SELECT e.*, 
            (
                SELECT p.nombre 
                FROM pago_suscripcion ps 
                JOIN plan p ON ps.plan_id = p.id 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                -- AND ps.fecha_fin_periodo >= NOW() -- Optional: strict check for active only? 
                -- Let's show the last paid plan even if expired for now, or strict?
                -- User usually wants to know "What plan are they on?". 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as plan,
            (
                SELECT ps.plan_id 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as plan_id,
            (
                SELECT ps.fecha_inicio_periodo 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as fecha_inicio_plan,
            (
                SELECT ps.fecha_fin_periodo 
                FROM pago_suscripcion ps 
                WHERE ps.empresa_id = e.id 
                AND ps.estado IN ('PAGADO', 'COMPLETED') 
                ORDER BY ps.fecha_inicio_periodo DESC 
                LIMIT 1
            ) as fecha_fin_plan
            FROM empresa e
        """
        params = []
        conditions = []
        
        if vendedor_id:
            conditions.append("e.vendedor_id = %s")
            params.append(str(vendedor_id))
            
        if empresa_id:
            conditions.append("e.id = %s")
            params.append(str(empresa_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY e.fecha_registro DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_empresa(self, empresa_id: UUID, empresa_data: dict) -> Optional[dict]:
        if not self.db or not empresa_data: return None
        
        set_clauses = [f"{key} = %s" for key in empresa_data.keys()]
        clean_values = self._serialize_uuids(list(empresa_data.values()))
        clean_values.append(str(empresa_id))
        
        query = f"""
            UPDATE empresa 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_companies_with_expired_subscription(self, cutoff_date: datetime) -> List[UUID]:
        """
        Retorna las IDs de las empresas cuya suscripción ha vencido respecto a la fecha de corte.
        """
        if not self.db: return []
        
        # Logic: Status is 'ACTIVA' BUT (max end date of valid payments) < cutoff_date
        # We need to assume 'ACTIVA' is the DB value for SubscriptionStatus.ACTIVA
        query = """
            SELECT e.id
            FROM empresa e
            WHERE e.estado_suscripcion = 'ACTIVA'
            AND (
                SELECT MAX(fecha_fin_periodo)
                FROM pago_suscripcion p
                WHERE p.empresa_id = e.id
                AND p.estado IN ('ACTIVA', 'PAGADO', 'COMPLETED')
            ) < %s
        """
        
        with self.db.cursor() as cur:
            cur.execute(query, (cutoff_date,))
            rows = cur.fetchall()
            return [row[0] for row in rows] # Return list of UUIDs

    def check_expired_subscriptions(self) -> int:
        if not self.db: return 0
        query = """
            UPDATE empresa 
            SET estado_suscripcion = 'VENCIDA', updated_at = NOW() 
            WHERE estado_suscripcion = 'ACTIVA' 
            AND fecha_vencimiento < NOW()
        """
        with db_transaction(self.db) as cur:
            cur.execute(query)
            return cur.rowcount

    def delete_empresa(self, empresa_id: UUID) -> bool:
        if not self.db: return False
        query = "DELETE FROM empresa WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(empresa_id),))
            return cur.rowcount > 0

    def create_manual_subscription(self, data: dict) -> bool:
        if not self.db: return False
        
        # We need to serialize dict values to ensure UUIDs are strings
        cleaned_data = self._serialize_uuids(list(data.values()))
        keys = list(data.keys())
        
        placeholders = ["%s"] * len(keys)
        
        # NOTE: data['fecha_pago'] is string "NOW()", which won't work direct with %s for psycog2 if we want SQL function.
        # But we can just use psycopg2's CURRENT_TIMESTAMP handling or just let postgres default if we didn't include it.
        # However, to keep it simple and safe from SQL injection, let's fix the values in Service or here.
        # Ideally, we pass datetime objects from service. 
        # But since I passed "NOW()", let's fix the query construction to use raw SQL for dates or fix input.
        # REVISION: Let's assume service passed validation. 
        # Actually "NOW()" string in a parameterized query will be treated as the string 'NOW()', causing date parse error.
        # Let's handle 'fecha_pago' etc manually or use python datetime.
        
        # Better strategy for this specific method: Hardcode the date fields in the query to NOW() 
        # if the value is "NOW()", or use keys.
        
        # Simplified:
        query = f"""
            INSERT INTO pago_suscripcion ({', '.join(keys)})
            VALUES ({', '.join(placeholders)})
        """
        # Wait, if I pass "NOW()", it will be parameterized as '"NOW()"'.
        # I should change the Service to pass None and let DB default? No, DB default is Now.
        # But wait, `fecha_pago` is NOT NULL. 
        # I will change the service to pass datetime.now() in next step. 
        # For now, let's assume data comes correct (datetime objects).
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(cleaned_data))
            return cur.rowcount > 0

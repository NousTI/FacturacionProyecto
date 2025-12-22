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
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE id=%s", (str(empresa_id),))
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
        query = "SELECT * FROM empresa"
        params = []
        conditions = []
        
        if vendedor_id:
            conditions.append("vendedor_id = %s")
            params.append(str(vendedor_id))
            
        if empresa_id:
            conditions.append("id = %s")
            params.append(str(empresa_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY fecha_registro DESC"
        
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

    def update_company_status(self, empresa_id: UUID, new_status: str) -> bool:
        query = "UPDATE empresa SET estado_suscripcion = %s, updated_at = NOW() WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (new_status, str(empresa_id)))
            return cur.rowcount > 0

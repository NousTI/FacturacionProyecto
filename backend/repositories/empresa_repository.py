from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID

class EmpresaRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_empresa(self, empresa_data: dict):
        if not self.db: return None
        fields = list(empresa_data.keys())
        fields = list(empresa_data.keys())
        # Convert UUIDs to strings to avoid adapter errors
        values = [str(v) if isinstance(v, UUID) else v for v in empresa_data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO empresa ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            # Propagate error to service for handling (e.g. FK violations)
            raise e

    def get_empresa_by_id(self, empresa_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE id=%s", (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_empresa_by_ruc(self, ruc: str):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE ruc=%s", (ruc,))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_empresas(self, vendedor_id: UUID = None, empresa_id: UUID = None):
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

    def update_empresa(self, empresa_id: UUID, empresa_data: dict):
        if not self.db or not empresa_data: return None
        
        set_clauses = [f"{key} = %s" for key in empresa_data.keys()]
        set_clauses = [f"{key} = %s" for key in empresa_data.keys()]
        # Convert UUIDs to strings to avoid adapter errors
        values = [str(v) if isinstance(v, UUID) else v for v in empresa_data.values()]
        values.append(str(empresa_id))
        
        query = f"""
            UPDATE empresa 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s
            RETURNING *
        """
        
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            # Propagate error to service for handling (e.g. FK violations)
            raise e

    def update_expired_subscriptions(self) -> int:
        """
        Actualiza el estado de las empresas cuya fecha de vencimiento ha pasado.
        Retorna el número de registros actualizados.
        """
        if not self.db: return 0
        
        # Import here or at top if generic
        from utils.enums import SubscriptionStatus
        
        # Using pago_suscripcion as source of truth for expiration date
        query = """
            UPDATE empresa e
            SET estado_suscripcion = %s, updated_at = NOW()
            WHERE e.estado_suscripcion = %s
            AND (
                SELECT MAX(fecha_fin_periodo)
                FROM pago_suscripcion p
                WHERE p.empresa_id = e.id
                -- Assuming 'ACTIVA' or 'PAGADO' are valid paid states. 
                -- Based on DB check, 'ACTIVA' is used.
                AND p.estado IN ('ACTIVA', 'PAGADO', 'COMPLETED')
            ) < CURRENT_DATE
        """
        
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, (SubscriptionStatus.VENCIDA.value, SubscriptionStatus.ACTIVA.value))
                return cur.rowcount
        except Exception as e:
            print(f"Error updating expired subscriptions: {e}")
            return 0

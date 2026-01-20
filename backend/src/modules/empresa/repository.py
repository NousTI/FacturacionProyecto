from fastapi import Depends
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioEmpresa:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def crear_empresa(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        fields = list(data.keys())
        # Ensure UUIDs are strings
        clean_values = self._serialize_uuids(list(data.values()))
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

    def obtener_por_id(self, empresa_id: UUID) -> Optional[dict]:
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

    def obtener_por_ruc(self, ruc: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE ruc=%s", (ruc,))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_empresas(self, vendedor_id: Optional[UUID] = None, empresa_id: Optional[UUID] = None) -> List[dict]:
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
            return [dict(row) for row in cur.fetchall()]

    def actualizar_empresa(self, empresa_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = self._serialize_uuids(list(data.values()))
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

    def check_expired_subscriptions(self, tolerance_days: int = 0) -> int:
        query = """
            UPDATE empresa 
            SET estado_suscripcion = 'VENCIDA', updated_at = NOW() 
            WHERE estado_suscripcion = 'ACTIVA' 
            AND (fecha_vencimiento + (interval '1 day' * %s)) < NOW()
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (tolerance_days,))
            return cur.rowcount

    def eliminar_empresa(self, empresa_id: UUID) -> bool:
        query = "DELETE FROM empresa WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(empresa_id),))
            return cur.rowcount > 0

    def create_manual_subscription(self, data: dict) -> bool:
        # Note: data must contain correct string/values.
        cleaned_data = self._serialize_uuids(list(data.values()))
        keys = list(data.keys())
        placeholders = ["%s"] * len(keys)
        
        query = f"""
            INSERT INTO pago_suscripcion ({', '.join(keys)})
            VALUES ({', '.join(placeholders)})
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(cleaned_data))
            return cur.rowcount > 0

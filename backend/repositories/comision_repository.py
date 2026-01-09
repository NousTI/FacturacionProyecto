from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class ComisionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def list_comisiones(self, vendedor_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        
        query = """
            SELECT 
                c.*,
                v.nombres || ' ' || v.apellidos as vendedor_nombre,
                e.nombre_comercial as empresa_nombre,
                p.monto as monto_pago
            FROM comision c
            JOIN vendedor v ON c.vendedor_id = v.id
            JOIN pago_suscripcion p ON c.pago_suscripcion_id = p.id
            JOIN empresa e ON p.empresa_id = e.id
        """
        params = []
        
        if vendedor_id:
            query += " WHERE c.vendedor_id = %s"
            params.append(str(vendedor_id))
            
        query += " ORDER BY c.created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def get_by_id(self, comision_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM comision WHERE id = %s", (str(comision_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    # Update (Admin only usually)
    def update(self, comision_id: UUID, update_data: dict) -> Optional[dict]:
        if not self.db or not update_data: return None
        
        set_clauses = [f"{key} = %s" for key in update_data.keys()]
        clean_values = self._serialize_uuids(list(update_data.values()))
        clean_values.append(str(comision_id))
        
        query = f"""
            UPDATE comision
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, comision_id: UUID) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM comision WHERE id = %s RETURNING id", (str(comision_id),))
            return cur.fetchone() is not None
            
    # Note: Create is handled via auto-generation in Suscripcion logic, 
    # but we can add a manual create here if needed (Admin override).
    def create(self, comision_data: dict) -> Optional[dict]:
        if not self.db: return None
        
        with db_transaction(self.db) as cur:
            fields = [
                "vendedor_id", "pago_suscripcion_id", "monto", 
                "porcentaje_aplicado", "estado", "fecha_generacion", 
                "fecha_pago", "metodo_pago", "observaciones"
            ]
            
            values = [
                str(comision_data.get("vendedor_id")),
                str(comision_data.get("pago_suscripcion_id")),
                comision_data.get("monto"),
                comision_data.get("porcentaje_aplicado"),
                comision_data.get("estado", "PENDIENTE"),
                comision_data.get("fecha_generacion"),
                comision_data.get("fecha_pago"),
                comision_data.get("metodo_pago"),
                comision_data.get("observaciones")
            ]
            
            query = f"""
                INSERT INTO comision ({', '.join(fields)})
                VALUES ({', '.join(['%s'] * len(fields))})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

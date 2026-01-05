from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class MovimientoInventarioRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO movimiento_inventario ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_producto_actual(self, producto_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM producto WHERE id = %s", (str(producto_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def update_producto_stock(self, producto_id: UUID, nuevo_stock: int):
        if not self.db: return
        with db_transaction(self.db) as cur:
            cur.execute("UPDATE producto SET stock_actual = %s WHERE id = %s", (nuevo_stock, str(producto_id)))

    def list_by_producto(self, producto_id: UUID) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM movimiento_inventario 
                WHERE producto_id = %s 
                ORDER BY fecha_movimiento DESC
            """, (str(producto_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
            
    def list_all(self) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM movimiento_inventario 
                ORDER BY fecha_movimiento DESC
            """)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection

class FormaPagoRepository:
    def __init__(self, db_connection=Depends(get_db_connection)):
        self.conn = db_connection
        self.cursor = self.conn.cursor()

    def create(self, data: dict) -> dict:
        columns = list(data.keys())
        # Ensure UUIDs are strings
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(values)
        
        query = f"""
            INSERT INTO forma_pago ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        self.cursor.execute(query, values)
        self.conn.commit()
        return self.cursor.fetchone()

    def update(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return self.get_by_id(id)
        
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        # Ensure UUIDs are strings
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        
        query = f"UPDATE forma_pago SET {set_clause} WHERE id = %s RETURNING *"
        self.cursor.execute(query, values)
        self.conn.commit()
        return self.cursor.fetchone()

    def get_by_id(self, id: UUID) -> Optional[dict]:
        self.cursor.execute("SELECT * FROM forma_pago WHERE id = %s", (str(id),))
        return self.cursor.fetchone()

    def delete(self, id: UUID):
        self.cursor.execute("DELETE FROM forma_pago WHERE id = %s", (str(id),))
        self.conn.commit()
        return self.cursor.rowcount > 0

    def get_by_factura_id(self, factura_id: UUID) -> List[dict]:
        self.cursor.execute("SELECT * FROM forma_pago WHERE factura_id = %s", (str(factura_id),))
        return self.cursor.fetchall()

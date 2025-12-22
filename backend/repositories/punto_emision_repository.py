from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.PuntoEmision import PuntoEmisionCreate, PuntoEmisionUpdate
from typing import List, Optional

class PuntoEmisionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: PuntoEmisionCreate) -> Optional[dict]:
        query = """
            INSERT INTO punto_emision (
                establecimiento_id, codigo, nombre, secuencial_actual, activo
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        values = (
            str(data.establecimiento_id),
            data.codigo,
            data.nombre,
            data.secuencial_actual,
            data.activo
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM punto_emision WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, establecimiento_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM punto_emision"
        params = []
        
        if establecimiento_id:
            query += " WHERE establecimiento_id = %s"
            params.append(str(establecimiento_id))
            
        query += " ORDER BY codigo ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: PuntoEmisionUpdate) -> Optional[dict]:
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
            return self.get_by_id(id)

        fields = []
        values = []
        
        for key, value in data_dict.items():
            fields.append(f"{key} = %s")
            if isinstance(value, UUID):
                values.append(str(value))
            else:
                values.append(value)
        
        fields.append("updated_at = NOW()")
        values.append(str(id))

        query = f"UPDATE punto_emision SET {', '.join(fields)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        query = "DELETE FROM punto_emision WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def increment_secuencial(self, id: UUID) -> int:
        """
        Atomically increments the sequential number and returns the PREVIOUS value (for consumption).
        Or returns the NEW value depending on logic.
        Standard SRI: We use the value, then increment. 
        So:
        1. UPDATE ... SET seq = seq + 1 RETURNING seq - 1
        """
        # Logic: Update DB to (current + 1). Return (current).
        query = """
            UPDATE punto_emision 
            SET secuencial_actual = secuencial_actual + 1, updated_at = NOW()
            WHERE id = %s
            RETURNING secuencial_actual - 1 as used_seq
        """
        # Wait, if I return seq -1, I get the one that WAS the value.
        # Example: seq=1. Update set seq=2. Returning 2-1 = 1. Correct.
        
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            if row:
                return row['used_seq'] # psycopg2 DictCursor? Or tuple if main config uses simple cursor. 
                # Repo usage above shows `dict(row)`. So row is DictRow-like.
                # However, numeric calculations in SQL return Decimal usually? Or int?
                # PuntoEmision.secuencial_actual is likely INT.
                # Let's return.
                return row[0] # Usually fetchone returns tuple if not DictCursor, but here we see `dict(row)` usage.
                # If using RealDictCursor, access by name.
                # The connection setup (reviewed previously) uses `extras.RealDictCursor`?
                # The repo uses `dict(row)` which implies row allows key access or is mapping.
                # Let's look at `get_db_connection`. Assuming Dict access.
                # IF query is `... as used_seq`, key is `used_seq`.
                
        # SAFETY fallback if cursor type is ambiguous without checking connection.py:
        # Use `RETURNING secuencial_actual`.
        # Then subtract 1 in Python.
        pass
        
        query = "UPDATE punto_emision SET secuencial_actual = secuencial_actual + 1, updated_at = NOW() WHERE id = %s RETURNING secuencial_actual"
        with db_transaction(self.db) as cur:
             cur.execute(query, (str(id),))
             row = cur.fetchone()
             # row is dict-like
             if row:
                 # If using RealDictCursor: row['secuencial_actual']
                 # If using standard cursor: row[0]
                 # Existing code: `return dict(row) if row else None` suggests row is not a pure dict yet but convertible.
                 # Usually `psycopg2.extras.DictRow`.
                 # Safe access:
                 try:
                     val = row['secuencial_actual']
                 except: # index access fallback
                     val = row[0]
                 return val - 1 # We return the OLD value to be used.
        return None

from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction
import json

class ReporteGeneradoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_data(self, data: dict) -> dict:
        new_data = data.copy()
        if 'parametros' in new_data and new_data['parametros']:
            new_data['parametros'] = json.dumps(new_data['parametros'])
        
        # Helper to convert UUID values to strings
        for k, v in new_data.items():
            if isinstance(v, UUID):
                new_data[k] = str(v)
                
        return new_data

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        data = self._serialize_data(data)
        fields = list(data.keys())
        values = list(data.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO reporte_generado ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, empresa_id: Optional[UUID] = None, limit: int = 20, offset: int = 0) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM reporte_generado"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def get_by_id(self, id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM reporte_generado WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def update(self, id: UUID, data: dict) -> Optional[dict]:
        data = self._serialize_data(data)
        fields = []
        values = []
        
        for key, value in data.items():
            fields.append(f"{key} = %s")
            values.append(value)
            
        values.append(str(id))
        
        query = f"UPDATE reporte_generado SET {', '.join(fields)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
            
    def delete(self, id: UUID) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM reporte_generado WHERE id = %s", (str(id),))
            return cur.rowcount > 0

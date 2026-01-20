from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioEstablecimientos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_establecimiento(self, data: dict, empresa_id: UUID) -> Optional[dict]:
        fields = list(data.keys())
        if "empresa_id" not in fields:
             fields.append("empresa_id")
             values = list(data.values())
             values.append(str(empresa_id))
        else:
             values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
             
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO establecimiento ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM establecimiento WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_establecimientos(self, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM establecimiento"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY codigo ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_establecimiento(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE establecimiento SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_establecimiento(self, id: UUID) -> bool:
        query = "DELETE FROM establecimiento WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

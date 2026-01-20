from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioUsuarios:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def crear_usuario(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        clean_values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)

        query = f"""
            INSERT INTO usuario ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_correo(self, correo: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE email=%s", (correo,))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, usuario_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE id=%s", (str(usuario_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_usuarios(self, empresa_id: Optional[UUID] = None, rol_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT * FROM usuario WHERE 1=1"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        if rol_id:
            query += " AND rol_id = %s"
            params.append(str(rol_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def actualizar_usuario(self, usuario_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = self._serialize_uuids(list(data.values()))
        
        clean_values.append(str(usuario_id))
        
        query = f"""
            UPDATE usuario 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_usuario(self, usuario_id: UUID) -> bool:
        query = "DELETE FROM usuario WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(usuario_id),))
            return cur.fetchone() is not None

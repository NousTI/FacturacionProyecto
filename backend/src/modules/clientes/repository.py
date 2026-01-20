from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioClientes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def crear_cliente(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        clean_values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO cliente ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, cliente_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM cliente WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(cliente_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_clientes(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT * FROM cliente"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_cliente(self, cliente_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = self._serialize_uuids(list(data.values()))
        clean_values.append(str(cliente_id))

        query = f"""
            UPDATE cliente
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_cliente(self, cliente_id: UUID) -> bool:
        query = "DELETE FROM cliente WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(cliente_id),))
            return cur.rowcount > 0

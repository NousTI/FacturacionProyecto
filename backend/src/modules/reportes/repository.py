import json
from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioReportes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict) -> Optional[dict]:
        if data.get('parametros'): data['parametros'] = json.dumps(data['parametros'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO reporte_generado ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT * FROM reporte_generado"
        params = []
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
        query += " ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM reporte_generado WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM reporte_generado WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

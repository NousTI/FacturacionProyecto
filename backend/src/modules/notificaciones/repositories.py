from fastapi import Depends
from typing import List, Optional
from uuid import UUID
import json
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioNotificaciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict) -> Optional[dict]:
        if 'metadata' in data and data['metadata'] is not None:
             data['metadata'] = json.dumps(data['metadata'])
        
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.notificaciones ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_por_usuario(self, user_id: UUID, solo_no_leidas: bool = False) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.notificaciones WHERE user_id = %s"
        params = [str(user_id)]
        
        if solo_no_leidas:
            query += " AND leido = FALSE"
        
        query += " ORDER BY created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def marcar_como_leida(self, id: UUID, user_id: UUID) -> Optional[dict]:
        query = """
            UPDATE sistema_facturacion.notificaciones 
            SET leido = TRUE, leido_at = NOW(), updated_at = NOW() 
            WHERE id = %s AND user_id = %s 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id), str(user_id)))
            row = cur.fetchone()
            return dict(row) if row else None

    def marcar_todas_leidas(self, user_id: UUID) -> bool:
        query = """
            UPDATE sistema_facturacion.notificaciones 
            SET leido = TRUE, leido_at = NOW(), updated_at = NOW() 
            WHERE user_id = %s AND leido = FALSE
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id),))
            return cur.rowcount > 0

    def contar_no_leidas(self, user_id: UUID) -> int:
        query = "SELECT COUNT(*) as count FROM sistema_facturacion.notificaciones WHERE user_id = %s AND leido = FALSE"
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            return cur.fetchone()['count']

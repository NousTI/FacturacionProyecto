import json
from typing import Optional, List
from uuid import UUID
from fastapi import Depends
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioNotificaciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict) -> Optional[dict]:
        """Crear una notificación"""
        fields = list(data.keys())
        values = list(data.values())
        # Serialize dicts to JSON strings for psycopg2
        processed_values = [json.dumps(v) if isinstance(v, dict) else v for v in values]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.notificaciones ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(processed_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_por_usuario(self, user_id: UUID, solo_no_leidas: bool = False) -> List[dict]:
        """Listar notificaciones de un usuario"""
        query = "SELECT * FROM sistema_facturacion.notificaciones WHERE user_id = %s"
        if solo_no_leidas:
            query += " AND leido = false"
        query += " ORDER BY created_at DESC"

        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            return [dict(row) for row in cur.fetchall()]

    def marcar_como_leida(self, id: UUID, user_id: UUID) -> Optional[dict]:
        """Marcar notificación como leída"""
        query = "UPDATE sistema_facturacion.notificaciones SET leido = true, leido_at = NOW() WHERE id = %s AND user_id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id), str(user_id)))
            row = cur.fetchone()
            return dict(row) if row else None

    def marcar_todas_leidas(self, user_id: UUID) -> bool:
        """Marcar todas las notificaciones como leídas"""
        query = "UPDATE sistema_facturacion.notificaciones SET leido = true, leido_at = NOW() WHERE user_id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id),))
            return True

    def contar_no_leidas(self, user_id: UUID) -> int:
        """Contar notificaciones no leídas"""
        query = "SELECT COUNT(*) as count FROM sistema_facturacion.notificaciones WHERE user_id = %s AND leido = false"
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            return row['count'] if row else 0

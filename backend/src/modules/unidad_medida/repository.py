from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction


class RepositorioUnidadMedida:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_unidad_medida(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)

        query = f"""
            INSERT INTO unidad_medida ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM unidad_medida WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_todos(self) -> List[dict]:
        query = "SELECT * FROM unidad_medida ORDER BY nombre ASC"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def actualizar_unidad_medida(self, id: UUID, data: dict) -> Optional[dict]:
        if not data:
            return None

        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE unidad_medida SET {', '.join(set_clauses)} WHERE id = %s RETURNING *"

        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_unidad_medida(self, id: UUID) -> bool:
        query = "DELETE FROM unidad_medida WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

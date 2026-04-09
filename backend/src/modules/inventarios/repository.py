from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioInventarios:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_movimiento(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO movimiento_inventario ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_producto(self, producto_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM producto WHERE id = %s", (str(producto_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_stock(self, producto_id: UUID, nuevo_stock: int):
        query = "UPDATE producto SET stock_actual = %s WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (nuevo_stock, str(producto_id)))

    def listar_por_producto(self, producto_id: UUID) -> List[dict]:
        query = "SELECT * FROM movimiento_inventario WHERE producto_id = %s ORDER BY fecha_movimiento DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(producto_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_todos(self) -> List[dict]:
        query = "SELECT * FROM movimiento_inventario ORDER BY fecha_movimiento DESC"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def listar_por_empresa(self, empresa_id: UUID) -> List[dict]:
        query = "SELECT * FROM movimiento_inventario WHERE empresa_id = %s ORDER BY fecha_movimiento DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM movimiento_inventario WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_movimiento(self, id: UUID, data: dict) -> Optional[dict]:
        if not data:
            return None

        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE movimiento_inventario SET {', '.join(set_clauses)} WHERE id = %s RETURNING *"

        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_movimiento(self, id: UUID) -> bool:
        query = "DELETE FROM movimiento_inventario WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

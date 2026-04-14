from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioGastos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def validar_usuario_empresa(self, user_id: UUID, empresa_id: UUID) -> bool:
        with self.db.cursor() as cur:
            cur.execute("SELECT 1 FROM usuarios WHERE user_id = %s AND empresa_id = %s", (str(user_id), str(empresa_id)))
            return cur.fetchone() is not None

    def crear_gasto(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO gastos ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT g.*, (g.total - COALESCE(SUM(pg.monto), 0)) as saldo
            FROM gastos g
            LEFT JOIN pago_gasto pg ON g.id = pg.gasto_id
            WHERE g.id = %s
            GROUP BY g.id
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_por_empresa(self, empresa_id: UUID) -> List[dict]:
        query = """
            SELECT g.*, (g.total - COALESCE(SUM(pg.monto), 0)) as saldo
            FROM gastos g
            LEFT JOIN pago_gasto pg ON g.id = pg.gasto_id
            WHERE g.empresa_id = %s
            GROUP BY g.id
            ORDER BY g.fecha_emision DESC, g.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_todos(self) -> List[dict]:
        query = """
            SELECT g.*, (g.total - COALESCE(SUM(pg.monto), 0)) as saldo
            FROM gastos g
            LEFT JOIN pago_gasto pg ON g.id = pg.gasto_id
            GROUP BY g.id
            ORDER BY g.fecha_emision DESC, g.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def actualizar_gasto(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE gastos SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_gasto(self, id: UUID) -> bool:
        query = "DELETE FROM gastos WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_total_gastos(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> float:
        query = """
            SELECT COALESCE(SUM(total), 0) as total
            FROM gastos
            WHERE empresa_id = %s AND fecha_emision BETWEEN %s AND %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return float(row['total']) if row else 0.0

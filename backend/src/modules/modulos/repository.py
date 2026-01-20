from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioModulos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_todos(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM modulo ORDER BY orden ASC")
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM modulo WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_codigo(self, codigo: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM modulo WHERE codigo = %s", (codigo,))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO modulo ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = list(data.values())
        values.append(str(id))
        query = f"UPDATE modulo SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
            
    # --- Modulo Plan ---
    def vincular_a_plan(self, plan_id: UUID, modulo_id: UUID, incluido: bool = True):
        query = """
            INSERT INTO modulo_plan (plan_id, modulo_id, incluido, created_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (plan_id, modulo_id) DO UPDATE SET incluido = EXCLUDED.incluido, updated_at = NOW()
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(plan_id), str(modulo_id), incluido))
            return cur.fetchone()

    def listar_por_plan(self, plan_id: UUID) -> List[dict]:
        query = """
            SELECT mp.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo
            FROM modulo_plan mp
            JOIN modulo m ON mp.modulo_id = m.id
            WHERE mp.plan_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(plan_id),))
            return [dict(row) for row in cur.fetchall()]

    # --- Modulo Empresa ---
    def asignar_a_empresa(self, empresa_id: UUID, modulo_id: UUID, data: dict):
        base = {"empresa_id": str(empresa_id), "modulo_id": str(modulo_id)}
        base.update(data)
        fields = list(base.keys())
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO modulo_empresa ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(base.values()))
            return cur.fetchone()

    def listar_por_empresa(self, empresa_id: UUID) -> List[dict]:
        query = """
            SELECT me.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo, m.icono as modulo_icono
            FROM modulo_empresa me
            JOIN modulo m ON me.modulo_id = m.id
            WHERE me.empresa_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def sincronizar_plan_a_empresa(self, empresa_id: UUID, plan_id: UUID, fecha_vencimiento: date):
        modulos = self.listar_por_plan(plan_id)
        count = 0
        with db_transaction(self.db) as cur:
            for mod in modulos:
                if mod['incluido']:
                    query = """
                        INSERT INTO modulo_empresa (empresa_id, modulo_id, activo, fecha_activacion, fecha_vencimiento)
                        VALUES (%s, %s, TRUE, CURRENT_DATE, %s)
                        ON CONFLICT (empresa_id, modulo_id) DO UPDATE 
                        SET activo = TRUE, fecha_vencimiento = EXCLUDED.fecha_vencimiento, updated_at = NOW()
                    """
                    cur.execute(query, (str(empresa_id), str(mod['modulo_id']), fecha_vencimiento))
                    count += 1
        return count

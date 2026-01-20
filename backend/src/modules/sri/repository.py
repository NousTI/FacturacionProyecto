from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioSRI:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Configuración ---
    def obtener_config(self, empresa_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM configuracion_sri WHERE empresa_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_config(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO configuracion_sri ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_config(self, id: UUID, data: dict) -> Optional[dict]:
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE configuracion_sri SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_configs(self) -> List[dict]:
        query = "SELECT * FROM configuracion_sri"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    # --- Autorizaciones ---
    def crear_autorizacion(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"""
            INSERT INTO autorizacion_sri ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            ON CONFLICT (factura_id) DO UPDATE SET {', '.join([f'{f}=EXCLUDED.{f}' for f in fields])}, updated_at = NOW()
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_autorizacion(self, factura_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM autorizacion_sri WHERE factura_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            row = cur.fetchone()
            return dict(row) if row else None

from typing import List, Optional
from ...database.session import get_db
from ...database.transaction import db_transaction
from fastapi import Depends

class RepositorioConfiguracion:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Configuracion Global ---
    def listar_config(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM configuracion_global ORDER BY categoria, clave")
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_clave(self, clave: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM configuracion_global WHERE clave = %s", (clave,))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_config(self, clave: str, valor: str) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute(
                "UPDATE configuracion_global SET valor = %s, updated_at = NOW() WHERE clave = %s",
                (valor, clave)
            )
            return cur.rowcount > 0

    # --- Feature Flags ---
    def listar_flags(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM feature_flag ORDER BY codigo")
            return [dict(row) for row in cur.fetchall()]

    def actualizar_flag(self, codigo: str, activo: bool) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute(
                "UPDATE feature_flag SET activo = %s, updated_at = NOW() WHERE codigo = %s",
                (activo, codigo)
            )
            return cur.rowcount > 0

    # --- Catálogos ---
    def listar_catalogos(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM catalogo ORDER BY nombre")
            return [dict(row) for row in cur.fetchall()]

    # --- Plantillas ---
    def listar_plantillas(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plantilla_notificacion ORDER BY codigo")
            return [dict(row) for row in cur.fetchall()]

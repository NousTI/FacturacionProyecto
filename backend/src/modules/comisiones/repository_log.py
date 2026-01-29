from fastapi import Depends
from uuid import UUID
from datetime import datetime
import json
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioComisionLog:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def registrar_log(self, 
                     comision_id: UUID, 
                     estado_anterior: str, 
                     estado_nuevo: str, 
                     snapshot: dict,
                     responsable_id: UUID = None,
                     rol_responsable: str = None,
                     observaciones: str = None):
        
        query = """
            INSERT INTO sistema_facturacion.comisiones_logs (
                comision_id, 
                responsable_id, 
                rol_responsable, 
                estado_anterior, 
                estado_nuevo, 
                datos_snapshot, 
                observaciones
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        # Serialize snapshot to JSON string if it's a dict
        snapshot_json = json.dumps(snapshot, default=str)
        
        params = (
            str(comision_id),
            str(responsable_id) if responsable_id else None,
            rol_responsable,
            estado_anterior,
            estado_nuevo,
            snapshot_json,
            observaciones
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, params)

    def obtener_por_comision(self, comision_id: UUID) -> list[dict]:
        query = """
            SELECT l.*, u.email as responsable_email
            FROM sistema_facturacion.comisiones_logs l
            LEFT JOIN sistema_facturacion.users u ON l.responsable_id = u.id
            WHERE l.comision_id = %s
            ORDER BY l.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(comision_id),))
            return [dict(row) for row in cur.fetchall()]

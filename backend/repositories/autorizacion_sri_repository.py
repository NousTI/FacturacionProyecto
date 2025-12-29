from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction
from models.AutorizacionSRI import AutorizacionSRICreate, AutorizacionSRIRead

class AutorizacionSRIRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: AutorizacionSRICreate) -> Optional[dict]:
        query = """
            INSERT INTO autorizacion_sri (
                factura_id, numero_autorizacion, fecha_autorizacion,
                estado, mensajes, xml_enviado, xml_respuesta
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s
            )
            ON CONFLICT (factura_id) DO UPDATE SET
                numero_autorizacion = EXCLUDED.numero_autorizacion,
                fecha_autorizacion = EXCLUDED.fecha_autorizacion,
                estado = EXCLUDED.estado,
                mensajes = EXCLUDED.mensajes,
                xml_enviado = EXCLUDED.xml_enviado,
                xml_respuesta = EXCLUDED.xml_respuesta,
                updated_at = NOW()
            RETURNING *
        """
        values = (
            str(data.factura_id),
            data.numero_autorizacion,
            data.fecha_autorizacion,
            data.estado,
            data.mensajes,
            data.xml_enviado,
            data.xml_respuesta
        )

        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_factura_id(self, factura_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM autorizacion_sri WHERE factura_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            row = cur.fetchone()
            return dict(row) if row else None

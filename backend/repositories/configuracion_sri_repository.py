from fastapi import Depends
from typing import Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction
from models.ConfiguracionSRI import ConfiguracionSRICreate, ConfiguracionSRIUpdate

class ConfiguracionSRIRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: ConfiguracionSRICreate) -> Optional[dict]:
        query = """
            INSERT INTO configuracion_sri (
                empresa_id, ambiente, tipo_emision, certificado_digital, clave_certificado,
                fecha_expiracion_cert, firma_activa
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        values = (
            str(data.empresa_id),
            data.ambiente,
            data.tipo_emision,
            data.certificado_digital,
            data.clave_certificado,
            data.fecha_expiracion_cert,
            data.firma_activa
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_empresa_id(self, empresa_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM configuracion_sri WHERE empresa_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def update(self, empresa_id: UUID, data: ConfiguracionSRIUpdate) -> Optional[dict]:
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
            return self.get_by_empresa_id(empresa_id)

        fields = []
        values = []
        
        for key, value in data_dict.items():
            fields.append(f"{key} = %s")
            values.append(value)
        
        fields.append("updated_at = NOW()")
        values.append(str(empresa_id))

        query = f"UPDATE configuracion_sri SET {', '.join(fields)} WHERE empresa_id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_all(self) -> list:
        query = "SELECT * FROM configuracion_sri ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

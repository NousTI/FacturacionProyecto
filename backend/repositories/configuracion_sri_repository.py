from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import Optional

class ConfiguracionSRIRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        # Columns matching SQL
        fields = [
            "empresa_id", "ambiente", "tipo_emision", 
            "certificado_digital", "clave_certificado", 
            "fecha_expiracion_cert", "firma_activa"
        ]
        values = [
            str(data['empresa_id']), data['ambiente'], data['tipo_emision'],
            data['certificado_digital'], # BYTEA (bytes)
            data['clave_certificado'], # TEXT (b64 string)
            data['fecha_expiracion_cert'],
            data['firma_activa']
        ]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO configuracion_sri ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def update_cert(self, id: UUID, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        query = """
            UPDATE configuracion_sri
            SET certificado_digital = %s,
                clave_certificado = %s,
                fecha_expiracion_cert = %s,
                ambiente = %s,
                tipo_emision = %s,
                firma_activa = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        values = (
            data['certificado_digital'],
            data['clave_certificado'],
            data['fecha_expiracion_cert'],
            data['ambiente'],
            data['tipo_emision'],
            data['firma_activa'],
            str(id)
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_empresa(self, empresa_id: UUID) -> Optional[dict]:
        if not self.db: return None
        query = "SELECT * FROM configuracion_sri WHERE empresa_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_all(self) -> list:
        if not self.db: return []
        query = "SELECT * FROM configuracion_sri"
        with self.db.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_settings(self, id: UUID, data: dict) -> Optional[dict]:
        """Updates only non-sensitive settings."""
        if not self.db: return None
        
        fields = []
        values = []
        allowed = ["ambiente", "tipo_emision", "firma_activa"]
        
        for key in allowed:
            if key in data and data[key] is not None:
                fields.append(f"{key} = %s")
                values.append(data[key])
                
        if not fields: return self.get_by_empresa(data.get('empresa_id')) # Nothing to update
        
        query = f"UPDATE configuracion_sri SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
        values.append(str(id))
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None


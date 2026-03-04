from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction
from psycopg2.extras import RealDictCursor

class RepositorioSRI:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Configuración ---
    def obtener_config(self, empresa_id: UUID, incluir_binarios: bool = False) -> Optional[dict]:
        fields = [
            "id", "empresa_id", "ambiente", "tipo_emision", 
            "fecha_activacion_cert", "fecha_expiracion_cert", 
            "cert_serial", "cert_sujeto", "cert_emisor", 
            "estado", "created_at", "updated_at"
        ]
        
        if incluir_binarios:
            fields.append("certificado_digital")
            fields.append("clave_certificado")
            
        query = f"SELECT {', '.join(fields)} FROM sistema_facturacion.configuraciones_sri WHERE empresa_id = %s"
        
        with self.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_config(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        # Seleccionamos solo lo necesario para el schema de lectura
        returning = "id, empresa_id, ambiente, tipo_emision, fecha_activacion_cert, fecha_expiracion_cert, cert_serial, cert_sujeto, cert_emisor, estado, created_at, updated_at"
        
        query = f"INSERT INTO sistema_facturacion.configuraciones_sri ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING {returning}"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_config(self, id: UUID, data: dict) -> Optional[dict]:
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        
        returning = "id, empresa_id, ambiente, tipo_emision, fecha_activacion_cert, fecha_expiracion_cert, cert_serial, cert_sujeto, cert_emisor, estado, created_at, updated_at"
        
        query = f"UPDATE sistema_facturacion.configuraciones_sri SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING {returning}"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_stats_certificados(self) -> dict:
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'ACTIVO' AND fecha_expiracion_cert > CURRENT_DATE + interval '30 days' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN estado = 'ACTIVO' AND fecha_expiracion_cert <= CURRENT_DATE + interval '30 days' AND fecha_expiracion_cert >= CURRENT_DATE THEN 1 ELSE 0 END) as expiring,
                SUM(CASE WHEN (estado IN ('EXPIRADO', 'REVOCADO') OR estado IS NULL) OR fecha_expiracion_cert < CURRENT_DATE THEN 1 ELSE 0 END) as expired
            FROM sistema_facturacion.configuraciones_sri
        """
        with self.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            row = cur.fetchone()
            return {
                "total": int(row['total'] or 0) if row else 0,
                "active": int(row['active'] or 0) if row else 0,
                "expiring": int(row['expiring'] or 0) if row else 0,
                "expired": int(row['expired'] or 0) if row else 0
            }

    def listar_configs(self) -> List[dict]:
        fields = "c.id, c.empresa_id, c.ambiente, c.tipo_emision, c.fecha_activacion_cert, c.fecha_expiracion_cert, c.cert_serial, c.cert_sujeto, c.cert_emisor, c.estado, c.created_at, c.updated_at, e.razon_social as empresa_nombre, e.ruc as empresa_ruc"
        query = f"""
            SELECT {fields} 
            FROM sistema_facturacion.configuraciones_sri c
            LEFT JOIN sistema_facturacion.empresas e ON c.empresa_id = e.id
            ORDER BY c.created_at DESC
        """
        with self.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    # --- Autorizaciones ---
    def crear_autorizacion(self, data: dict) -> Optional[dict]:
        from psycopg2.extras import Json
        
        fields = list(data.keys())
        values = []
        for k, v in data.items():
            if isinstance(v, UUID):
                values.append(str(v))
            elif k == 'mensajes' and (isinstance(v, list) or isinstance(v, dict)):
                values.append(Json(v))
            else:
                values.append(v)
                
        placeholders = ["%s"] * len(fields)
        query = f"""
            INSERT INTO sistema_facturacion.autorizaciones_sri ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            ON CONFLICT (factura_id) DO UPDATE SET {', '.join([f'{f}=EXCLUDED.{f}' for f in fields])}, updated_at = NOW()
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_autorizacion(self, factura_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.autorizaciones_sri WHERE factura_id = %s"
        with self.db.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (str(factura_id),))
            row = cur.fetchone()
            return dict(row) if row else None

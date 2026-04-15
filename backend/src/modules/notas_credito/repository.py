import json
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional, Any
from fastapi import Depends

from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioNotasCredito:
    """
    Repositorio para el manejo de Notas de Crédito y sus logs.
    Utiliza SQL puro con psycopg2 para mantener consistencia con el módulo de facturas.
    """
    
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _prepare_value(self, value: Any) -> Any:
        """Convierte valores complejos (UUID, datetime) a formatos compatibles con psycopg2."""
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        if isinstance(value, (dict, list)):
            return json.dumps(value, default=str)
        return value

    def _prepare_data(self, data: dict) -> dict:
        """Prepara un diccionario completo para inserción en BD."""
        return {k: self._prepare_value(v) for k, v in data.items()}

    # =========================================================
    # NOTA DE CRÉDITO (CABECERA)
    # =========================================================

    def crear_nota_credito(self, data: dict) -> Optional[dict]:
        """Crea el encabezado de una nota de crédito."""
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.notas_credito ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return self.obtener_por_id(row['id']) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        """Obtiene una nota de crédito por ID con información de la factura y cliente."""
        query = """
            SELECT nc.*, 
                   f.numero_factura as factura_original_numero,
                   f.total as factura_original_total,
                   c.razon_social as cliente_nombre,
                   c.identificacion as cliente_identificacion
            FROM sistema_facturacion.notas_credito nc
            JOIN sistema_facturacion.facturas f ON nc.factura_id = f.id
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE nc.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_notas_credito(
        self,
        empresa_id: Optional[UUID] = None,
        factura_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """Lista notas de crédito con filtros básicos."""
        query = """
            SELECT nc.*, f.numero_factura as factura_original_numero, c.razon_social as cliente_nombre
            FROM sistema_facturacion.notas_credito nc
            JOIN sistema_facturacion.facturas f ON nc.factura_id = f.id
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE 1=1
        """
        params = []
        if empresa_id:
            query += " AND f.empresa_id = %s"
            params.append(str(empresa_id))
        
        if factura_id:
            query += " AND nc.factura_id = %s"
            params.append(str(factura_id))
            
        query += " ORDER BY nc.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_nota_credito(self, id: UUID, data: dict) -> Optional[dict]:
        """Actualiza campos de la nota de crédito (ej: estado_sri, clave_acceso)."""
        if not data: return None
        
        prepared = self._prepare_data(data)
        set_clauses = [f"{k} = %s" for k in prepared.keys()]
        values = list(prepared.values())
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.notas_credito 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    # =========================================================
    # DETALLE DE NOTA DE CRÉDITO
    # =========================================================

    def crear_detalle(self, data: dict) -> Optional[dict]:
        """Inserta un ítem en el detalle de la nota de crédito."""
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.notas_credito_detalle ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_detalles(self, nota_credito_id: UUID) -> List[dict]:
        """Obtiene todos los ítems de una nota de crédito."""
        query = "SELECT * FROM sistema_facturacion.notas_credito_detalle WHERE nota_credito_id = %s ORDER BY created_at"
        with self.db.cursor() as cur:
            cur.execute(query, (str(nota_credito_id),))
            return [dict(row) for row in cur.fetchall()]

    # =========================================================
    # LOGS DE EMISIÓN
    # =========================================================

    def crear_log_emision(self, data: dict) -> Optional[dict]:
        """Registra un intento de envío al SRI."""
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.log_emision_notas_credito ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_logs_emision(self, nota_credito_id: UUID) -> List[dict]:
        """Obtiene el historial de intentos de emisión de una NC."""
        query = """
            SELECT l.*, CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre 
            FROM sistema_facturacion.log_emision_notas_credito l
            LEFT JOIN sistema_facturacion.usuarios u ON l.usuario_id = u.id
            WHERE l.nota_credito_id = %s 
            ORDER BY l.timestamp DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(nota_credito_id),))
            return [dict(row) for row in cur.fetchall()]

    # =========================================================
    # AUTORIZACIONES SRI
    # =========================================================

    def crear_autorizacion(self, data: dict) -> Optional[dict]:
        """Registra la autorización final del SRI."""
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.autorizaciones_sri_notas_credito ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            ON CONFLICT (nota_credito_id) DO UPDATE SET 
                numero_autorizacion = EXCLUDED.numero_autorizacion,
                fecha_autorizacion = EXCLUDED.fecha_autorizacion,
                estado = EXCLUDED.estado,
                mensajes = EXCLUDED.mensajes,
                xml_respuesta = EXCLUDED.xml_respuesta,
                updated_at = NOW()
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_autorizacion(self, nota_credito_id: UUID) -> Optional[dict]:
        """Obtiene los datos de autorización del SRI si existen."""
        query = "SELECT * FROM sistema_facturacion.autorizaciones_sri_notas_credito WHERE nota_credito_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(nota_credito_id),))
            row = cur.fetchone()
            return dict(row) if row else None

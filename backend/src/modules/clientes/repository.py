from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioClientes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_clientes(self, empresa_id: UUID) -> List[dict]:
        """Lista todos los clientes de una empresa específica"""
        query = """
            SELECT * FROM sistema_facturacion.clientes
            WHERE empresa_id = %s
            ORDER BY created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID, empresa_id: Optional[UUID] = None) -> Optional[dict]:
        """Obtiene un cliente por ID, opcionalmente verifica que pertenezca a la empresa"""
        query = "SELECT * FROM sistema_facturacion.clientes WHERE id = %s"
        params = [str(id)]
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_cliente(self, datos: dict) -> Optional[dict]:
        """Crea un nuevo cliente en la base de datos"""
        fields = list(datos.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in datos.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.clientes ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            try:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
            except Exception as e:
                # Manejar error de duplicados (unique constraint)
                if 'uq_cliente_empresa_identificacion' in str(e):
                    raise ValueError(f"Ya existe un cliente con la identificación {datos.get('identificacion')} en esta empresa.")
                raise e

    def actualizar_cliente(self, id: UUID, datos: dict, empresa_id: Optional[UUID] = None) -> Optional[dict]:
        """Actualiza un cliente existente"""
        if not datos:
            return self.obtener_por_id(id, empresa_id)
            
        set_clauses = [f"{k} = %s" for k in datos.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in datos.values()]
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.clientes
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
        """
        
        if empresa_id:
            query += " AND empresa_id = %s"
            values.append(str(empresa_id))
            
        query += " RETURNING *"
        
        with db_transaction(self.db) as cur:
            try:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
            except Exception as e:
                 if 'uq_cliente_empresa_identificacion' in str(e):
                    raise ValueError(f"Ya existe un cliente con la identificación {datos.get('identificacion')} en esta empresa.")
                 raise e

    def eliminar_cliente(self, id: UUID, empresa_id: Optional[UUID] = None) -> bool:
        """Elimina un cliente (Soft delete recomendado, pero hard delete por ahora segun requerimiento anterior)"""
        query = "DELETE FROM sistema_facturacion.clientes WHERE id = %s"
        params = [str(id)]
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount > 0

    def obtener_stats(self, empresa_id: UUID) -> dict:
        """Estadísticas simples para el dashboard"""
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE activo = true) as activos,
                COUNT(*) FILTER (WHERE limite_credito > 0) as con_credito
            FROM sistema_facturacion.clientes
            WHERE empresa_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "con_credito": 0}


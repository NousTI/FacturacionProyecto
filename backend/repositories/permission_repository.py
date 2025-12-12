from database.connection import get_db_connection
from fastapi import Depends

class PermissionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def get_permissions_by_role_id(self, role_id: int):
        """
        Retorna una lista de 'coding strings' de permisos (ej. 'users:read')
        asociados al rol.
        """
        if not self.db:
            return []
        
        # NOTA: Se asume que la tabla PERMISO tiene columna 'CODIGO' (o usamos 'NOMBRE' como fallback si no existe aún)
        # El plan incluía agregar CODIGO.
        
        cursor = self.db.cursor()
        try:
            # JOIN entre PERMISO y ROL_PERMISO
            # Se busca el CODIGO
            cursor.execute(
                """
                SELECT p.CODIGO
                FROM PERMISO p
                JOIN ROL_PERMISO rp ON p.ID = rp.FK_PERMISO
                WHERE rp.FK_ROL = %s
                """,
                (role_id,)
            )
            rows = cursor.fetchall()
            # Retornamos una lista de CODIGOS (ej: 'clients:read'), no nombres.
            permissions = [row['codigo'] for row in rows]
            return permissions
        except Exception as e:
            print(f"Error fetching permissions: {e}")
            return []
        finally:
            cursor.close()

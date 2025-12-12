# backend/repositories/cliente_repository.py

from fastapi import Depends

from database.connection import get_db_connection
from database.transaction import db_transaction


class ClienteRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db  # La conexión se inyecta automáticamente

    # --- GET por ID ---
    # --- GET por ID ---
    def obtener_cliente_por_id(self, cliente_id: int):
        if not self.db:
            return {"error": "No se pudo conectar a la base de datos"}

        cursor = self.db.cursor()
        try:
            cursor.execute(
                """
                SELECT id, nombre, num_identificacion, celular, direccion, correo, tipo_cliente
                FROM cliente
                WHERE id = %s
                """,
                (cliente_id,),
            )
            resultado = cursor.fetchone()
            return resultado
        except Exception as error:
            return {"error": f"Error al obtener cliente: {error}"}
        finally:
            cursor.close()

    # --- LISTAR TODOS ---
    def listar_clientes(self, nombre: str = None, num_identificacion: str = None, correo: str = None):
        if not self.db:
            return {"error": "No se pudo conectar a la base de datos"}

        cursor = self.db.cursor()
        try:
            query = """
                SELECT id, nombre, num_identificacion, celular, direccion, correo, tipo_cliente
                FROM cliente
            """
            conditions = []
            params = []

            if nombre:
                conditions.append("nombre ILIKE %s")
                params.append(f"%{nombre}%")
            if num_identificacion:
                conditions.append("num_identificacion ILIKE %s")
                params.append(f"%{num_identificacion}%")
            if correo:
                conditions.append("correo ILIKE %s")
                params.append(f"%{correo}%")

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            cursor.execute(query, tuple(params))
            resultados = cursor.fetchall()
            return resultados
        except Exception as error:
            return {"error": f"Error al listar clientes: {error}"}
        finally:
            cursor.close()

    # --- CREAR CLIENTE ---
    def crear_cliente(self, datos):
        if not self.db:
            return {"error": "No se pudo conectar a la base de datos"}

        try:
            with db_transaction(self.db) as cur:
                sql = """
                    INSERT INTO cliente (nombre, num_identificacion, celular, direccion, correo, tipo_cliente)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """
                cur.execute(
                    sql,
                    (
                        datos.nombre,
                        datos.num_identificacion,
                        datos.celular,
                        datos.direccion,
                        datos.correo,
                        datos.tipo_cliente,
                    ),
                )
                cliente_id = cur.fetchone()["id"]
            return {"success": True, "id": cliente_id}
        except Exception as error:
            return {"error": f"Error al crear cliente: {error}"}

    # --- ACTUALIZAR CLIENTE ---
    def actualizar_cliente(self, cliente_id: int, datos):
        if not self.db:
            return {"error": "No se pudo conectar a la base de datos"}

        try:
            with db_transaction(self.db) as cur:
                sql = """
                    UPDATE cliente
                    SET nombre=%s, num_identificacion=%s, celular=%s, direccion=%s, correo=%s, tipo_cliente=%s
                    WHERE id=%s
                    RETURNING id
                """
                cur.execute(
                    sql,
                    (
                        datos.nombre,
                        datos.num_identificacion,
                        datos.celular,
                        datos.direccion,
                        datos.correo,
                        datos.tipo_cliente,
                        cliente_id,
                    ),
                )
                resultado = cur.fetchone()

            if resultado:
                return {"success": True, "id": resultado["id"]}
            else:
                return {"error": "Cliente no encontrado"}
        except Exception as error:
            return {"error": f"Error al actualizar cliente: {error}"}

    # --- ELIMINAR CLIENTE ---
    def eliminar_cliente(self, cliente_id: int):
        if not self.db:
            return {"error": "No se pudo conectar a la base de datos"}

        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM cliente WHERE id = %s RETURNING id", (cliente_id,))
                resultado = cur.fetchone()
            if resultado:
                return {"success": True, "id": resultado["id"]}
            else:
                return {"error": "Cliente no encontrado"}
        except Exception as error:
            return {"error": f"Error al eliminar cliente: {error}"}

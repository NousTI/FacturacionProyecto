# backend/services/cliente_service.py

from fastapi import Depends
from repositories.cliente_repository import ClienteRepository
from models.Cliente import ClienteCreate

class ClienteService:
    def __init__(self, repo: ClienteRepository = Depends()):
        self.repo = repo

    # ─────────── Listar todos los clientes ───────────
    # ─────────── Listar todos los clientes ───────────
    def listar_clientes(self, nombre: str = None, num_identificacion: str = None, correo: str = None):
        return self.repo.listar_clientes(nombre, num_identificacion, correo)

    # ─────────── Obtener cliente por ID ───────────
    def obtener_cliente(self, cliente_id: int):
        cliente = self.repo.obtener_cliente_por_id(cliente_id)
        if not cliente:
            return None
        return cliente
        
    # ─────────── Crear cliente ───────────
    def crear_cliente(self, datos: ClienteCreate):
        # Validaciones básicas
        if not datos.nombre or not datos.num_identificacion:
            return {"error": "Nombre y número de identificación son obligatorios"}
        if datos.tipo_cliente not in ["NATURAL", "JURIDICA"]:
            return {"error": "Tipo de cliente inválido"}
        
        # Se llama al repo sin usuario_id
        return self.repo.crear_cliente(datos)


    # ─────────── Actualizar cliente ───────────
    def actualizar_cliente(self, cliente_id: int, datos: ClienteCreate):
        # Validación opcional
        if datos.tipo_cliente not in ["NATURAL", "JURIDICA"]:
            return {"error": "Tipo de cliente inválido"}
        
        # Se llama al repo sin usuario_id
        return self.repo.actualizar_cliente(cliente_id, datos)

    # ─────────── Eliminar cliente ───────────
    def eliminar_cliente(self, cliente_id: int):
        return self.repo.eliminar_cliente(cliente_id)

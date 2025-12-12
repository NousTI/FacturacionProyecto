from fastapi import Depends
from repositories.producto_repository import ProductoRepository
from models.Producto import ProductoCreate, ProductoUpdate

class ProductoService:
    def __init__(self, repo: ProductoRepository = Depends()):
        self.repo = repo

    def listar_productos(self, nombre: str = None, codigo: str = None):
        return self.repo.listar_productos(nombre, codigo)

    def obtener_producto(self, producto_id: int):
        return self.repo.obtener_producto_por_id(producto_id)

    def crear_producto(self, datos: ProductoCreate):
        if datos.stock < 0:
            return {"error": "El stock no puede ser negativo"}
        if datos.costo_unitario < 0:
            return {"error": "El costo unitario no puede ser negativo"}
            
        return self.repo.crear_producto(datos)

    def actualizar_producto(self, producto_id: int, datos: ProductoUpdate):
        if datos.stock is not None and datos.stock < 0:
             return {"error": "El stock no puede ser negativo"}
        if datos.costo_unitario is not None and datos.costo_unitario < 0:
             return {"error": "El costo unitario no puede ser negativo"}
             
        return self.repo.actualizar_producto(producto_id, datos)

    def eliminar_producto(self, producto_id: int):
        return self.repo.eliminar_producto(producto_id)

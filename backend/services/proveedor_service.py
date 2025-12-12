from fastapi import Depends
from repositories.proveedor_repository import ProveedorRepository
from models.Proveedor import ProveedorCreate

class ProveedorService:
    def __init__(self, repo: ProveedorRepository = Depends()):
        self.repo = repo

    def listar_proveedores(self):
        return self.repo.listar_proveedores()

    def obtener_proveedor(self, proveedor_id: int):
        return self.repo.obtener_proveedor_por_id(proveedor_id)

    def crear_proveedor(self, datos: ProveedorCreate):
        # Basic validation: check RUC length (Ecuador RUC is 13 digits)
        if len(datos.ruc) != 13:
            return {"error": "RUC debe tener 13 dígitos"}
            
        return self.repo.crear_proveedor(datos)

    def actualizar_proveedor(self, proveedor_id: int, datos: ProveedorCreate):
         if len(datos.ruc) != 13:
            return {"error": "RUC debe tener 13 dígitos"}
         return self.repo.actualizar_proveedor(proveedor_id, datos)

    def eliminar_proveedor(self, proveedor_id: int):
        return self.repo.eliminar_proveedor(proveedor_id)

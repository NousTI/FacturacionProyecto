from fastapi import Depends, HTTPException
from repositories.producto_repository import ProductoRepository
from repositories.proveedor_repository import ProveedorRepository
from models.Producto import ProductoCreate, ProductoUpdate
from uuid import UUID
from utils.enums import AuthKeys

class ProductoService:
    def __init__(
        self, 
        repo: ProductoRepository = Depends(),
        proveedor_repo: ProveedorRepository = Depends()
    ):
        self.repo = repo
        self.proveedor_repo = proveedor_repo

    def listar_productos(self, current_user: dict, nombre: str = None, codigo: str = None):
         # Determine empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        empresa_id = current_user.get("empresa_id")

        if is_superadmin and not empresa_id:
             return [] 

        if not empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")

        return self.repo.listar_productos(empresa_id, nombre, codigo)

    def obtener_producto(self, producto_id: UUID, current_user: dict):
        producto = self.repo.obtener_producto_por_id(producto_id)
        if not producto:
            return None

        # Verify ownership
        user_empresa_id = current_user.get("empresa_id")
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)

        if not is_superadmin and str(producto['empresa_id']) != str(user_empresa_id):
             raise HTTPException(status_code=403, detail="No tienes acceso a este producto")
             
        return producto

    def crear_producto(self, datos: ProductoCreate, current_user: dict):
        empresa_id = current_user.get("empresa_id")
        if not empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")

        if datos.stock < 0:
            return {"error": "El stock no puede ser negativo"}
        if datos.costo_unitario < 0:
            return {"error": "El costo unitario no puede ser negativo"}
            
        # Verify provider belongs to same empresa
        proveedor = self.proveedor_repo.obtener_proveedor_por_id(datos.proveedor_id)
        if not proveedor:
             return {"error": "Proveedor no encontrado"}
        if str(proveedor['empresa_id']) != str(empresa_id):
             return {"error": "El proveedor no pertenece a tu empresa"}
             
        # Check code uniqueness
        if self.repo.codigo_existe(datos.codigo_producto, empresa_id):
             return {"error": "Ya existe un producto con este código"}

        # Inject empresa_id
        datos_dict = datos.model_dump()
        datos_dict["empresa_id"] = empresa_id
            
        return self.repo.crear_producto(datos_dict)

    def actualizar_producto(self, producto_id: UUID, datos: ProductoUpdate, current_user: dict):
        existing = self.obtener_producto(producto_id, current_user)
        if not existing:
             return None

        if datos.stock is not None and datos.stock < 0:
             return {"error": "El stock no puede ser negativo"}
        if datos.costo_unitario is not None and datos.costo_unitario < 0:
             return {"error": "El costo unitario no puede ser negativo"}
             
        # If provider changing, verify ownership
        if datos.proveedor_id:
             empresa_id = current_user.get("empresa_id")
             proveedor = self.proveedor_repo.obtener_proveedor_por_id(datos.proveedor_id)
             if not proveedor or str(proveedor['empresa_id']) != str(empresa_id):
                  return {"error": "El proveedor no es válido para su empresa"}
        
        # If code changing, check uniqueness
        if datos.codigo_producto and datos.codigo_producto != existing['codigo_producto']:
             empresa_id = current_user.get("empresa_id")
             if self.repo.codigo_existe(datos.codigo_producto, empresa_id):
                  return {"error": "Ya existe un producto con este código"}
             
        return self.repo.actualizar_producto(producto_id, datos.model_dump(exclude_unset=True))

    def eliminar_producto(self, producto_id: UUID, current_user: dict):
        self.obtener_producto(producto_id, current_user)
        return self.repo.eliminar_producto(producto_id)

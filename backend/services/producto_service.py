from fastapi import Depends, HTTPException
from repositories.producto_repository import ProductoRepository

from models.Producto import ProductoCreate, ProductoUpdate
from uuid import UUID
from utils.enums import AuthKeys

class ProductoService:
    def __init__(
        self, 
        repo: ProductoRepository = Depends()
    ):
        self.repo = repo

    def listar_productos(self, current_user: dict, nombre: str = None, codigo: str = None):
         # Determine empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        empresa_id = current_user.get("empresa_id")

        if is_superadmin and not empresa_id:
             # Superadmin listing all products
             return self.repo.listar_productos(None, nombre, codigo)

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
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise HTTPException(status_code=400, detail="Superadmins deben especificar empresa_id")
            empresa_id = datos.empresa_id
        else:
            if datos.empresa_id:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No tienes permisos para asignar manualmente la empresa. Se asigna automáticamente."
                )
            empresa_id = current_user.get("empresa_id")
            if not empresa_id:
                 raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")
            # Auto-assign for logic below
            datos.empresa_id = empresa_id

        if datos.precio < 0:
            return {"error": "El precio no puede ser negativo"}
        if datos.costo < 0:
            return {"error": "El costo no puede ser negativo"}
        if datos.stock_actual < 0:
            return {"error": "El stock actual no puede ser negativo"}
        if datos.stock_minimo < 0:
            return {"error": "El stock mínimo no puede ser negativo"}
            
        # Check code uniqueness
        if self.repo.codigo_existe(datos.codigo, empresa_id):
             return {"error": "Ya existe un producto con este código"}

        # Inject empresa_id (already in datos if superadmin, or assigned above)
        datos_dict = datos.model_dump()
        datos_dict["empresa_id"] = empresa_id # Ensure it's set
            
        return self.repo.crear_producto(datos_dict)

    def actualizar_producto(self, producto_id: UUID, datos: ProductoUpdate, current_user: dict):
        existing = self.obtener_producto(producto_id, current_user)
        if not existing:
             return None

        if datos.precio is not None and datos.precio < 0:
             return {"error": "El precio no puede ser negativo"}
        if datos.costo is not None and datos.costo < 0:
             return {"error": "El costo no puede ser negativo"}
        if datos.stock_actual is not None and datos.stock_actual < 0:
             return {"error": "El stock actual no puede ser negativo"}
        if datos.stock_minimo is not None and datos.stock_minimo < 0:
             return {"error": "El stock mínimo no puede ser negativo"}
             
        # If code changing, check uniqueness
        if datos.codigo and datos.codigo != existing['codigo']:
             empresa_id = current_user.get("empresa_id")
             if self.repo.codigo_existe(datos.codigo, empresa_id):
                  return {"error": "Ya existe un producto con este código"}
             
        return self.repo.actualizar_producto(producto_id, datos.model_dump(exclude_unset=True))

    def eliminar_producto(self, producto_id: UUID, current_user: dict):
        self.obtener_producto(producto_id, current_user)
        return self.repo.eliminar_producto(producto_id)

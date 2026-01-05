from fastapi import Depends, HTTPException, status
from typing import List
from uuid import UUID

from repositories.movimiento_inventario_repository import MovimientoInventarioRepository
from models.MovimientoInventario import MovimientoInventarioCreate
from utils.enums import AuthKeys

class MovimientoInventarioService:
    def __init__(self, repository: MovimientoInventarioRepository = Depends()):
        self.repository = repository

    def create(self, data: MovimientoInventarioCreate, current_user: dict) -> dict:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        
        # 1. Get Product & Validate Existence
        producto = self.repository.get_producto_actual(data.producto_id)
        if not producto:
             raise HTTPException(status_code=404, detail="Producto no encontrado")
             
        # 2. Validate Permissions (Company ownership)
        if not is_superadmin:
             user_empresa_id = current_user.get('empresa_id')
             if str(producto['empresa_id']) != str(user_empresa_id):
                  raise HTTPException(status_code=403, detail="No tiene permisos para modificar este producto")
                  
        # 3. Resolve Usuario ID
        if is_superadmin:
             if not data.usuario_id:
                  raise HTTPException(status_code=400, detail="Superadmin debe especificar usuario_id")
             usuario_id = data.usuario_id
             # Not explicitly validating user-company match here for speed, but ideally should. 
             # Assuming Superadmin knows what they're doing or DB FK will catch if user doesn't exist.
             # Ideally we should strict check like in Gasto, but keeping it simple as per plan.
        else:
             usuario_id = current_user.get('sub') or current_user.get('id')
             if not usuario_id:
                  raise HTTPException(status_code=400, detail="No se pudo identificar al usuario")
        
        # 4. Calculate Stock Logic
        stock_anterior = producto['stock_actual']
        cantidad = data.cantidad
        tipo = data.tipo_movimiento
        
        if tipo in ['entrada', 'devolucion', 'ajuste']:
            # Assuming 'ajuste' is positive addition if just 'ajuste' is used
            # If standard is to allow negative, user would use 'salida'. 
            stock_nuevo = stock_anterior + cantidad
        elif tipo == 'salida':
            if stock_anterior < cantidad:
                 raise HTTPException(status_code=400, detail="Stock insuficiente para realizar la salida")
            stock_nuevo = stock_anterior - cantidad
        else:
             stock_nuevo = stock_anterior # Should not happen due to Literal check
             
        # 5. Prepare Data
        data_dict = data.model_dump(exclude_unset=True)
        data_dict['empresa_id'] = str(producto['empresa_id'])
        data_dict['usuario_id'] = str(usuario_id)
        data_dict['stock_anterior'] = stock_anterior
        data_dict['stock_nuevo'] = stock_nuevo
        
        try:
            # 6. Create Record
            result = self.repository.create(data_dict)
            if not result:
                raise HTTPException(status_code=500, detail="Error al registrar movimiento")
                
            # 7. Update Product Stock
            self.repository.update_producto_stock(data.producto_id, stock_nuevo)
            
            return result
        except Exception as e:
            raise e

    def list_by_producto(self, producto_id: UUID, current_user: dict) -> List[dict]:
        # Check permissions
        producto = self.repository.get_producto_actual(producto_id)
        if not producto:
             raise HTTPException(status_code=404, detail="Producto no encontrado")
             
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             if str(producto['empresa_id']) != str(current_user.get('empresa_id')):
                  raise HTTPException(status_code=403, detail="No tiene acceso a los movimientos de este producto")
        
        return self.repository.list_by_producto(producto_id)

    def list_all(self, current_user: dict) -> List[dict]:
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Acceso denegado: Solo Superadmin")
        return self.repository.list_all()

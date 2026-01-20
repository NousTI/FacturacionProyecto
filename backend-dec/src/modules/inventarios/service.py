from fastapi import Depends
from typing import List
from uuid import UUID

from .repository import RepositorioInventarios
from .schemas import MovimientoInventarioCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioInventarios:
    def __init__(self, repo: RepositorioInventarios = Depends()):
        self.repo = repo

    def crear_movimiento(self, datos: MovimientoInventarioCreacion, usuario_actual: dict):
        producto = self.repo.obtener_producto(datos.producto_id)
        if not producto: raise AppError("Producto no encontrado", 404, "PRODUCTO_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(producto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                
        usuario_id = datos.usuario_id or usuario_actual.get('id')
        if not usuario_id: raise AppError("Usuario no identificado", 400, "USER_MISSING")
        
        stock_ant = producto['stock_actual']
        tipo = datos.tipo_movimiento
        
        if tipo in ['entrada', 'devolucion', 'ajuste']:
            stock_nuevo = stock_ant + datos.cantidad
        else: # salida
            if stock_ant < datos.cantidad:
                raise AppError("Stock insuficiente", 400, "STOCK_INSUFFICIENT")
            stock_nuevo = stock_ant - datos.cantidad
            
        dict_m = datos.model_dump()
        dict_m['empresa_id'] = str(producto['empresa_id'])
        dict_m['usuario_id'] = str(usuario_id)
        dict_m['stock_anterior'] = stock_ant
        dict_m['stock_nuevo'] = stock_nuevo
        
        res = self.repo.crear_movimiento(dict_m)
        self.repo.actualizar_stock(datos.producto_id, stock_nuevo)
        return res

    def listar_por_producto(self, producto_id: UUID, usuario_actual: dict):
        producto = self.repo.obtener_producto(producto_id)
        if not producto: raise AppError("Producto no encontrado", 404, "PRODUCTO_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(producto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                
        return self.repo.listar_por_producto(producto_id)

    def listar_todos(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.listar_todos()

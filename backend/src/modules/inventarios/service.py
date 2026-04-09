from fastapi import Depends
from typing import List
from uuid import UUID

from .repository import RepositorioInventarios
from .schemas import MovimientoInventarioCreacion
from ...constants.enums import AuthKeys
from ...constants.permissions import PermissionCodes
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
        return self._filtrar_costos(res, usuario_actual)

    def _filtrar_costos(self, item: dict, usuario_actual: dict):
        if not item: return item
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            return item
        
        permisos = usuario_actual.get("permisos", [])
        if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
            item['costo_unitario'] = None
            item['costo_total'] = None
        return item

    def listar_por_producto(self, producto_id: UUID, usuario_actual: dict):
        producto = self.repo.obtener_producto(producto_id)
        if not producto: raise AppError("Producto no encontrado", 404, "PRODUCTO_NOT_FOUND")
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(producto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                
        movimientos = self.repo.listar_por_producto(producto_id)
        return [self._filtrar_costos(m, usuario_actual) for m in movimientos]

    def listar_todos(self, usuario_actual: dict):
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            movimientos = self.repo.listar_todos()
        else:
            empresa_id = usuario_actual.get('empresa_id')
            if not empresa_id:
                raise AppError("Empresa no identificada", 400, "EMPRESA_MISSING")
            movimientos = self.repo.listar_por_empresa(empresa_id)
            
        return [self._filtrar_costos(m, usuario_actual) for m in movimientos]

    def obtener_movimiento(self, id: UUID, usuario_actual: dict):
        movimiento = self.repo.obtener_por_id(id)
        if not movimiento:
            raise AppError("Movimiento no encontrado", 404, "MOVIMIENTO_NOT_FOUND")

        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(movimiento['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

        return self._filtrar_costos(movimiento, usuario_actual)

    def actualizar_movimiento(self, id: UUID, datos: dict, usuario_actual: dict):
        movimiento = self.obtener_movimiento(id, usuario_actual)
        if not movimiento:
            raise AppError("Movimiento no encontrado", 404, "MOVIMIENTO_NOT_FOUND")

        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload:
                return movimiento

            actualizado = self.repo.actualizar_movimiento(id, payload)
            if not actualizado:
                raise AppError("Error al actualizar movimiento", 500, "DB_ERROR")
            return self._filtrar_costos(actualizado, usuario_actual)
        except Exception as e:
            if "stock_anterior" in str(e).lower():
                raise AppError("No se puede cambiar stock anterior", 400, "VAL_ERROR")
            raise e

    def eliminar_movimiento(self, id: UUID, usuario_actual: dict):
        movimiento = self.obtener_movimiento(id, usuario_actual)
        if not movimiento:
            raise AppError("Movimiento no encontrado", 404, "MOVIMIENTO_NOT_FOUND")

        if not self.repo.eliminar_movimiento(id):
            raise AppError("No se pudo eliminar movimiento", 500, "DB_ERROR")
        return True

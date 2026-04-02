from fastapi import Depends
from uuid import UUID
from typing import List, Optional
import logging

from .repository import RepositorioProductos
from .schemas import ProductoCreacion, ProductoActualizacion
from ...constants.enums import AuthKeys
from ...constants.permissions import PermissionCodes
from ...errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class ServicioProductos:
    def __init__(self, repo: RepositorioProductos = Depends()):
        self.repo = repo

    def listar_productos(self, usuario_actual: dict, nombre: str = None, codigo: str = None, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        # Determine effective empresa_id
        # 1. Regular users must always filter by their own company
        if not is_superadmin:
            target_empresa_id = usuario_actual.get("empresa_id")
            if not target_empresa_id:
                raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
        else:
            # 2. Superadmins can filter by the provided empresa_id or see all if none provided
            target_empresa_id = empresa_id

        productos = self.repo.listar_productos(target_empresa_id, nombre, codigo)
        return [self._filtrar_costos(p, usuario_actual) for p in productos]

    def obtener_producto(self, producto_id: UUID, usuario_actual: dict):
        producto = self.repo.obtener_por_id(producto_id)
        if not producto:
            raise AppError("Producto no encontrado", 404, "PRODUCTO_NOT_FOUND")

        user_empresa_id = usuario_actual.get("empresa_id")
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)

        if not is_superadmin and str(producto['empresa_id']) != str(user_empresa_id):
             raise AppError("No tienes acceso a este producto", 403, "AUTH_FORBIDDEN")
             
        return self._filtrar_costos(producto, usuario_actual)

    def _filtrar_costos(self, producto: dict, usuario_actual: dict):
        """Oculta el costo si el usuario no tiene el permiso adecuado."""
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            return producto
            
        permisos = usuario_actual.get("permisos", [])
        if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
            producto["costo"] = None
            if "utilidad" in producto: producto["utilidad"] = None
            if "margen" in producto: producto["margen"] = None
            # 
        return producto

    def crear_producto(self, datos: ProductoCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise AppError("Superadmins deben especificar empresa_id", 400, "VAL_ERROR")
            empresa_id = datos.empresa_id
        else:
            if datos.empresa_id:
                 raise AppError("No tienes permisos para asignar manualmente la empresa", 403, "AUTH_FORBIDDEN")
            empresa_id = usuario_actual.get("empresa_id")
            if not empresa_id:
                 raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
            datos.empresa_id = empresa_id

        if self.repo.codigo_existe(datos.codigo, empresa_id):
             raise AppError("Ya existe un producto con este código", 409, "PRODUCTO_EXISTS")

        payload = datos.model_dump()
        payload["empresa_id"] = empresa_id
        
        # Blindly assigning cost only if authorized
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            permisos = usuario_actual.get("permisos", [])
            if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
                payload.pop("costo", None) # Don't allow setting cost if can't see it
            
        return self.repo.crear_producto(payload)

    def actualizar_producto(self, producto_id: UUID, datos: ProductoActualizacion, usuario_actual: dict):
        existing = self.obtener_producto(producto_id, usuario_actual)
        
        payload = datos.model_dump(exclude_unset=True)
        if not payload:
             return existing

        # Proteccion de costos en actualizacion
        if 'costo' in payload and not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            permisos = usuario_actual.get("permisos", [])
            if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
                payload.pop('costo')

        if 'codigo' in payload and payload['codigo'] != existing['codigo']:
             empresa_id = usuario_actual.get("empresa_id")
             if self.repo.codigo_existe(payload['codigo'], empresa_id):
                  raise AppError("Ya existe un producto con este código", 409, "PRODUCTO_EXISTS")
             
        updated = self.repo.actualizar_producto(producto_id, payload)
        if not updated:
             raise AppError("Error al actualizar producto", 500, "DB_ERROR")
        return updated

    def eliminar_producto(self, producto_id: UUID, usuario_actual: dict):
        self.obtener_producto(producto_id, usuario_actual)
        if not self.repo.eliminar_producto(producto_id):
             raise AppError("Error al eliminar producto", 500, "DB_ERROR")
        return True

    def obtener_productos_mas_vendidos(self, usuario_actual: dict, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, limit: int = 10, criterio: str = 'cantidad'):
        empresa_id = usuario_actual.get("empresa_id")
        if not empresa_id and not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
        productos = self.repo.obtener_productos_mas_vendidos(empresa_id, fecha_inicio, fecha_fin, limit, criterio)
        return [self._filtrar_costos(p, usuario_actual) for p in productos]

    def obtener_productos_sin_movimiento(self, usuario_actual: dict, dias: int = 30):
        empresa_id = usuario_actual.get("empresa_id")
        if not empresa_id and not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
        productos = self.repo.obtener_productos_sin_movimiento(empresa_id, dias)
        return [self._filtrar_costos(p, usuario_actual) for p in productos]

    def obtener_rentabilidad_productos(self, usuario_actual: dict):
        empresa_id = usuario_actual.get("empresa_id")
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            permisos = usuario_actual.get("permisos", [])
            if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
                raise AppError("No autorizado para ver rentabilidad (requiere permisos de costos)", 403, "AUTH_FORBIDDEN")
        return self.repo.obtener_rentabilidad_productos(empresa_id)

    def obtener_reporte_inventario(self, usuario_actual: dict):
        empresa_id = usuario_actual.get("empresa_id")
        productos = self.repo.obtener_reporte_inventario(empresa_id)
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            permisos = usuario_actual.get("permisos", [])
            can_see_costs = PermissionCodes.PRODUCTOS_VER_COSTOS in permisos
            for p in productos:
                if not can_see_costs:
                    p['costo_unitario'] = None
                    p['valor_total_inventario'] = None
        return productos

    def obtener_kardex_producto(self, producto_id: UUID, usuario_actual: dict, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        producto = self.obtener_producto(producto_id, usuario_actual)
        empresa_id = usuario_actual.get("empresa_id")
        movimientos = self.repo.obtener_kardex_producto(producto_id, empresa_id, fecha_inicio, fecha_fin)
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            permisos = usuario_actual.get("permisos", [])
            if PermissionCodes.PRODUCTOS_VER_COSTOS not in permisos:
                for idx in range(len(movimientos)):
                     movimientos[idx]['costo_unitario'] = None
                     movimientos[idx]['costo_total'] = None
        return movimientos

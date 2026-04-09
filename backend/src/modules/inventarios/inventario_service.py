from fastapi import Depends
from typing import List
from uuid import UUID

from .inventario_repository import RepositorioInventarioStock
from .schemas import InventarioCreacion, InventarioActualizacion
from ...constants.enums import AuthKeys
from ...constants.inventario import ESTADOS_INVENTARIO, UNIDADES_MEDIDA
from ...errors.app_error import AppError


class ServicioInventarioStock:
    """Servicio para gestionar el inventario (estado actual de stock)"""

    def __init__(self, repo: RepositorioInventarioStock = Depends()):
        self.repo = repo

    def listar_por_empresa(self, usuario_actual: dict) -> List[dict]:
        """Listar inventario de la empresa del usuario"""
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            raise AppError("Empresa no identificada", 400, "EMPRESA_MISSING")

        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(empresa_id) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

        return self.repo.listar_por_empresa(empresa_id)

    def obtener_stock_resumen(self, usuario_actual: dict) -> List[dict]:
        """Obtener resumen de stock por estado para todos los productos"""
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            raise AppError("Empresa no identificada", 400, "EMPRESA_MISSING")

        return self.repo.obtener_stock_por_estado(empresa_id)

    def obtener_por_id(self, id: UUID, usuario_actual: dict) -> dict:
        """Obtener un registro de inventario por ID"""
        inventario = self.repo.obtener_por_id(id)
        if not inventario:
            raise AppError("Registro de inventario no encontrado", 404, "INVENTARIO_NOT_FOUND")

        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(inventario['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

        return inventario

    def crear(self, datos: InventarioCreacion, usuario_actual: dict) -> dict:
        """Crear un nuevo registro de inventario"""
        # Validar que el producto pertenece a la empresa del usuario
        from .repository import RepositorioInventarios
        repo_inventarios = RepositorioInventarios()

        producto = repo_inventarios.obtener_producto(datos.producto_id)
        if not producto:
            raise AppError("Producto no encontrado", 404, "PRODUCTO_NOT_FOUND")

        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(producto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

        # Validar estados
        if datos.estado not in ESTADOS_INVENTARIO:
            raise AppError(f"Estado inválido: {datos.estado}", 400, "VAL_ERROR")

        if datos.unidad_medida not in UNIDADES_MEDIDA:
            raise AppError(f"Unidad de medida inválida: {datos.unidad_medida}", 400, "VAL_ERROR")

        payload = datos.model_dump()
        payload['empresa_id'] = str(producto['empresa_id'])

        nuevo = self.repo.crear(payload)
        if not nuevo:
            raise AppError("Error al crear inventario", 500, "DB_ERROR")
        return nuevo

    def actualizar(self, id: UUID, datos: InventarioActualizacion, usuario_actual: dict) -> dict:
        """Actualizar un registro de inventario"""
        inventario = self.obtener_por_id(id, usuario_actual)

        # Validar estados si se envía
        if datos.estado and datos.estado not in ESTADOS_INVENTARIO:
            raise AppError(f"Estado inválido: {datos.estado}", 400, "VAL_ERROR")

        if datos.unidad_medida and datos.unidad_medida not in UNIDADES_MEDIDA:
            raise AppError(f"Unidad de medida inválida: {datos.unidad_medida}", 400, "VAL_ERROR")

        payload = datos.model_dump(exclude_unset=True)
        if not payload:
            return inventario

        actualizado = self.repo.actualizar(id, payload)
        if not actualizado:
            raise AppError("Error al actualizar inventario", 500, "DB_ERROR")
        return actualizado

    def eliminar(self, id: UUID, usuario_actual: dict) -> bool:
        """Eliminar un registro de inventario"""
        inventario = self.obtener_por_id(id, usuario_actual)

        if not self.repo.eliminar(id):
            raise AppError("Error al eliminar inventario", 500, "DB_ERROR")
        return True

from uuid import UUID
from typing import List, Optional
from decimal import Decimal
from fastapi import Depends, HTTPException, status
from models.FacturaDetalle import FacturaDetalleCreateInput, FacturaDetalleCreate, FacturaDetalleUpdate, FacturaDetalleRead
from repositories.factura_detalle_repository import FacturaDetalleRepository
from repositories.factura_repository import FacturaRepository
from repositories.producto_repository import ProductoRepository
from utils.enums import AuthKeys

class FacturaDetalleService:
    def __init__(
        self, 
        repository: FacturaDetalleRepository = Depends(),
        factura_repository: FacturaRepository = Depends(),
        producto_repository: ProductoRepository = Depends()
    ):
        self.repository = repository
        self.factura_repository = factura_repository
        self.producto_repository = producto_repository

    def _validate_factura_ownership(self, factura_id: UUID, current_user: dict):
        factura = self.factura_repository.get_by_id(factura_id)
        if not factura:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
             
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            user_empresa_id = UUID(current_user["empresa_id"])
            if str(factura['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permiso para editar esta factura")
        return factura

    def create(self, data: FacturaDetalleCreateInput, current_user: dict) -> FacturaDetalleRead:
        # 1. Validate Factura Ownership
        factura = self._validate_factura_ownership(data.factura_id, current_user)
        
        # 2. Handle Product Logic
        costo_unitario = data.costo_unitario
        codigo_final = data.codigo_producto
        descripcion_final = data.descripcion
        
        if data.producto_id:
            # Validate Product
            producto = self.producto_repository.obtener_producto_por_id(data.producto_id)
            if not producto:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
            
            # Helper to check product ownership (Repo might not have generic check, so we do it manual)
            # Factura is validated to be in User's company (or Superadmin target).
            # Product MUST be in the SAME company as the Factura.
            if str(producto['empresa_id']) != str(factura['empresa_id']):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El producto no pertenece a la empresa de la factura")
                
            # Auto-fill/Override logic
            costo_unitario = costo_unitario if costo_unitario is not None else producto.get('costo')
            # If input didn't specify code/desc (though Pydantic requires them currently), we could take from product.
            # But Pydantic 'FacturaDetalleCreateInput' has them as mandatory.
            # So user must send them. We assume Frontend pre-fills them from Product selection.
            # We just validate ID if present.

        internal_data = FacturaDetalleCreate(
            factura_id=data.factura_id,
            producto_id=data.producto_id,
            codigo_producto=data.codigo_producto,
            descripcion=data.descripcion,
            cantidad=data.cantidad,
            precio_unitario=data.precio_unitario,
            descuento=data.descuento,
            subtotal=data.subtotal,
            tipo_iva=data.tipo_iva,
            valor_iva=data.valor_iva,
            costo_unitario=costo_unitario
        )

        try:
            result = self.repository.create(internal_data)
            if not result:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al agregar detalle a la factura")
            return FacturaDetalleRead(**result)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def list(self, factura_id: UUID, current_user: dict) -> List[FacturaDetalleRead]:
        self._validate_factura_ownership(factura_id, current_user)
        results = self.repository.list_by_factura(factura_id)
        return [FacturaDetalleRead(**row) for row in results]

    def update(self, id: UUID, data: FacturaDetalleUpdate, current_user: dict) -> FacturaDetalleRead:
        # Check permissions via Factura ownership
        current_record = self.repository.get_by_id(id)
        if not current_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detalle no encontrado")
            
        self._validate_factura_ownership(current_record['factura_id'], current_user)
        
        result = self.repository.update(id, data)
        if not result:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar el detalle")
        return FacturaDetalleRead(**result)

    def delete(self, id: UUID, current_user: dict):
        current_record = self.repository.get_by_id(id)
        if not current_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detalle no encontrado")
            
        self._validate_factura_ownership(current_record['factura_id'], current_user)
        
        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar el detalle")
        return {"message": "Detalle eliminado correctamente"}

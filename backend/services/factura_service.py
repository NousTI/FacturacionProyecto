from uuid import UUID
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from models.Factura import FacturaCreateInput, FacturaCreate, FacturaUpdate, FacturaRead
from repositories.factura_repository import FacturaRepository
from repositories.cliente_repository import ClienteRepository
from repositories.establecimiento_repository import EstablecimientoRepository
from repositories.punto_emision_repository import PuntoEmisionRepository
from utils.enums import AuthKeys
import datetime

from services.forma_pago_service import FormaPagoService # Import

class FacturaService:
    def __init__(
        self, 
        repository: FacturaRepository = Depends(),
        cliente_repository: ClienteRepository = Depends(),
        establecimiento_repository: EstablecimientoRepository = Depends(),
        punto_emision_repository: PuntoEmisionRepository = Depends(),
        forma_pago_service: FormaPagoService = Depends() # Inject
    ):
        self.repository = repository
        self.cliente_repository = cliente_repository
        self.establecimiento_repository = establecimiento_repository
        self.punto_emision_repository = punto_emision_repository
        self.forma_pago_service = forma_pago_service

    def _validate_ownership(self, user_empresa_id: UUID, is_superadmin: bool, entity_id: UUID, repository, entity_name: str, id_field_in_entity: str = 'empresa_id') -> dict:
        """
        Generic validation helper. 
        If not Superadmin, verifies that entity[id_field_in_entity] == user_empresa_id.
        Returns the entity.
        """
        entity = repository.get_by_id(entity_id)
        if hasattr(repository, 'get_cliente_by_id') and entity_name == 'Cliente': # Special case for ClienteRepo wrapper
             pass # entity is already dict
        
        if not entity:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{entity_name} no encontrado")

        if not is_superadmin:
            # Special handling for PuntoEmision which doesn't have empresa_id directly, but via Establecimiento
            # For this simplistic helper, we assume direct link or pre-validated. 
            # Actually PuntoEmision needs special check.
            if entity_name == 'Punto de Emisión':
                 # Logic handled outside or we fetch establishment here? 
                 # Let's keep this generic for direct props.
                 pass
            elif str(entity[id_field_in_entity]) != str(user_empresa_id):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"El {entity_name} no pertenece a su empresa")
        
        return entity

    def create(self, data: FacturaCreateInput, current_user: dict) -> FacturaRead:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        # 1. Determine Identity (Empresa & Usuario)
        if is_superadmin:
            if not data.empresa_id or not data.usuario_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Superadmin debe especificar 'empresa_id' y 'usuario_id'")
            target_empresa_id = data.empresa_id
            target_usuario_id = data.usuario_id
        else:
            target_empresa_id = UUID(current_user["empresa_id"])
            target_usuario_id = UUID(current_user["id"])
            
            # Prevent injection
            if data.empresa_id and str(data.empresa_id) != str(target_empresa_id):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede crear facturas para otra empresa")
            if data.usuario_id and str(data.usuario_id) != str(target_usuario_id):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede asignar la facura a otro usuario")

        # 2. Validate Related Entities
        # Cliente
        cliente = self.cliente_repository.get_cliente_by_id(data.cliente_id)
        if not cliente:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        if str(cliente['empresa_id']) != str(target_empresa_id):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cliente no pertenece a la empresa")

        # Establecimiento
        establecimiento = self.establecimiento_repository.get_by_id(data.establecimiento_id)
        if not establecimiento:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
        if str(establecimiento['empresa_id']) != str(target_empresa_id):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El establecimiento no pertenece a la empresa")

        # Punto Emision
        punto = self.punto_emision_repository.get_by_id(data.punto_emision_id)
        if not punto:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emisión no encontrado")
        if str(punto['establecimiento_id']) != str(data.establecimiento_id):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El punto de emisión no pertenece al establecimiento indicado")

        # 3. Generate Sequential Number & Access Key
        # We atomically increment the sequence in the DB to avoid duplicates.
        # The repo returns the OLD value (the one we should use).
        
        current_seq_val = self.punto_emision_repository.increment_secuencial(data.punto_emision_id)
        if current_seq_val is None:
             # Should not happen if Punto exists
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al generar secuencial")

        numero_factura = f"{establecimiento['codigo']}-{punto['codigo']}-{current_seq_val:09d}"
        
        internal_data = FacturaCreate(
            empresa_id=target_empresa_id,
            usuario_id=target_usuario_id,
            numero_factura=numero_factura,
            clave_acceso=None, # SRI logic usually handles this
            estado='PENDIENTE', # FORCE INITIAL STATE TO PENDING
            **data.dict(exclude={'empresa_id', 'usuario_id'})
        )

        try:
            result = self.repository.create(internal_data)
            if not result:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear la factura")
            return FacturaRead(**result)
        except Exception as e:
            # Handle potential duplicate numero_factura if concurrent
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def list(self, current_user: dict, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[FacturaRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        target_empresa_id = None
        if is_superadmin:
            if empresa_id:
                target_empresa_id = empresa_id
        else:
            target_empresa_id = UUID(current_user["empresa_id"])
            
        results = self.repository.list(target_empresa_id, limit, offset)
        return [FacturaRead(**row) for row in results]

    def get_by_id(self, id: UUID, current_user: dict) -> FacturaRead:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")

        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
             if str(result['empresa_id']) != str(current_user["empresa_id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permiso para ver esta factura")

        return FacturaRead(**result)

    def update(self, id: UUID, data: FacturaUpdate, current_user: dict) -> FacturaRead:
        factura = self.get_by_id(id, current_user) # Permission check
        
        # Emission Logic Trigger
        # If user is trying to set status to 'EMITIDA', we must validate payments
        if data.estado == 'EMITIDA' and factura.estado != 'EMITIDA':
             self.forma_pago_service.process_payments_for_emission(id, current_user)

        # Only allow updates if not in final state? User didn't specify.
        # Assuming open for now.
        
        result = self.repository.update(id, data)
        if not result:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar la factura")
        return FacturaRead(**result)

    def delete(self, id: UUID, current_user: dict):
        self.get_by_id(id, current_user) # Permission check
        # Check if can delete (e.g. if sent to SRI?)
        
        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar la factura")
        return {"message": "Factura eliminada correctamente"}

from uuid import UUID
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from models.FacturaProgramada import FacturaProgramadaCreateInput, FacturaProgramadaCreate, FacturaProgramadaUpdate, FacturaProgramadaRead, FacturaProgramadaBase
from repositories.facturacion_programada_repository import FacturacionProgramadaRepository
from repositories.cliente_repository import ClienteRepository
from utils.enums import AuthKeys

class FacturacionProgramadaService:
    def __init__(
        self, 
        repository: FacturacionProgramadaRepository = Depends(),
        cliente_repository: ClienteRepository = Depends()
    ):
        self.repository = repository
        self.cliente_repository = cliente_repository

    def create(self, data: FacturaProgramadaCreateInput, current_user: dict) -> FacturaProgramadaRead:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        # 1. Determine Empresa ID
        if is_superadmin:
            if not data.empresa_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Superadmin debe especificar 'empresa_id'"
                )
            target_empresa_id = data.empresa_id
        else:
            # Regular user must use their own empresa_id
            user_empresa_id = UUID(current_user["empresa_id"])
            if data.empresa_id and str(data.empresa_id) != str(user_empresa_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No puede crear registros para otra empresa"
                )
            target_empresa_id = user_empresa_id

        # 2. Determine Usuario ID
        if is_superadmin:
             # Superadmin can specify user_id, or default to themselves? 
             # Or must be a user FROM that company?
             # User Request: "Si soy superadmin debo poder poner... usuario id"
             if not data.usuario_id:
                  # If no user specified, maybe assign to Superadmin? 
                  # But table references public.usuario. Superadmin table is different?
                  # Actually Superadmin is separate table usually. 
                  # Let's check Schema: usuario_id REFERENCES public.usuario.
                  # If Superadmin is creating, they likely need to assign it to a valid User ID in that company or any user?
                  # Let's assume they must provide it.
                  raise HTTPException(
                      status_code=status.HTTP_400_BAD_REQUEST,
                      detail="Superadmin debe especificar 'usuario_id' válido (UUID de tabla usuario)"
                  )
             target_usuario_id = data.usuario_id
        else:
            # Regular user is assigned to themselves
            current_user_id = UUID(current_user["id"])
            if data.usuario_id and str(data.usuario_id) != str(current_user_id):
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No puede asignar el registro a otro usuario"
                )
            target_usuario_id = current_user_id

        # 3. Validate Cliente
        # Check if client exists and belongs to target_empresa_id
        cliente = self.cliente_repository.get_cliente_by_id(data.cliente_id)
        if not cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
        if str(cliente['empresa_id']) != str(target_empresa_id):
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST, 
                 detail="El cliente especificado no pertenece a la empresa indicada"
             )

        # Prepare Internal Data
        # We convert Input model to the Internal Base/Create model that Repository expects
        # Repository expects FacturaProgramadaCreate which has strict fields
        
        internal_data = FacturaProgramadaCreate(
            cliente_id=data.cliente_id,
            usuario_id=target_usuario_id,
            tipo_frecuencia=data.tipo_frecuencia,
            dia_emision=data.dia_emision,
            monto=data.monto,
            concepto=data.concepto,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            activo=data.activo,
            enviar_email=data.enviar_email,
            configuracion=data.configuracion
        )

        try:
            result = self.repository.create(internal_data, target_empresa_id)
            if not result:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear la facturación programada")
            return FacturaProgramadaRead(**result)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    def get_by_id(self, id: UUID, current_user: dict) -> FacturaProgramadaRead:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facturación programada no encontrada")
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            user_empresa_id = UUID(current_user["empresa_id"])
            if str(result['empresa_id']) != str(user_empresa_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para acceder a este recurso")
            
        return FacturaProgramadaRead(**result)

    def list(self, current_user: dict, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[FacturaProgramadaRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        target_empresa_id = None
        
        if is_superadmin:
             # Superadmin can see all (target_empresa_id = None) or filter by specific empresa_id
             if empresa_id:
                 target_empresa_id = empresa_id
        else:
             # Regular users are strictly limited to their own empresa context
             target_empresa_id = UUID(current_user["empresa_id"])

        results = self.repository.list(target_empresa_id, limit, offset)
        return [FacturaProgramadaRead(**row) for row in results]

    def update(self, id: UUID, data: FacturaProgramadaUpdate, current_user: dict) -> FacturaProgramadaRead:
        # First verify it exists and belongs to the company (or superadmin access)
        existing = self.get_by_id(id, current_user) # Logic for permission check is inside here
        
        # If user tries to update restricted fields like usuario_id or cliente_id?
        # Model allows updating them.
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        if not is_superadmin:
             # Regular users constraints on Update
             # Prevent changing owner to another user?
             if data.usuario_id and str(data.usuario_id) != str(current_user["id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede reasignar el propietario")
             
             # Prevent changing company logic (implicit as repo doesn't update empresa_id)
        
        # Validate Cliente if changing
        if data.cliente_id:
             cliente = self.cliente_repository.get_cliente_by_id(data.cliente_id)
             if not cliente:
                 raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
             if str(cliente['empresa_id']) != str(existing.empresa_id):
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cliente no pertenece a la empresa de este registro")

        result = self.repository.update(id, data)
        if not result:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar el registro")
             
        return FacturaProgramadaRead(**result)

    def delete(self, id: UUID, current_user: dict):
        self.get_by_id(id, current_user) # Permission check
        
        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar el registro")
        return {"message": "Registro eliminado con éxito"}

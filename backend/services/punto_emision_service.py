from uuid import UUID
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from models.PuntoEmision import PuntoEmisionCreateInput, PuntoEmisionCreate, PuntoEmisionUpdate, PuntoEmisionRead
from repositories.punto_emision_repository import PuntoEmisionRepository
from repositories.establecimiento_repository import EstablecimientoRepository
from utils.enums import AuthKeys

class PuntoEmisionService:
    def __init__(
        self, 
        repository: PuntoEmisionRepository = Depends(),
        establecimiento_repository: EstablecimientoRepository = Depends()
    ):
        self.repository = repository
        self.establecimiento_repository = establecimiento_repository

    def _validate_establecimiento_ownership(self, establecimiento_id: UUID, current_user: dict):
        """
        Validates that the given establecimiento_id exists and belongs to the user's empresa.
        Superadmins bypass ownership check but establishment must still exist.
        """
        establecimiento = self.establecimiento_repository.get_by_id(establecimiento_id)
        if not establecimiento:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            user_empresa_id = UUID(current_user["empresa_id"])
            if str(establecimiento['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(
                     status_code=status.HTTP_403_FORBIDDEN, 
                     detail="El establecimiento no pertenece a su empresa"
                 )
        return establecimiento

    def create(self, data: PuntoEmisionCreateInput, current_user: dict) -> PuntoEmisionRead:
        # Validate that the requested establecimiento belongs to the user (or exists for superadmin)
        self._validate_establecimiento_ownership(data.establecimiento_id, current_user)

        internal_data = PuntoEmisionCreate(
            codigo=data.codigo,
            nombre=data.nombre,
            secuencial_actual=data.secuencial_actual,
            activo=data.activo,
            establecimiento_id=data.establecimiento_id
        )

        try:
            result = self.repository.create(internal_data)
            if not result:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear el punto de emisión")
            return PuntoEmisionRead(**result)
        except Exception as e:
            error_msg = str(e)
            if "uq_punto_emision_establecimiento_codigo" in error_msg:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un punto de emisión con el código '{data.codigo}' en este establecimiento.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    def get_by_id(self, id: UUID, current_user: dict) -> PuntoEmisionRead:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Punto de emisión no encontrado")
        
        # Check permissions via Establishment ownership
        self._validate_establecimiento_ownership(result['establecimiento_id'], current_user)
            
        return PuntoEmisionRead(**result)

    def list(self, current_user: dict, establecimiento_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[PuntoEmisionRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        # Determine list scope
        # If user provides establishment_id, we create list for that establishment (verifying ownership)
        # If user DOES NOT provide establishment_id:
        #   - Superadmin: List ALL? Or require filter? API usually requires filter or returns valid paged list. 
        #   - Regular Use: We cannot easily "List all points for my company" without joining Tables or making multiple queries, 
        #     since 'punto_emision' only has 'establecimiento_id', not 'empresa_id'.
        #     However, user asked "Solo se puede asignar un establecimiento de la empresa".
        #     Usually listing needs an establishment context.
        # Let's assume for LIST, filtering by establishment_id is preferred/recommended, or we return strict list.
        # If establecimiento_id is provided, check ownership.
        
        target_establecimiento_id = None
        
        if establecimiento_id:
            # Validate ownership/existence of the requested filter
            self._validate_establecimiento_ownership(establecimiento_id, current_user)
            target_establecimiento_id = establecimiento_id
        else:
            if not is_superadmin:
                 # Regular user listing without filter? 
                 # This is tricky because Points don't have direct Empresa link. 
                 # We would need to search all establishments of the company, then all points.
                 # For MVP/Current scope, let's allow listing all IF we implement logic, OR restrict to filtering.
                 # Given standard practices: Allow listing, but we might expose info from other companies if we don't filter in DB.
                 # BUT punto_emision table DOES NOT have empresa_id.
                 # So we MUST join or filter by known establishments.
                 # Implementation decision: Require establecimiento_id for Regular Users to ensure safety?
                 # Or: Repo needs to support joining.
                 # Let's check Repository: simple Select * From punto_emision.
                 # If we run this for regular user, they see EVERYTHING. SECURITY RISK.
                 # FIX: Regular users MUST filter by Establishment, OR we must update Repo to filter by valid establishments.
                 
                 # Let's enforce that for NOW, Regular Users SHOULD provide establecimiento_id.
                 # Or better: We find all establishments for the user and filter points IN those IDs.
                 # That might be heavy. 
                 # Given user request "solose puede asginar unestablecimiento...", the listing requirement wasn't strictly defined but implied secure.
                 # I will enforce: Must provide establecimiento_id query param for Regular Users.
                 # Superadmins can pass None.
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe especificar 'establecimiento_id'")

        results = self.repository.list(target_establecimiento_id, limit, offset)
        return [PuntoEmisionRead(**row) for row in results]

    def update(self, id: UUID, data: PuntoEmisionUpdate, current_user: dict) -> PuntoEmisionRead:
        # Check existence and current ownership
        current_record = self.get_by_id(id, current_user)
        
        # If moving to another establishment (changing establecimiento_id), check ownership of NEW establishment
        if data.establecimiento_id and str(data.establecimiento_id) != str(current_record.establecimiento_id):
            self._validate_establecimiento_ownership(data.establecimiento_id, current_user)

        try:
            result = self.repository.update(id, data)
            if not result:
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar el registro")
            return PuntoEmisionRead(**result)
        except Exception as e:
            error_msg = str(e)
            if "uq_punto_emision_establecimiento_codigo" in error_msg:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un punto de emisión con el código '{data.codigo}' en este establecimiento.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    def delete(self, id: UUID, current_user: dict):
        self.get_by_id(id, current_user) # Permissions check
        
        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar el registro")
        return {"message": "Punto de emisión eliminado correctamente"}

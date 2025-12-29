from fastapi import Depends, HTTPException, status
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from repositories.configuracion_sri_repository import ConfiguracionSRIRepository
from repositories.empresa_repository import EmpresaRepository
from models.ConfiguracionSRI import ConfiguracionSRICreate, ConfiguracionSRIUpdate, ConfiguracionSRIRead
from utils.security_utils import SecurityUtils
from utils.enums import AuthKeys

class ConfiguracionSRIService:
    def __init__(
        self,
        repository: ConfiguracionSRIRepository = Depends(),
        empresa_repo: EmpresaRepository = Depends()
    ):
        self.repository = repository
        self.empresa_repo = empresa_repo

    def get_all(self) -> List[ConfiguracionSRIRead]:
        """
        Get all configs (Superadmin only, checked in route).
        """
        records = self.repository.get_all()
        # Clean sensitive data
        for r in records:
            r['clave_certificado'] = "********"
        return [ConfiguracionSRIRead(**r) for r in records]

    def get_config(self, current_user: dict, empresa_id: Optional[UUID] = None) -> Optional[ConfiguracionSRIRead]:
        """
        Get config for the user's company or a specific company if Superadmin.
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        target_empresa_id = user_empresa_id
        
        # If Superadmin and requesting a specific company
        if is_superadmin and empresa_id:
             target_empresa_id = empresa_id
             
        if not target_empresa_id:
             # If Superadmin queries without ID, maybe return empty or error?
             # For Get One, ID is required.
             if is_superadmin: return None 
             raise HTTPException(status_code=400, detail="Empresa ID required")
             
        target_empresa_id_str = str(target_empresa_id)
        
        raw_config = self.repository.get_by_empresa_id(target_empresa_id_str)
        if not raw_config:
            return None
            
        raw_config['clave_certificado'] = "********" 
        return ConfiguracionSRIRead(**raw_config)

    def create_config(self, current_user: dict, data: ConfiguracionSRICreate) -> ConfiguracionSRIRead:
        """
        Strict Creation (Superadmin Only).
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        if not is_superadmin:
            raise HTTPException(status_code=403, detail="Solo Superadmin puede crear configuración inicial")

        # Verify Uniqueness
        existing = self.repository.get_by_empresa_id(data.empresa_id)
        if existing:
            raise HTTPException(status_code=400, detail="Configuración ya existe para esta empresa")
            
        # Verify Empresa Exists 
        empresa = self.empresa_repo.get_empresa_by_id(data.empresa_id)
        if not empresa:
             raise HTTPException(status_code=404, detail="Empresa not found")

        # Encrypt
        encrypted_pass = SecurityUtils.encrypt_text(data.clave_certificado)
        data.clave_certificado = encrypted_pass
        
        # Create
        created_record = self.repository.create(data)
        if not created_record:
             raise HTTPException(status_code=500, detail="Error creating config")
             
        created_record['clave_certificado'] = "********"
        return ConfiguracionSRIRead(**created_record)

    def update_config(self, current_user: dict, data: ConfiguracionSRIUpdate, empresa_id_param: Optional[UUID] = None) -> ConfiguracionSRIRead:
        """
        Update Configuration.
        User can edit own company. Superadmin can edit any.
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        target_empresa_id = user_empresa_id
        if is_superadmin:
             target_empresa_id = empresa_id_param or user_empresa_id # Fallback if specific ID not passed
        
        if not target_empresa_id:
             raise HTTPException(status_code=400, detail="Empresa Target Undefined")

        target_uuid = UUID(str(target_empresa_id))
        
        # Check Existence
        existing = self.repository.get_by_empresa_id(target_uuid)
        if not existing:
             # User requested "if not exists create", but strict "Only Superadmin Create" rule conflicts.
             # However, typical SaaS flow allows Admin to "Configure" (Create) if missing.
             # User Request: "si no existe la creas ... un superadmin pueda crear ... un usuarios ... solo editarlo"
             # Interpret: User CANNOT trigger creation if missing.
             if not is_superadmin:
                 raise HTTPException(status_code=404, detail="Configuración no existe. Contacte a Soporte.")
             
             # If Superadmin, we could redirect to create? 
             # Or strict separation: Use POST for create.
             raise HTTPException(status_code=404, detail="Configuración no encontrada. Use POST para crear.")

        # Encrypt if new password
        if data.clave_certificado and data.clave_certificado != "********":
             data.clave_certificado = SecurityUtils.encrypt_text(data.clave_certificado)
        else:
             data.clave_certificado = None # Ignore

        updated_record = self.repository.update(target_uuid, data)
        updated_record['clave_certificado'] = "********"
        return ConfiguracionSRIRead(**updated_record)

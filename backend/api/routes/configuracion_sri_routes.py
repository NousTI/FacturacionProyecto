from fastapi import APIRouter, Depends, status, Query, HTTPException
from uuid import UUID
from typing import Optional, List

from services.configuracion_sri_service import ConfiguracionSRIService
from models.ConfiguracionSRI import ConfiguracionSRIRead, ConfiguracionSRIUpdate, ConfiguracionSRICreate
from dependencies.auth_dependencies import get_current_user, require_permission
from dependencies.superadmin_dependencies import get_current_superadmin
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter()

from fastapi import APIRouter, Depends, status, Query, HTTPException, UploadFile, File, Form
from uuid import UUID
from typing import Optional, List

from services.sri_service import SRIService
from dependencies.auth_dependencies import get_current_user, require_permission
from dependencies.superadmin_dependencies import get_current_superadmin
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter()

@router.post("/certificate", status_code=status.HTTP_201_CREATED)
async def upload_certificate(
    file: UploadFile = File(...),
    password: str = Form(...),
    ambiente: str = Form("1"), # 1: Pruebas, 2: Produccion
    tipo_emision: str = Form("1"), # 1: Normal
    empresa_id: Optional[UUID] = Form(None), # If superadmin setting for others
    current_user: dict = Depends(get_current_user),
    service: SRIService = Depends()
):
    """
    Subir y configurar certificado digital (.p12).
    - Cifra el archivo con MASTER KEY.
    - Guarda en DB.
    """
    # 1. Determine Empresa ID
    target_empresa_id = None
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
    
    if is_superadmin:
        if not empresa_id:
             raise HTTPException(status_code=400, detail="Superadmin debe especificar 'empresa_id'")
        target_empresa_id = empresa_id
    else:
        # Check permission
        # Usually CONFIG_SRI_EDITAR
        # Or just be Admin
        target_empresa_id = current_user.get("empresa_id")
        if not target_empresa_id:
             raise HTTPException(status_code=403, detail="Usuario no asociado a empresa")
             
    # 2. Read File
    if not file.filename.endswith(".p12"):
         raise HTTPException(status_code=400, detail="Solo archivos .p12 permitidos")
         
    content = await file.read()
    
    # 3. Call Service
    return service.save_certificate(
        empresa_id=target_empresa_id,
        p12_binary=content,
        password=password,
        ambiente=ambiente,
        tipo_emision=tipo_emision
    )

    return service.save_certificate(
        empresa_id=target_empresa_id,
        p12_binary=content,
        password=password,
        ambiente=ambiente,
        tipo_emision=tipo_emision
    )

from models.ConfiguracionSRI import ConfiguracionSRIRead, ConfiguracionSRIUpdate

@router.get("/all", response_model=List[ConfiguracionSRIRead]) 
def get_all_configs(
    current_admin=Depends(get_current_superadmin),
    service: SRIService = Depends()
):
    """
    [Superadmin] Listar todas las configuraciones.
    """
    return service.get_all()

@router.get("/{empresa_id}", response_model=Optional[ConfiguracionSRIRead])
def get_config_by_id(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: SRIService = Depends()
):
    """
    Obtener configuración por ID de Empresa.
    """
    return service.get_config(current_user, empresa_id)

@router.get("/", response_model=Optional[ConfiguracionSRIRead])
def get_config_me(
    current_user: dict = Depends(get_current_user), 
    service: SRIService = Depends()
):
    """
    Obtener mi configuración.
    """
    return service.get_config(current_user)

@router.put("/{empresa_id}", response_model=ConfiguracionSRIRead)
def update_config_by_id(
    empresa_id: UUID,
    data: ConfiguracionSRIUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CONFIG_SRI_EDITAR)),
    service: SRIService = Depends()
):
    """
    Actualizar configuración (Ambiente/Emisión) por ID.
    """
    return service.update_config(current_user, data.model_dump(exclude_unset=True), empresa_id)

@router.put("/", response_model=ConfiguracionSRIRead)
def update_config_me(
    data: ConfiguracionSRIUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CONFIG_SRI_EDITAR)),
    service: SRIService = Depends()
):
    """
    Actualizar mi configuración (Ambiente/Emisión).
    """
    return service.update_config(current_user, data.model_dump(exclude_unset=True))


@router.get("/{empresa_id}/signer-test")
def test_signer_load(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_superadmin),
    service: SRIService = Depends()
):
    """
    [Superadmin] Prueba de carga y descifrado en memoria.
    """
    signer = service.get_signer(empresa_id)
    valid_until = signer._cert.not_valid_after_utc
    signer.cleanup()
    return {"status": "OK", "message": "Certificado cargado y descifrado correctamente", "expires": valid_until}



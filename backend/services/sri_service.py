from fastapi import Depends, HTTPException
from uuid import UUID
import base64
from datetime import datetime

from repositories.factura_repository import FacturaRepository
from repositories.cliente_repository import ClienteRepository
from repositories.empresa_repository import EmpresaRepository
from repositories.log_emision_repository import LogEmisionRepository
from repositories.configuracion_sri_repository import ConfiguracionSRIRepository
from repositories.autorizacion_sri_repository import AutorizacionSRIRepository
from services.sri_xml_service import SRIXMLService
from services.firma_service import FirmaService
from services.sri_client import SRIClient
from models.LogEmision import LogEmisionCreate
from models.AutorizacionSRI import AutorizacionSRICreate
from models.Factura import FacturaUpdate
from utils.enums import AuthKeys, PermissionCodes

class SRIService:
    def __init__(
        self,
        factura_repo: FacturaRepository = Depends(),
        cliente_repo: ClienteRepository = Depends(),
        empresa_repo: EmpresaRepository = Depends(),
        log_repo: LogEmisionRepository = Depends(),
        config_repo: ConfiguracionSRIRepository = Depends(),
        autorizacion_repo: AutorizacionSRIRepository = Depends(),
        xml_service: SRIXMLService = Depends(),
        firma_service: FirmaService = Depends(),
        sri_client: SRIClient = Depends()
    ):
        self.factura_repo = factura_repo
        self.cliente_repo = cliente_repo
        self.empresa_repo = empresa_repo
        self.log_repo = log_repo
        self.config_repo = config_repo
        self.autorizacion_repo = autorizacion_repo
        self.xml_service = xml_service
        self.firma_service = firma_service
        self.sri_client = sri_client

    def enviar_factura_sri(self, factura_id: UUID, current_user: dict):
        """
        Orchestrates the Full Sending Process:
        1. Validate Ownership & Permissions
        2. Check Configuration (Keys)
        3. Generate XML
        4. Sign XML
        5. Send to SRI
        6. Log Results (LogEmision & AutorizacionSRI)
        """
        
        # 1. Fetch & Validate Factura
        factura = self.factura_repo.get_by_id(factura_id)
        if not factura:
             raise HTTPException(status_code=404, detail="Factura not found")

        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        # 1.1 Verify State
        if factura.get('estado') == 'AUTORIZADO':
             raise HTTPException(status_code=400, detail="Esta factura ya ha sido autorizada previamente.")
        
        # Security / Permission Check
        if not is_superadmin:
            # Check ownership
            if str(factura['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail="Access denied")
            
            # Check specific permission
            permissions = current_user.get('permissions', [])
            if PermissionCodes.FACTURA_ENVIAR_SRI not in permissions:
                 raise HTTPException(status_code=403, detail="No tiene permiso para enviar facturas al SRI")

        # 2. Check Configuration
        config = self.config_repo.get_by_empresa_id(factura['empresa_id'])
        if not config or not config.get('firma_activa'):
             self._log_error(factura_id, "Configuración SRI no encontrada o firma inactiva")
             raise HTTPException(status_code=400, detail="La empresa no tiene firma electrónica configurada")

        # 3. Data Loading
        empresa = self.empresa_repo.get_empresa_by_id(factura['empresa_id'])
        cliente = self.cliente_repo.get_cliente_by_id(factura['cliente_id'])
        detalles = self.factura_repo.get_detalles(factura_id) 
        
        try:
            # 4. Generate XML
            xml_unsigned = self.xml_service.generar_xml_factura(factura, cliente, empresa, detalles)
            
            # 5. Sign XML
            xml_signed = self.firma_service.firmar_xml(xml_unsigned, config)
            # Encode for sending (SRI expects base64 usually, depends on client impl)
            xml_b64 = base64.b64encode(xml_signed.encode()).decode()
            
            # 6. Send to SRI (Recepcion)
            resp_recepcion = self.sri_client.validar_comprobante(xml_b64, config['ambiente'])
            
            # Prepare Autorizacion Record Data
            auth_data = AutorizacionSRICreate(
                factura_id=factura_id,
                estado='EN_PROCESO',
                xml_enviado=xml_signed,
                mensajes="",
                xml_respuesta=str(resp_recepcion) # Raw dump for now
            )
            
            if resp_recepcion.get('estado') == 'RECIBIDA':
                 self._log_info(factura_id, "RECIBIDA", "Factura recibida por el SRI")
                 
                 # 7. Authorize (Autorizacion)
                 clave_acceso = factura.get('clave_acceso', '0000') # Access Key should be in XML
                 resp_auth = self.sri_client.autorizar_comprobante(clave_acceso, config['ambiente'])
                 
                 final_status = resp_auth.get('estado')
                 self._log_info(factura_id, final_status, f"Respuesta final: {resp_auth}")
                 
                 # Update Auth Data
                 auth_data.estado = final_status
                 auth_data.numero_autorizacion = resp_auth.get('numeroAutorizacion')
                 if resp_auth.get('fechaAutorizacion'):
                     # Parse logic depending on format, assuming ISO from simulation
                     # auth_data.fecha_autorizacion = ... 
                     auth_data.fecha_autorizacion = datetime.now() # Fallback/Current
                 
                 auth_data.mensajes = str(resp_auth.get('mensajes', ''))
                 auth_data.xml_respuesta = str(resp_auth)

                 # 8. Update Invoice
                 if final_status == 'AUTORIZADO':
                      self.factura_repo.update(factura_id, FacturaUpdate(estado='AUTORIZADO'))

                 # Save Authorization Record
                 self.autorizacion_repo.create(auth_data)
                      
                 return {
                     "message": "Proceso completado", 
                     "sri_response": resp_auth,
                     "xml_signed_preview": xml_signed[:100] + "..." # Snippet
                 }
            else:
                 msg = resp_recepcion.get('mensaje', 'Desconocido')
                 self._log_error(factura_id, f"Rechazo en Recepcion: {msg}")
                 
                 auth_data.estado = 'DEVUELTA'
                 auth_data.mensajes = msg
                 self.autorizacion_repo.create(auth_data)
                 
                 raise HTTPException(status_code=400, detail=f"SRI Rechazó: {msg}")

        except Exception as e:
            self._log_error(factura_id, str(e))
            raise HTTPException(status_code=500, detail=f"Error en proceso SRI: {str(e)}")

    def _log_info(self, factura_id, estado, mensaje):
        self.log_repo.create({"factura_id": factura_id, "estado": estado, "mensaje_error": mensaje, "intento_numero": 1})

    def _log_error(self, factura_id, mensaje):
        self.log_repo.create({"factura_id": factura_id, "estado": "FALLIDO", "mensaje_error": mensaje, "intento_numero": 1})

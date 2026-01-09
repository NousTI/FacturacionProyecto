# backend/services/sri_service.py
import base64
from fastapi import Depends, HTTPException
from uuid import UUID
from datetime import datetime
from typing import Optional

from repositories.configuracion_sri_repository import ConfiguracionSRIRepository
from utils.crypto import CryptoService
from utils.xml_signer import XMLSigner
from settings import get_settings, Settings
from models.ConfiguracionSRI import ConfiguracionSRICreate
from utils.enums import AuthKeys
from services.factura_service import FacturaService
from services.sri_xml_service import SRIXMLService
from services.sri_client import SRIClient
from models.Factura import FacturaUpdate
from repositories.empresa_repository import EmpresaRepository
from repositories.log_emision_repository import LogEmisionRepository
from repositories.autorizacion_sri_repository import AutorizacionSRIRepository
from models.AutorizacionSRI import AutorizacionSRICreate

class SRIService:
    """
    Centraliza la lógica de negocio SRI y seguridad de certificados.
    Cumple con: 'Módulo: sri.service.ts'
    """
    def __init__(
        self, 
        repo: ConfiguracionSRIRepository = Depends(),
        settings: Settings = Depends(get_settings),
        factura_service: FacturaService = Depends(),
        sri_client: SRIClient = Depends(),
        xml_service: SRIXMLService = Depends(),
        empresa_repo: EmpresaRepository = Depends(),
        log_repo: LogEmisionRepository = Depends(),
        autorizacion_repo: AutorizacionSRIRepository = Depends()
    ):
        self.repo = repo
        self.factura_service = factura_service
        self.sri_client = sri_client
        self.xml_service = xml_service
        self.empresa_repo = empresa_repo
        self.log_repo = log_repo
        self.autorizacion_repo = autorizacion_repo
        # Instanciar CryptoService con Master Key
        self.crypto = CryptoService(settings.cert_master_key)

    def save_certificate(
        self,
        empresa_id: UUID,
        p12_binary: bytes,
        password: str,
        ambiente: str,
        tipo_emision: str
    ):
        """
        Guarda el certificado de forma segura:
        1. Valida (Carga en memoria para verificar password y estructura).
        2. Cifra .p12 y Password.
        3. Guarda en DB.
        """
        # 1. Validación en memoria (fail fast)
        try:
            signer = XMLSigner(p12_binary, password)
            signer.check_validity()
            fecha_expiracion = signer._cert.not_valid_after_utc
            signer.cleanup() # Liberar
        except Exception as e:
             raise HTTPException(status_code=400, detail=f"Certificado inválido: {str(e)}")

        # 2. Cifrado
        encrypted_p12 = self.crypto.encrypt(p12_binary)
        encrypted_pass = self.crypto.encrypt(password)

        # 3. Persistencia
        data = {
            "empresa_id": empresa_id,
            "ambiente": ambiente,
            "tipo_emision": tipo_emision,
            "certificado_digital": encrypted_p12, # BYTEA
            "clave_certificado": base64.b64encode(encrypted_pass).decode(), # Store encrypted bytes inside TEXT field as b64
            "fecha_expiracion_cert": fecha_expiracion,
            "firma_activa": True
        }
        
        # Check if exists
        existing = self.repo.get_by_empresa(empresa_id)
        
        if existing:
             # Update
             self.repo.update_cert(existing['id'], data)
        else:
             self.repo.create(data)

        return {"message": "Certificado guardado y cifrado correctamente"}

    def get_signer(self, empresa_id: UUID) -> XMLSigner:
        """
        Recupera y descifra el certificado para uso en memoria.
        """
        config = self.repo.get_by_empresa(empresa_id)
        if not config or not config.get('firma_activa'):
             raise HTTPException(status_code=400, detail="Firma electrónica no configurada o inactiva")
        
        # Descifrado
        try:
            encrypted_p12 = config['certificado_digital'] # Checks if bytes (psycopg2 returns bytes for bytea)
            if isinstance(encrypted_p12, memoryview):
                encrypted_p12 = bytes(encrypted_p12)

            encrypted_pass_b64 = config['clave_certificado']
            encrypted_pass = base64.b64decode(encrypted_pass_b64)
            
            p12_binary = self.crypto.decrypt(encrypted_p12)
            password = self.crypto.decrypt_to_str(encrypted_pass)
            
            return XMLSigner(p12_binary, password)
        except Exception as e:
            # Log failure?
            print(f"Decryption failure for empresa {empresa_id}: {e}")
            raise HTTPException(status_code=500, detail="Error de seguridad al acceder a la firma")

    def get_all(self) -> list:
        return self.repo.list_all()

    def get_config(self, current_user: dict, empresa_id: Optional[UUID] = None):
        target_empresa_id = empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        
        if not is_superadmin:
            target_empresa_id = current_user.get("empresa_id")
            if empresa_id and str(empresa_id) != str(target_empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para ver esta configuración")
        
        result = self.repo.get_by_empresa(target_empresa_id)
        
        if not result and empresa_id is not None:
             # Explicit request by ID not found -> 404
             raise HTTPException(status_code=404, detail="Configuración SRI no encontrada para esta empresa")
             
        return result

    def update_config(self, current_user: dict, data: dict, empresa_id: Optional[UUID] = None):
        """
        Updates settings. If certificate provided (Base64), updates it too.
        """
        target_empresa_id = empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        
        if not is_superadmin:
            target_empresa_id = current_user.get("empresa_id")
            if empresa_id and str(empresa_id) != str(target_empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para editar esta configuración")
        
        existing = self.repo.get_by_empresa(target_empresa_id)
        if not existing:
             raise HTTPException(status_code=404, detail="Configuración no encontrada")
             
        # Handle Certificate Update (Base64 in JSON)
        if 'certificado_digital' in data and data['certificado_digital']:
            if not data.get('clave_certificado'):
                 raise HTTPException(status_code=400, detail="Debe proporcionar la clave si actualiza el certificado")
            
            try:
                p12_bytes = base64.b64decode(data['certificado_digital'])
                password = data['clave_certificado']
                
                # Verify
                signer = XMLSigner(p12_bytes, password)
                signer.check_validity()
                fecha_expiracion = signer._cert.not_valid_after_utc
                signer.cleanup()
                
                # Encrypt
                encrypted_p12 = self.crypto.encrypt(p12_bytes)
                encrypted_pass = self.crypto.encrypt(password)
                
                # Update Data
                data['certificado_digital'] = encrypted_p12
                data['clave_certificado'] = base64.b64encode(encrypted_pass).decode()
                data['fecha_expiracion_cert'] = fecha_expiracion
                
                # Update Cert in Repo
                self.repo.update_cert(existing['id'], data)
            except Exception as e:
                 raise HTTPException(status_code=400, detail=f"Error al procesar nuevo certificado: {str(e)}")
             
        updated = self.repo.update_settings(existing['id'], data)
        return updated

    def enviar_factura(self, factura_id: UUID, current_user: dict):
        """
        Orchestrates fetching data, generating XML, signing, and sending to SRI (Test Env).
        """
        # 1. Fetch Factura
        factura_read = self.factura_service.get_by_id(factura_id, current_user)
        factura_data = factura_read.dict()
        empresa_id = factura_read.empresa_id

        # 2. Fetch Empresa & Client (Moved up for val)
        empresa = self.empresa_repo.get_empresa_by_id(empresa_id)
        if not empresa:
             self._registrar_log(factura_id, 'FALLO', "Empresa no encontrada")
             raise HTTPException(status_code=404, detail="Empresa no encontrada")
             
        cliente = self.factura_service.cliente_repository.get_cliente_by_id(factura_read.cliente_id)
        if not cliente:
             self._registrar_log(factura_id, 'FALLO', "Cliente no encontrado")
             raise HTTPException(status_code=404, detail="Cliente no encontrado")
             
        detalles = self.factura_service.repository.get_detalles(factura_id)
        if not detalles:
             self._registrar_log(factura_id, 'FALLO', "Factura sin detalles")
             raise HTTPException(status_code=400, detail="La factura no tiene detalles")

        # 3. Get Config & Signer & Validate RUC
        try:
            config_sri = self.repo.get_by_empresa(empresa_id)
            if not config_sri:
                 raise HTTPException(status_code=400, detail="Configuración SRI no encontrada")
            
            signer = self.get_signer(empresa_id)
            
            # --- RUC VALIDATION ---
            signer.verify_ruc(empresa['ruc'])
            # ----------------------
            
            # ambiente = config_sri.get('ambiente', '1') 
            ambiente = '1' # FORZADO A PRUEBAS (Hardcoded per user request)
        except Exception as e:
            self._registrar_log(factura_id, 'FALLO', f"Error Config/Firma: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error cargando firma o validando RUC: {str(e)}")

        # 4. Generate XML
        try:
            # Pass actual configured environment
            xml_str = self.xml_service.generar_xml_factura(factura_data, cliente, empresa, detalles, ambiente=ambiente)
            xml_bytes = xml_str.encode('utf-8')
        except Exception as e:
            self._registrar_log(factura_id, 'FALLO', f"Error Generación XML: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generando XML: {str(e)}")

        # 5. Sign XML
        try:
            signed_xml = signer.sign_xml(xml_bytes)
            # signed_xml IS bytes
            
            signed_xml_b64 = base64.b64encode(signed_xml).decode('utf-8')
        except Exception as e:
            self._registrar_log(factura_id, 'FALLO', f"Error Firma XML: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error firmando XML: {str(e)}")
        finally:
            signer.cleanup()

        # 6. Send to SRI (Recepcion)
        try:
            resp_recepcion = self.sri_client.validar_comprobante(signed_xml_b64, ambiente)
        except Exception as e:
             self._registrar_log(factura_id, 'FALLO', f"Error Conexión SRI Recepción: {str(e)}")
             raise e
        
        if resp_recepcion['estado'] == 'RECIBIDA':
            # 7. Authorize
            import xml.etree.ElementTree as ET
            root = ET.fromstring(signed_xml)
            clave_acceso = None
            for elem in root.iter():
                 if 'claveAcceso' in elem.tag:
                      clave_acceso = elem.text
                      break
            
            if not clave_acceso:
                 self._registrar_log(factura_id, 'FALLO', "No se pudo extraer Clave Acceso")
                 raise HTTPException(status_code=500, detail="No se pudo extraer Clave de Acceso del XML firmado")

            try:
                resp_autorizacion = self.sri_client.autorizar_comprobante(clave_acceso, ambiente)
            except Exception as e:
                self._registrar_log(factura_id, 'FALLO', f"Error Conexión SRI Autorización: {str(e)}")
                raise e
            
            # --- SAVE AUTHORIZATION RECORD (Generic Helper) ---
            self._guardar_respuesta_sri(
                factura_id, 
                resp_autorizacion['estado'], 
                resp_autorizacion.get('numeroAutorizacion'),
                resp_autorizacion.get('fechaAutorizacion'),
                resp_autorizacion.get('mensajes', []),
                signed_xml,
                resp_autorizacion
            )
            # ---------------------------------
            
            if resp_autorizacion['estado'] == 'AUTORIZADO':
                 # SUCCESS!
                 self.factura_service.repository.update(factura_id, FacturaUpdate(
                     estado='AUTORIZADO', 
                     clave_acceso=clave_acceso
                 ))
                 self._registrar_log(factura_id, 'EXITO', f"Autorizado: {clave_acceso}")
                 
                 return {
                     "status": "success", 
                     "mensaje": "Factura Autorizada", 
                     "clave_acceso": clave_acceso,
                     "autorizacion": resp_autorizacion
                 }
            else:
                 # Received but Rejected
                 errores = resp_autorizacion.get('mensajes', [])
                 err_str = "; ".join(errores) if isinstance(errores, list) else str(errores)
                 self._registrar_log(factura_id, 'FALLO', f"Rechazado: {err_str}")
                 
                 return {
                     "status": "error", 
                     "estado_sri": "NO_AUTORIZADO",
                     "errores": errores,
                     "clave_acceso": clave_acceso
                 }
                 
        else:
            # Not Received (Error in structure/sig) -> DEVUELTA
            err_msg = resp_recepcion.get('mensaje', 'Unknown Error')
            resp_msgs = resp_recepcion.get('mensajes', [])
            if err_msg and not resp_msgs: resp_msgs = [err_msg]
            
            # Save DEVUELTA record
            self._guardar_respuesta_sri(
                factura_id,
                resp_recepcion['estado'], # DEVUELTA
                None,
                None,
                resp_msgs,
                signed_xml,
                resp_recepcion
            )

            self._registrar_log(factura_id, 'FALLO', f"Devuelta: {err_msg}")
            
            return {
                "status": "error",
                "estado_sri": resp_recepcion['estado'],
                "mensaje": err_msg
            }
            
    def _registrar_log(self, factura_id: UUID, estado: str, mensaje: str):
        try:
            self.log_repo.create({
                "factura_id": factura_id,
                "estado": estado,
                "mensaje_error": mensaje[:500] if mensaje else None, # Truncate primarily
                "intento_numero": 1 # ToDo: Calculate intent number
            })
        except Exception as e:
            print(f"Error escribiendo log emisión: {e}")

    def _guardar_respuesta_sri(self, factura_id, estado, numero_auth, fecha_auth_raw, mensajes, signed_xml_bytes, raw_response):
        try:
            errores_str = "; ".join(mensajes) if isinstance(mensajes, list) else str(mensajes)
            
            # Date Parsing
            fecha_auth = datetime.now()
            if fecha_auth_raw:
                 try:
                     fecha_auth = datetime.fromisoformat(fecha_auth_raw)
                 except: pass

            self.autorizacion_repo.create(AutorizacionSRICreate(
                factura_id=factura_id,
                numero_autorizacion=numero_auth,
                fecha_autorizacion=fecha_auth,
                estado=estado,
                mensajes=errores_str[:1000] if errores_str else None,
                xml_enviado=signed_xml_bytes.decode('utf-8', errors='ignore'),
                xml_respuesta=str(raw_response)
            ))
        except Exception as e:
            # Critical: Log this failure to DB so we know why Auth record wasn't saved
            self._registrar_log(factura_id, 'FALLO', f"Error interno guardando autorizacion: {str(e)}")
            print(f"Error saving authorization record: {e}")

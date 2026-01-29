import base64
from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from .repository import RepositorioSRI
from .client import ClienteSRI
from .xml_service import ServicioSRIXML
from .signer import XMLSigner
from .schemas import ConfigSRICreacion, ConfigSRIActualizacion
from ...utils.crypto import CryptoService
from ...config.env import env
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

# Other modules repos
from ..facturas.repository import RepositorioFacturas
from ..empresas.repositories import RepositorioEmpresas
from ..clientes.repositories import RepositorioClientes
from ..logs.repository import RepositorioLogs

class ServicioSRI:
    def __init__(
        self,
        repo: RepositorioSRI = Depends(),
        factura_repo: RepositorioFacturas = Depends(),
        empresa_repo: RepositorioEmpresas = Depends(),
        cliente_repo: RepositorioClientes = Depends(),
        log_repo: RepositorioLogs = Depends(),
        client_sri: ClienteSRI = Depends(),
        xml_service: ServicioSRIXML = Depends()
    ):
        self.repo = repo
        self.factura_repo = factura_repo
        self.empresa_repo = empresa_repo
        self.cliente_repo = cliente_repo
        self.log_repo = log_repo
        self.client_sri = client_sri
        self.xml_service = xml_service
        self.crypto = CryptoService(env.CERT_MASTER_KEY)

    def guardar_certificado(self, empresa_id: UUID, p12_bin: bytes, password: str, ambiente: str, emision: str):
        try:
            signer = XMLSigner(p12_bin, password)
            signer.check_validity()
            expira = signer._cert.not_valid_after_utc
            signer.cleanup()
        except Exception as e:
            raise AppError(f"Certificado inválido: {str(e)}", 400, "CERT_INVALID")

        data = {
            "empresa_id": empresa_id,
            "ambiente": ambiente,
            "tipo_emision": emision,
            "certificado_digital": self.crypto.encrypt(p12_bin),
            "clave_certificado": base64.b64encode(self.crypto.encrypt(password)).decode(),
            "fecha_expiracion_cert": expira,
            "firma_activa": True
        }
        
        existing = self.repo.obtener_config(empresa_id)
        if existing:
            return self.repo.actualizar_config(existing['id'], data)
        return self.repo.crear_config(data)

    def obtener_signer(self, empresa_id: UUID) -> XMLSigner:
        config = self.repo.obtener_config(empresa_id)
        if not config or not config['firma_activa']:
            raise AppError("Firma electrónica no activa", 400, "SRI_CONFIG_INCOMPLETE")
        
        try:
            p12 = self.crypto.decrypt(bytes(config['certificado_digital']))
            passw = self.crypto.decrypt_to_str(base64.b64decode(config['clave_certificado']))
            return XMLSigner(p12, passw)
        except Exception as e:
            raise AppError("Error de seguridad al acceder a la firma", 500, "CRYPTO_ERROR")

    def enviar_factura(self, factura_id: UUID, usuario_actual: dict):
        factura = self.factura_repo.obtener_por_id(factura_id)
        if not factura: raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        
        empresa = self.empresa_repo.obtener_por_id(factura['empresa_id'])
        cliente = self.cliente_repo.obtener_por_id(factura['cliente_id'])
        detalles = self.factura_repo.obtener_detalles(factura_id)
        config_sri = self.repo.obtener_config(factura['empresa_id'])
        
        if not config_sri: raise AppError("Configuración SRI no encontrada", 400, "SRI_CONFIG_MISSING")
        
        ambiente = '1' # Pruebas (Hardcoded por requerimiento usuario)
        
        try:
            signer = self.obtener_signer(factura['empresa_id'])
            signer.verify_ruc(empresa['ruc'])
            
            xml_str = self.xml_service.generar_xml_factura(factura, cliente, empresa, detalles, ambiente)
            xml_firmado = signer.sign_xml(xml_str.encode('utf-8'))
            xml_b64 = base64.b64encode(xml_firmado).decode('utf-8')
            
            # Enviar Recepción
            res_rec = self.client_sri.validar_comprobante(xml_b64, ambiente)
            
            if res_rec['estado'] == 'RECIBIDA':
                # Extraer clave de acceso del XML (implementación simplificada)
                clave = xml_str.split('<claveAcceso>')[1].split('</claveAcceso>')[0] # Muy frágil, mejor usar regex o lxml
                
                res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
                
                # Guardar Autorización
                self.repo.crear_autorizacion({
                    "factura_id": factura_id,
                    "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                    "fecha_autorizacion": datetime.fromisoformat(res_aut['fechaAutorizacion']) if res_aut.get('fechaAutorizacion') else None,
                    "estado": res_aut['estado'],
                    "mensajes": "; ".join(res_aut['mensajes']) if res_aut.get('mensajes') else None,
                    "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                    "xml_respuesta": str(res_aut)
                })
                
                if res_aut['estado'] == 'AUTORIZADO':
                    self.factura_repo.actualizar_factura(factura_id, {"estado": "AUTORIZADO", "clave_acceso": clave})
                
                return res_aut
            else:
                return res_rec
                
        except Exception as e:
            self.log_repo.crear_log({
                "factura_id": factura_id,
                "estado": "FALLO",
                "mensaje_error": str(e)[:500]
            })
            raise e

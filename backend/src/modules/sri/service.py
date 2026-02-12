import base64
import re
import logging
from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from .repository import RepositorioSRI
from .client import ClienteSRI
from .xml_service import ServicioSRIXML
from .signer import XMLSigner
from .cert_utils import ExtractorCertificadoSRI
from .schemas import ConfigSRICreacion, ConfigSRIActualizacion, ConfigSRIActualizacionParametros
from ...utils.crypto import CryptoService
from ...config.env import env
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

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
            # Extraer metadatos automáticamente
            extractor = ExtractorCertificadoSRI(p12_bin, password)
            meta = extractor.extraer_metadatos()
            
            # Verificar validez técnica con el signer actual
            signer = XMLSigner(p12_bin, password)
            signer.check_validity()
            signer.cleanup()
        except Exception as e:
            raise AppError(f"Certificado inválido o clave incorrecta: {str(e)}", 400, "CERT_INVALID")

        data = {
            "empresa_id": empresa_id,
            "ambiente": ambiente,
            "tipo_emision": emision,
            "certificado_digital": self.crypto.encrypt(p12_bin),
            "clave_certificado": self.crypto.encrypt(password), # El repo lo manejará como BYTEA
            "fecha_activacion_cert": meta["fecha_activacion"],
            "fecha_expiracion_cert": meta["fecha_expiracion"],
            "cert_serial": meta["serial"],
            "cert_sujeto": meta["sujeto"],
            "cert_emisor": meta["emisor"],
            "estado": "ACTIVO"
        }
        
        # 🟢 ACTUALIZACIÓN AUTOMÁTICA DEL RUC DE LA EMPRESA
        # Si el certificado contiene un RUC válido, actualizamos la tabla empresas
        ruc_extraido = meta.get("ruc")
        if ruc_extraido and len(ruc_extraido) == 13:
            logger.info(f"[SRI] Sincronizando RUC {ruc_extraido} desde certificado para empresa {empresa_id}")
            self.empresa_repo.actualizar_empresa(empresa_id, {"ruc": ruc_extraido})
        else:
            logger.warning(f"[SRI] No se pudo extraer un RUC válido del certificado para la empresa {empresa_id}")

        existing = self.repo.obtener_config(empresa_id)
        if existing:
            return self.repo.actualizar_config(existing['id'], data)
        return self.repo.crear_config(data)

    def actualizar_parametros(self, empresa_id: UUID, params: ConfigSRIActualizacionParametros):
        existing = self.repo.obtener_config(empresa_id)
        if not existing:
            raise AppError("No existe configuración SRI. Cargue el certificado primero.", 404, "SRI_CONFIG_NOT_FOUND")
            
        data = {
            "ambiente": params.ambiente,
            "tipo_emision": params.tipo_emision
        }
        return self.repo.actualizar_config(existing['id'], data)

    def obtener_signer(self, empresa_id: UUID) -> XMLSigner:
        config = self.repo.obtener_config(empresa_id, incluir_binarios=True)
        if not config or config['estado'] != 'ACTIVO':
            raise AppError("Firma electrónica no activa o inválida", 400, "SRI_CONFIG_INCOMPLETE")
        
        try:
            p12 = self.crypto.decrypt(bytes(config['certificado_digital']))
            passw = self.crypto.decrypt_to_str(bytes(config['clave_certificado']))
            return XMLSigner(p12, passw)
        except Exception as e:
            raise AppError("Error de seguridad al acceder a la firma", 500, "CRYPTO_ERROR")

    def enviar_factura(self, factura_id: UUID, usuario_actual: dict):
        factura = self.factura_repo.obtener_por_id(factura_id)
        if not factura: raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        
        empresa = self.empresa_repo.obtener_por_id(factura['empresa_id'])
        cliente = self.cliente_repo.obtener_por_id(factura['cliente_id'])
        detalles = self.factura_repo.listar_detalles(factura_id)
        config_sri = self.repo.obtener_config(factura['empresa_id'])
        
        if not config_sri: raise AppError("Configuración SRI no encontrada", 400, "SRI_CONFIG_MISSING")
        
        # Mapeo de ambiente y emisión para el SRI
        ambiente_map = {"PRUEBAS": "1", "PRODUCCION": "2"}
        emision_map = {"NORMAL": "1", "CONTINGENCIA": "2"}
        
        ambiente = ambiente_map.get(config_sri['ambiente'], "1")
        tipo_emision = emision_map.get(config_sri['tipo_emision'], "1")
        
        signer = None
        # Identificar el intento actual (conteo básico para logs)
        historial = self.factura_repo.listar_logs_emision(factura_id)
        intento_num = len(historial) + 1
        
        try:
            signer = self.obtener_signer(factura['empresa_id'])
            signer.verify_ruc(empresa['ruc'])
            
            xml_str = self.xml_service.generar_xml_factura(factura, cliente, empresa, detalles, ambiente, tipo_emision)
            xml_firmado = signer.sign_xml(xml_str.encode('utf-8'))
            xml_b64 = base64.b64encode(xml_firmado).decode('utf-8')
            
            # 1. ENVIAR RECEPCIÓN
            res_rec = self.client_sri.validar_comprobante(xml_b64, ambiente)
            
            # CASO ESPECIAL SRI: Error 70 - Clave de acceso en procesamiento
            # Significa que ya fue recibida anteriormente y está en cola. No debemos detenernos.
            msg_rec = str(res_rec.get('mensaje', ''))
            ya_en_procesamiento = "EN PROCESAMIENTO" in msg_rec.upper() or "70" in msg_rec
            
            if res_rec['estado'] != 'RECIBIDA' and not ya_en_procesamiento:
                # Registrar fallo real en recepción
                self.factura_repo.crear_log_emision({
                    "factura_id": factura_id,
                    "facturacion_programada_id": factura.get('facturacion_programada_id'),
                    "usuario_id": usuario_actual.get('id'),
                    "estado": "ERROR_VALIDACION",
                    "tipo_intento": "INICIAL" if intento_num == 1 else "REINTENTO",
                    "intento_numero": intento_num,
                    "mensaje_error": f"SRI Recepción: {res_rec.get('mensaje')}",
                    "xml_enviado": xml_str,
                    "xml_respuesta": str(res_rec)
                })
                return res_rec
            
            if ya_en_procesamiento:
                print(f"--- [SRI] La clave {factura.get('clave_acceso')} ya está en procesamiento (Error 70). Saltando a consulta de autorización. ---")

            # 2. PROCESAR AUTORIZACIÓN (Solo si fue RECIBIDA)
            clave_match = re.search(r'<claveAcceso>(.*?)</claveAcceso>', xml_str)
            clave = clave_match.group(1) if clave_match else ""
            
            if not clave:
                raise AppError("No se pudo extraer la clave de acceso del XML", 500, "SRI_KEY_ERROR")
            
            import time
            # Espera única estratégica para que el SRI procese
            time.sleep(3)
            
            res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
            estado_aut = res_aut['estado']
            
            # 3. REGISTRAR RESULTADO FINAL EN LOGS
            log_estado = "EXITOSO" if estado_aut == "AUTORIZADO" else "ERROR_VALIDACION"
            self.factura_repo.crear_log_emision({
                "factura_id": factura_id,
                "facturacion_programada_id": factura.get('facturacion_programada_id'),
                "usuario_id": usuario_actual.get('id'),
                "estado": log_estado,
                "tipo_intento": "INICIAL" if intento_num == 1 else "REINTENTO",
                "intento_numero": intento_num,
                "mensaje_error": "; ".join(res_aut.get('mensajes', [])) if estado_aut != "AUTORIZADO" else None,
                "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                "xml_respuesta": str(res_aut)
            })

            # 4. GUARDAR EN TABLA DE AUTORIZACIONES (Verdad técnica final)
            # Normalizamos el estado para la base de datos
            estado_db = estado_aut.upper() if estado_aut else "DESCONOCIDO"
            if estado_db == "DEVUELTA": estado_db = "DEVUELTO"
            
            self.repo.crear_autorizacion({
                "factura_id": factura_id,
                "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                "fecha_autorizacion": datetime.fromisoformat(res_aut['fechaAutorizacion']) if res_aut.get('fechaAutorizacion') else None,
                "estado": estado_db,
                "mensajes": res_aut.get('mensajes'),
                "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                "xml_respuesta": str(res_aut)
            })
            
            # 5. ACTUALIZAR ESTADO DE LA FACTURA SEGÚN RESPUESTA
            if estado_aut == 'AUTORIZADO':
                self.factura_repo.actualizar_factura(factura_id, {
                    "estado": "EMITIDA", 
                    "clave_acceso": clave,
                    "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                    "fecha_autorizacion": res_aut.get('fechaAutorizacion')
                })
            elif estado_aut in ['DEVUELTA', 'DEVUELTO', 'NO AUTORIZADO']:
                # Solo marcamos como RECHAZADA si el SRI explícitamente la rechazó
                self.factura_repo.actualizar_factura(factura_id, {
                    "estado": "RECHAZADA", 
                    "clave_acceso": clave
                })
            else:
                # Si sigue en PROCESAMIENTO o similar
                self.factura_repo.actualizar_factura(factura_id, {
                    "estado": "EN_PROCESO", 
                    "clave_acceso": clave
                })
            
            return res_aut
                
        except Exception as e:
            self.factura_repo.crear_log_emision({
                "factura_id": factura_id,
                "usuario_id": usuario_actual.get('id'),
                "estado": "ERROR_OTRO",
                "intento_numero": intento_num,
                "mensaje_error": f"EXCEPCIÓN: {str(e)[:500]}"
            })
            raise e
        finally:
            if signer:
                signer.cleanup()

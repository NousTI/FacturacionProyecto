import base64
import re
import logging
import time
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
from .constants import (
    SRIAmbiente, SRITipoEmision, SRIEstadoRespuesta, SRIErrorCodes, 
    LogEstado, FacturaEstado, SRI_TIME_SLEEP_AUTORIZACION
)
from ...utils.crypto import CryptoService
from ...config.env import env
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ..logs.service import ServicioLogs

logger = logging.getLogger("facturacion_api")

# Other modules repos
from ..facturas.repository import RepositorioFacturas
from ..empresas.repositories import RepositorioEmpresas
from ..clientes.repositories import RepositorioClientes
from ..logs.repository import RepositorioLogs
from ..formas_pago.repository import RepositorioFormasPago

class ServicioSRI:
    def __init__(
        self,
        repo: RepositorioSRI = Depends(),
        factura_repo: RepositorioFacturas = Depends(),
        empresa_repo: RepositorioEmpresas = Depends(),
        cliente_repo: RepositorioClientes = Depends(),
        log_repo: RepositorioLogs = Depends(),
        formas_pago_repo: RepositorioFormasPago = Depends(),
        client_sri: ClienteSRI = Depends(),
        xml_service: ServicioSRIXML = Depends(),
        logs_service: ServicioLogs = Depends()
    ):
        self.repo = repo
        self.factura_repo = factura_repo
        self.empresa_repo = empresa_repo
        self.cliente_repo = cliente_repo
        self.log_repo = log_repo
        self.formas_pago_repo = formas_pago_repo
        self.client_sri = client_sri
        self.logs_service = logs_service
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
            self.logs_service.registrar_evento(
                user_id=None, # System/Contextual
                evento='SRI_CERTIFICADO_FALLIDO',
                detail=f"Fallo al cargar certificado para empresa {empresa_id}: {str(e)}",
                origen='SISTEMA'
            )
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
            res = self.repo.actualizar_config(existing['id'], data)
        else:
            res = self.repo.crear_config(data)
            
        self.logs_service.registrar_evento(
            user_id=None, 
            evento='SRI_CERTIFICADO_ACTUALIZADO',
            detail=f"Certificado SRI actualizado exitosamente para empresa {empresa_id}. Vence: {meta['fecha_expiracion']}",
            origen='SISTEMA'
        )
        return res

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

    def enviar_factura(self, factura_id: UUID, usuario_actual: dict, force_reemission: bool = False):
        factura = self.factura_repo.obtener_por_id(factura_id)
        if not factura: raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        
        # --- PROTECCIÓN CONTRA DOBLE CHECK (Concurrency) ---
        if not force_reemission and factura['estado'] in [FacturaEstado.EN_PROCESO, FacturaEstado.AUTORIZADA]:
            raise AppError("La factura ya está siendo procesada o fue emitida.", 409, "FACTURA_LOCKED")
            
        # Bloquear inmediatamente
        self.factura_repo.actualizar_factura(factura_id, {"estado": FacturaEstado.EN_PROCESO})
        
        empresa = self.empresa_repo.obtener_por_id(factura['empresa_id'])
        cliente = self.cliente_repo.obtener_por_id(factura['cliente_id'])
        detalles = self.factura_repo.listar_detalles(factura_id)
        formas_pago = self.formas_pago_repo.listar_por_factura(factura_id)
        config_sri = self.repo.obtener_config(factura['empresa_id'])
        
        if not config_sri: raise AppError("Configuración SRI no encontrada", 400, "SRI_CONFIG_MISSING")
        
        # Mapeo de ambiente y emisión para el SRI usando Constantes
        # 1. Obtener de la DB
        ambiente_db = SRIAmbiente.MAP.get(str(config_sri['ambiente']).upper(), SRIAmbiente.PRUEBAS)
        tipo_emision = SRITipoEmision.MAP.get(str(config_sri['tipo_emision']).upper(), SRITipoEmision.NORMAL)
        
        # 2. OVERRIDE FORZADO PARA DESARROLLO (Siempre Pruebas "1")
        # El backend ignora la entrada del frontend y la DB para proteger la fase de pruebas.
        ambiente = SRIAmbiente.PRUEBAS 
        logger.info(f"[SRI-DEV] Forzando ambiente {ambiente} (DB decía: {ambiente_db}) para factura {factura_id}")
        
        signer = None
        # Identificar el intento actual (conteo básico para logs)
        historial = self.factura_repo.listar_logs_emision(factura_id)
        intento_num = len(historial) + 1
        
        # Metadata para logs
        start_time = time.time()
        client_info = {
            "ip": usuario_actual.get("ip", "desconocida"),
            "user_agent": usuario_actual.get("user_agent", "desconocido"),
            "version_app": usuario_actual.get("version_app", "1.0.0")
        }

        try:
            signer = self.obtener_signer(factura['empresa_id'])
            signer.verify_ruc(empresa['ruc'])
            
            xml_str = self.xml_service.generar_xml_factura(factura, cliente, empresa, detalles, formas_pago, ambiente, tipo_emision)
            
            # 2. EXTRAER CLAVE DE ACCESO
            clave_match = re.search(r'<claveAcceso>(.*?)</claveAcceso>', xml_str)
            clave = clave_match.group(1) if clave_match else ""
            
            if not clave:
                raise AppError("No se pudo extraer la clave de acceso del XML", 500, "SRI_KEY_ERROR")

            xml_firmado = signer.sign_xml(xml_str.encode('utf-8'))
            xml_b64 = base64.b64encode(xml_firmado).decode('utf-8')
            
            # Variable para controlar si el SRI ya lo tiene
            ya_en_procesamiento = False
            
            # Verificar estado local antes de enviar
            # Si ya tenemos la misma clave registrada y está en proceso o emitida, no reenviamos a recepción
            # A menos que sea una RE-EMISIÓN FORZADA (Rescue)
            if not force_reemission and factura.get('clave_acceso') == clave and factura.get('estado') in [FacturaEstado.EN_PROCESO, FacturaEstado.AUTORIZADA]:
                print(f"--- [SRI] Factura ya registrada localmente con clave {clave}. Saltando envío (Recepción). ---")
                ya_en_procesamiento = True
            else:
                # 1. ENVIAR RECEPCIÓN (Solo si no parece estar procesándose ya)
                res_rec = self.client_sri.validar_comprobante(xml_b64, ambiente)
                
                # CASO ESPECIAL SRI: Error 70 - Clave de acceso en procesamiento o Error 45 - Secuencial ya registrado
                msg_rec = str(res_rec.get('mensaje', ''))
                cods_rec = res_rec.get('codigos', [])
                
                # Reportado como en procesamiento (70) o ya registrado (45)
                ya_en_procesamiento = (
                    SRIErrorCodes.TXT_EN_PROCESAMIENTO in msg_rec.upper() or 
                    SRIErrorCodes.CLAVE_EN_PROCESAMIENTO in msg_rec or
                    '45' in cods_rec or
                    'SECUENCIAL REGISTRADO' in msg_rec.upper()
                )
                
                # CASO TIMEOUT/CONEXIÓN: Si dio timeout o se cortó la conexión, es posible que el SRI sí lo haya recibido.
                if res_rec['estado'] in [SRIEstadoRespuesta.ERROR_TIMEOUT, SRIEstadoRespuesta.ERROR_CONEXION]:
                    print(f"--- [SRI] Problema de conectividad en Recepción ({res_rec['estado']}). Asumiendo posible recepción exitosa y consultando autorización. ---")
                    ya_en_procesamiento = True
                
                elif res_rec['estado'] != SRIEstadoRespuesta.RECIBIDA and not ya_en_procesamiento:
                    # Registrar fallo real en recepción -> DEVUELTA
                    duration = int((time.time() - start_time) * 1000)
                    mensajes_error = []
                    for i, msg in enumerate(res_rec.get('mensajes', [])):
                        cod = res_rec.get('codigos', [])[i] if i < len(res_rec.get('codigos', [])) else None
                        mensajes_error.append({"codigo": cod, "mensaje": msg, "tipo": "ERROR"})
                    
                    if not mensajes_error and res_rec.get('mensaje'):
                         mensajes_error.append({"codigo": None, "mensaje": res_rec.get('mensaje'), "tipo": "ERROR"})

                    self.factura_repo.crear_log_emision({
                        "factura_id": factura_id,
                        "facturacion_programada_id": factura.get('facturacion_programada_id'),
                        "usuario_id": usuario_actual.get('id'),
                        "ambiente": int(SRIAmbiente.PRUEBAS),
                        "clave_acceso": clave,
                        "estado": LogEstado.ERROR_VALIDACION,
                        "sri_estado_raw": res_rec['estado'],
                        "fase_falla": "RECEPCION",
                        "tipo_intento": "INICIAL" if intento_num == 1 else "REINTENTO",
                        "intento_numero": intento_num,
                        "mensajes": mensajes_error,
                        "duracion_ms": duration,
                        "client_info": client_info,
                        "xml_enviado": xml_str,
                        "xml_respuesta": res_rec.get('xml_respuesta_raw', str(res_rec))
                    })
                    
                    # Marcar factura como DEVUELTA (Fase 1)
                    self.factura_repo.actualizar_factura(factura_id, {
                        "estado": FacturaEstado.DEVUELTA,
                        "clave_acceso": clave
                    })
                    
                    return res_rec
                
            # 3. PROCESAR AUTORIZACIÓN
            time.sleep(SRI_TIME_SLEEP_AUTORIZACION)
            
            res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
            estado_aut = res_aut['estado']
            
            # --- MANEJO INTELIGENTE LOGS ---
            codigos_error = res_aut.get('codigos', [])
            mensajes_aut = res_aut.get('mensajes', [])
            
            if estado_aut == SRIEstadoRespuesta.AUTORIZADO:
                log_estado = LogEstado.EXITOSO
            elif estado_aut in [SRIEstadoRespuesta.ERROR_TIMEOUT, SRIEstadoRespuesta.ERROR_CONEXION]:
                log_estado = LogEstado.ERROR_CONECTIVIDAD
            elif estado_aut == SRIEstadoRespuesta.EN_PROCESO or ya_en_procesamiento:
                log_estado = LogEstado.EN_PROCESO
            else:
                log_estado = LogEstado.ERROR_VALIDACION

            duration = int((time.time() - start_time) * 1000)
            
            mensajes_list = []
            for i, msg in enumerate(mensajes_aut):
                cod = codigos_error[i] if i < len(codigos_error) else None
                mensajes_list.append({"codigo": cod, "mensaje": msg, "tipo": "ERROR"})
            
            if not mensajes_list:
                if estado_aut == SRIEstadoRespuesta.ERROR_TIMEOUT:
                    mensajes_list.append({"codigo": "TIMEOUT", "mensaje": "El SRI no respondió a tiempo la consulta de autorización.", "tipo": "INFO"})
                elif ya_en_procesamiento:
                    mensajes_list.append({"codigo": "70", "mensaje": "Comprobante en procesamiento en el SRI. Use el botón 'Consultar SRI' en unos minutos.", "tipo": "INFO"})
                elif estado_aut == "NO_ENCONTRADO" or (res_aut.get('numeroComprobantes') == 0):
                    mensajes_list.append({
                        "codigo": "SRI_404", 
                        "mensaje": "El SRI ha recibido el comprobante pero aún no lo ha indexado para consulta. Por favor, espere unos minutos antes de intentar consultar nuevamente.", 
                        "tipo": "INFO"
                    })
                elif estado_aut == "DESCONOCIDO":
                    mensajes_list.append({"codigo": "SISTEMA", "mensaje": "El SRI devolvió un estado desconocido o una respuesta vacía.", "tipo": "ERROR"})

            self.factura_repo.crear_log_emision({
                "factura_id": factura_id,
                "facturacion_programada_id": factura.get('facturacion_programada_id'),
                "usuario_id": usuario_actual.get('id'),
                "ambiente": int(SRIAmbiente.PRUEBAS),
                "clave_acceso": clave,
                "estado": log_estado,
                "sri_estado_raw": "EN_PROCESO" if (log_estado == LogEstado.EN_PROCESO or ya_en_procesamiento) else estado_aut,
                "fase_falla": "AUTORIZACION" if log_estado not in [LogEstado.EXITOSO, LogEstado.EN_PROCESO] else None,
                "tipo_intento": "INICIAL" if intento_num == 1 else "REINTENTO",
                "intento_numero": intento_num,
                "mensajes": mensajes_list,
                "duracion_ms": duration,
                "client_info": client_info,
                "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                "xml_respuesta": res_aut.get('xml_respuesta_raw', str(res_aut))
            })

            # 4. GUARDAR EN TABLA DE AUTORIZACIONES (Solo RESPUESTAS VÁLIDAS)
            es_error_tecnico = estado_aut in [SRIEstadoRespuesta.ERROR_TIMEOUT, SRIEstadoRespuesta.ERROR_CONEXION, "DESCONOCIDO", "NO_ENCONTRADO", SRIEstadoRespuesta.ERROR_PARSING]

            if estado_aut in [SRIEstadoRespuesta.AUTORIZADO, SRIEstadoRespuesta.DEVUELTA, SRIEstadoRespuesta.DEVUELTO, SRIEstadoRespuesta.NO_AUTORIZADO, SRIEstadoRespuesta.EN_PROCESO]:
                estado_db = estado_aut.upper() if estado_aut != "DEVUELTA" else "DEVUELTO"
                
                self.repo.crear_autorizacion({
                    "factura_id": factura_id,
                    "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                    "fecha_autorizacion": datetime.fromisoformat(res_aut['fechaAutorizacion']) if res_aut.get('fechaAutorizacion') else None,
                    "estado": estado_db,
                    "mensajes": mensajes_aut,
                    "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                    "xml_respuesta": res_aut.get('xml_respuesta_raw', str(res_aut))
                })
            
            # 5. ACTUALIZAR ESTADO DE LA FACTURA
            update_fields = {"clave_acceso": clave}
            
            if estado_aut == SRIEstadoRespuesta.AUTORIZADO:
                fecha_aut_obj = None
                if res_aut.get('fechaAutorizacion'):
                    try:
                        fecha_aut_obj = datetime.fromisoformat(res_aut['fechaAutorizacion'].replace('Z', '+00:00'))
                    except:
                        fecha_aut_obj = res_aut.get('fechaAutorizacion')

                update_fields.update({
                    "estado": FacturaEstado.AUTORIZADA,
                    "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                    "fecha_autorizacion": fecha_aut_obj,
                    "fecha_emision": fecha_aut_obj  # Sincronización solicitada
                })
            elif estado_aut in [SRIEstadoRespuesta.DEVUELTA, SRIEstadoRespuesta.DEVUELTO]:
                update_fields["estado"] = FacturaEstado.DEVUELTA
            elif estado_aut == SRIEstadoRespuesta.NO_AUTORIZADO:
                update_fields["estado"] = FacturaEstado.NO_AUTORIZADA
            else:
                if ya_en_procesamiento or estado_aut == SRIEstadoRespuesta.EN_PROCESO:
                    update_fields["estado"] = FacturaEstado.EN_PROCESO
                elif estado_aut == "NO_ENCONTRADO":
                    # El SRI aún no indexa el documento. Lo mantenemos en EN_PROCESO 
                    # para que el usuario sepa que debe esperar y consultar más tarde.
                    update_fields["estado"] = FacturaEstado.EN_PROCESO
                else:
                    update_fields["estado"] = FacturaEstado.ERROR_TECNICO
            
            self.factura_repo.actualizar_factura(factura_id, update_fields)
            return res_aut
            
            return res_aut
                
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self.factura_repo.crear_log_emision({
                "factura_id": factura_id,
                "usuario_id": usuario_actual.get('id'),
                "ambiente": int(SRIAmbiente.PRUEBAS),
                "clave_acceso": clave if 'clave' in locals() else None,
                "estado": LogEstado.ERROR_SISTEMA,
                "fase_falla": "SISTEMA",
                "intento_numero": intento_num,
                "mensajes": [{"codigo": "EXCEPCION_SISTEMA", "mensaje": str(e), "tipo": "ERROR"}],
                "duracion_ms": duration,
                "client_info": client_info
            })
            # Revertir estado a ERROR_TECNICO para permitir reintento
            self.factura_repo.actualizar_factura(factura_id, {"estado": FacturaEstado.ERROR_TECNICO})
            raise e
        finally:
            if signer:
                signer.cleanup()

    def consultar_estado_sri(self, factura_id: UUID, usuario_actual: dict):
        """
        Consulta el estado de una factura en el SRI usando solo su clave de acceso registrada.
        Ideal para facturas en estado EN_PROCESO.
        """
        factura = self.factura_repo.obtener_por_id(factura_id)
        if not factura: raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        
        clave = factura.get('clave_acceso')
        if not clave:
            raise AppError("La factura no tiene una clave de acceso registrada para consulta", 400, "VAL_ERROR")

        config_sri = self.repo.obtener_config(factura['empresa_id'])
        if not config_sri: raise AppError("Configuración SRI no encontrada", 400, "SRI_CONFIG_MISSING")
        # ambiente = SRIAmbiente.MAP.get(config_sri['ambiente'], SRIAmbiente.PRUEBAS)
        # FORZADO PARA DESARROLLO
        ambiente = SRIAmbiente.PRUEBAS
        logger.info(f"[SRI-DEV] Forzando ambiente {ambiente} para consulta de factura {factura_id}")
        
        start_time = time.time()
        client_info = {
            "ip": usuario_actual.get("ip", "desconocida"),
            "user_agent": usuario_actual.get("user_agent", "desconocido"),
            "version_app": usuario_actual.get("version_app", "1.0.0")
        }

        try:
            res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
            estado_aut = res_aut['estado']
            
            # --- MANEJO DE LOGS ---
            codigos_error = res_aut.get('codigos', [])
            mensajes_aut = res_aut.get('mensajes', [])
            
            if estado_aut == SRIEstadoRespuesta.AUTORIZADO:
                log_estado = LogEstado.EXITOSO
            elif estado_aut in [SRIEstadoRespuesta.ERROR_TIMEOUT, SRIEstadoRespuesta.ERROR_CONEXION]:
                log_estado = LogEstado.ERROR_CONECTIVIDAD
            elif estado_aut in ["NO_ENCONTRADO", SRIEstadoRespuesta.NO_ENCONTRADO, SRIEstadoRespuesta.EN_PROCESO]:
                log_estado = LogEstado.EN_PROCESO
            else:
                log_estado = LogEstado.ERROR_VALIDACION

            duration = int((time.time() - start_time) * 1000)
            
            mensajes_list = []
            for i, msg in enumerate(mensajes_aut):
                cod = codigos_error[i] if i < len(codigos_error) else None
                mensajes_list.append({"codigo": cod, "mensaje": msg, "tipo": "ERROR"})
            
            if not mensajes_list:
                if estado_aut in ["NO_ENCONTRADO", SRIEstadoRespuesta.NO_ENCONTRADO]:
                    mensajes_list.append({
                        "codigo": "SRI_404", 
                        "mensaje": "El SRI aún no refleja el estado del comprobante. Esto es normal si acaba de ser enviado; la indexación puede tardar unos minutos.", 
                        "tipo": "INFO"
                    })

            self.factura_repo.crear_log_emision({
                "factura_id": factura_id,
                "usuario_id": usuario_actual.get('id'),
                "ambiente": int(SRIAmbiente.PRUEBAS),
                "clave_acceso": clave,
                "estado": log_estado,
                "sri_estado_raw": estado_aut,
                "fase_falla": "AUTORIZACION_CONSULTA" if log_estado != LogEstado.EXITOSO else None,
                "tipo_intento": "CONSULTA",
                "intento_numero": 0, # Indica consulta manual
                "mensajes": mensajes_list,
                "duracion_ms": duration,
                "client_info": client_info,
                "xml_respuesta": res_aut.get('xml_respuesta_raw', str(res_aut))
            })

            # ACTUALIZAR ESTADO DE LA FACTURA
            if estado_aut == SRIEstadoRespuesta.AUTORIZADO:
                fecha_aut_obj = None
                if res_aut.get('fechaAutorizacion'):
                    try:
                        fecha_aut_obj = datetime.fromisoformat(res_aut['fechaAutorizacion'].replace('Z', '+00:00'))
                    except:
                        fecha_aut_obj = res_aut.get('fechaAutorizacion')

                self.factura_repo.actualizar_factura(factura_id, {
                    "estado": FacturaEstado.AUTORIZADA, 
                    "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                    "fecha_autorizacion": fecha_aut_obj,
                    "fecha_emision": fecha_aut_obj # Sincronización solicitada
                })
            elif estado_aut in [SRIEstadoRespuesta.DEVUELTA, SRIEstadoRespuesta.DEVUELTO]:
                self.factura_repo.actualizar_factura(factura_id, {"estado": FacturaEstado.DEVUELTA})
            elif estado_aut == SRIEstadoRespuesta.NO_AUTORIZADO:
                self.factura_repo.actualizar_factura(factura_id, {"estado": FacturaEstado.NO_AUTORIZADA})
            elif estado_aut in ["NO_ENCONTRADO", SRIEstadoRespuesta.NO_ENCONTRADO]:
                 # RESCATE ACTIVO: Si no se encuentra en consulta, intentamos una re-emisión forzada
                 # Esto soluciona casos donde la recepción fue un falso positivo o se perdió el paquete.
                 print(f"--- [SRI] No encontrado en consulta para {factura_id}. Iniciando re-emisión de rescate... ---")
                 return self.enviar_factura(factura_id, usuario_actual, force_reemission=True)
            
            return res_aut

        except Exception as e:
            raise AppError(f"Error al consultar SRI: {str(e)}", 500, "SRI_CONSULTA_ERROR")

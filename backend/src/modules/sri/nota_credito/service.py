import base64
import re
import logging
import time
from fastapi import Depends
from uuid import UUID
from datetime import datetime

from ..repository import RepositorioSRI
from ..client import ClienteSRI
from .xml_service import ServicioSRIXMLNotaCredito
from ..constants import (
    SRIAmbiente, SRITipoEmision, SRIEstadoRespuesta, SRIErrorCodes, 
    LogEstado, FacturaEstado
)
from ....utils.crypto import CryptoService
from ....config.env import env
from ....errors.app_error import AppError

# Repositorios necesarios
from ...notas_credito.repository import RepositorioNotasCredito
from ...facturas.repository import RepositorioFacturas
from ...empresas.repositories import RepositorioEmpresas
from ...clientes.repository import RepositorioClientes
from ...usuarios.repositories import RepositorioUsuarios
from ..signer import XMLSigner

logger = logging.getLogger("facturacion_api")

class ServicioSRINotaCredito:
    """
    MODULO: NOTAS DE CRÉDITO (SRI TIPO 04)
    Este servicio maneja exclusivamente el envío y autorización de Notas de Crédito ante el SRI.
    Separado en submódulo sri.nota_credito para organización.
    """
    
    def __init__(
        self,
        repo: RepositorioSRI = Depends(),
        nc_repo: RepositorioNotasCredito = Depends(),
        factura_repo: RepositorioFacturas = Depends(),
        empresa_repo: RepositorioEmpresas = Depends(),
        cliente_repo: RepositorioClientes = Depends(),
        usuario_perfil_repo: RepositorioUsuarios = Depends(),
        client_sri: ClienteSRI = Depends(),
        xml_service: ServicioSRIXMLNotaCredito = Depends()
    ):
        self.repo = repo
        self.nc_repo = nc_repo
        self.factura_repo = factura_repo
        self.empresa_repo = empresa_repo
        self.cliente_repo = cliente_repo
        self.usuario_perfil_repo = usuario_perfil_repo
        self.client_sri = client_sri
        self.xml_service = xml_service
        self.crypto = CryptoService(env.CERT_MASTER_KEY)

    def obtener_signer(self, empresa_id: UUID) -> XMLSigner:
        config = self.repo.obtener_config(empresa_id, incluir_binarios=True)
        if not config or config['estado'] != 'ACTIVO':
            raise AppError("Firma electrónica no activa o inválida", 400, "SRI_CONFIG_INCOMPLETE")
        
        try:
            p12 = self.crypto.decrypt(bytes(config['certificado_digital']))
            passw = self.crypto.decrypt_to_str(bytes(config['clave_certificado']))
            return XMLSigner(p12, passw)
        except Exception:
            raise AppError("Error de seguridad al acceder a la firma", 500, "CRYPTO_ERROR")

    def _resolver_usuario_id_perfil(self, usuario_actual: dict) -> UUID:
        """
        Resuelve el ID de la tabla 'usuarios' (perfil) a partir del ID de 'users' (auth).
        Esto es crítico para mantener la integridad en los logs.
        """
        user_auth_id = usuario_actual.get('id')
        if not user_auth_id:
            raise AppError("Sesión de usuario inválida", 401, "AUTH_ERROR")
            
        perfil = self.usuario_perfil_repo.obtener_por_user_id(user_auth_id)
        if not perfil:
            # Si no tiene perfil, intentamos ver si ya es un ID de la tabla usuarios (caso raro)
            perfil = self.usuario_perfil_repo.obtener_usuario(user_auth_id)
            if not perfil:
                raise AppError(f"No se encontró un perfil de usuario activo para el ID: {user_auth_id}", 403, "PROFILE_NOT_FOUND")
        
        return perfil['id']

    def emitir_nota_credito_sri(self, nc_id: UUID, usuario_actual: dict):
        nc = self.nc_repo.obtener_por_id(nc_id)
        if not nc: raise AppError("Nota de Crédito no encontrada", 404, "NC_NOT_FOUND")
        
        factura = self.factura_repo.obtener_por_id(nc['factura_id'])
        empresa = self.empresa_repo.obtener_por_id(factura['empresa_id'])
        cliente = self.cliente_repo.obtener_por_id(factura['cliente_id'])
        detalles_nc = self.nc_repo.listar_detalles(nc_id)
        
        ambiente = SRIAmbiente.PRUEBAS
        tipo_emision = SRITipoEmision.NORMAL
        
        start_time = time.time()
        client_info = {
            "ip": usuario_actual.get("ip", "desconocida"),
            "user_agent": usuario_actual.get("user_agent", "desconocido"),
            "version_app": usuario_actual.get("version_app", "1.0.0")
        }
        
        signer = None
        clave = None
        
        try:
            signer = self.obtener_signer(factura['empresa_id'])
            xml_str = self.xml_service.generar_xml_nota_credito(nc, cliente, empresa, detalles_nc, ambiente, tipo_emision)
            
            clave_match = re.search(r'<claveAcceso>(.*?)</claveAcceso>', xml_str)
            clave = clave_match.group(1) if clave_match else ""
            
            xml_firmado = signer.sign_xml(xml_str.encode('utf-8'))
            xml_b64 = base64.b64encode(xml_firmado).decode('utf-8')
            
            res_rec = self.client_sri.validar_comprobante(xml_b64, ambiente)
            
            if res_rec['estado'] != SRIEstadoRespuesta.RECIBIDA:
                self._registrar_log(nc_id, usuario_actual, clave, "RECEPCION", res_rec, start_time, client_info, xml_str)
                self.nc_repo.actualizar_nota_credito(nc_id, {"estado_sri": "RECHAZADO", "clave_acceso": clave})
                return res_rec

            time.sleep(3)
            res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
            self._procesar_resultado_autorizacion(nc_id, res_aut, clave, start_time, usuario_actual, client_info, xml_firmado)
            
            return res_aut

        except Exception as e:
            logger.error(f"[NC-SRI] Error crítico en emisión: {str(e)}")
            duration = int((time.time() - start_time) * 1000)
            
            # Resolver ID de perfil para el log
            try:
                perfil_id = self._resolver_usuario_id_perfil(usuario_actual)
            except:
                perfil_id = None # Fallback si falla la resolución en el error catch

            self.nc_repo.crear_log_emision({
                "nota_credito_id": nc_id,
                "usuario_id": perfil_id,
                "ambiente": int(SRIAmbiente.PRUEBAS),
                "clave_acceso": clave,
                "estado": LogEstado.ERROR_SISTEMA,
                "fase_falla": "SISTEMA",
                "mensajes": [{"codigo": "EXCEPCION", "mensaje": str(e), "tipo": "ERROR"}],
                "duracion_ms": duration,
                "client_info": client_info
            })
            raise e
        finally:
            if signer: signer.cleanup()

    def _registrar_log(self, nc_id, usuario, clave, fase, res_sri, start_time, client_info, xml_enviado):
        duration = int((time.time() - start_time) * 1000)
        mensajes = []
        for i, msg in enumerate(res_sri.get('mensajes', [])):
            cod = res_sri.get('codigos', [])[i] if i < len(res_sri.get('codigos', [])) else None
            mensajes.append({"codigo": cod, "mensaje": msg, "tipo": "ERROR"})
        
        perfil_id = self._resolver_usuario_id_perfil(usuario)

        self.nc_repo.crear_log_emision({
            "nota_credito_id": nc_id,
            "usuario_id": perfil_id,
            "ambiente": int(SRIAmbiente.PRUEBAS),
            "clave_acceso": clave,
            "estado": LogEstado.ERROR_VALIDACION,
            "sri_estado_raw": res_sri['estado'],
            "fase_falla": fase,
            "mensajes": mensajes,
            "duracion_ms": duration,
            "client_info": client_info,
            "xml_enviado": xml_enviado if isinstance(xml_enviado, str) else xml_enviado.decode('utf-8', errors='ignore'),
            "xml_respuesta": res_sri.get('xml_respuesta_raw', str(res_sri))
        })

    def _procesar_resultado_autorizacion(self, nc_id, res_aut, clave, start_time, usuario, client_info, xml_firmado):
        estado_aut = res_aut['estado']
        duration = int((time.time() - start_time) * 1000)
        
        log_estado = LogEstado.EXITOSO if estado_aut == SRIEstadoRespuesta.AUTORIZADO else LogEstado.ERROR_VALIDACION
        mensajes_list = []
        for i, msg in enumerate(res_aut.get('mensajes', [])):
            cod = res_aut.get('codigos', [])[i] if i < len(res_aut.get('codigos', [])) else None
            mensajes_list.append({"codigo": cod, "mensaje": msg, "tipo": "ERROR"})

        perfil_id = self._resolver_usuario_id_perfil(usuario)

        self.nc_repo.crear_log_emision({
            "nota_credito_id": nc_id,
            "usuario_id": perfil_id,
            "ambiente": int(SRIAmbiente.PRUEBAS),
            "clave_acceso": clave,
            "estado": log_estado,
            "sri_estado_raw": estado_aut,
            "fase_falla": "AUTORIZACION" if log_estado != LogEstado.EXITOSO else None,
            "mensajes": mensajes_list,
            "duracion_ms": duration,
            "client_info": client_info,
            "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
            "xml_respuesta": res_aut.get('xml_respuesta_raw', str(res_aut))
        })

        if estado_aut in [SRIEstadoRespuesta.AUTORIZADO, SRIEstadoRespuesta.DEVUELTA, SRIEstadoRespuesta.DEVUELTO, SRIEstadoRespuesta.NO_AUTORIZADO]:
            self.nc_repo.crear_autorizacion({
                "nota_credito_id": nc_id,
                "numero_autorizacion": res_aut.get('numeroAutorizacion'),
                "fecha_autorizacion": datetime.fromisoformat(res_aut['fechaAutorizacion']) if res_aut.get('fechaAutorizacion') else None,
                "estado": estado_aut.upper() if estado_aut != "DEVUELTA" else "DEVUELTO",
                "mensajes": res_aut.get('mensajes'),
                "xml_enviado": xml_firmado.decode('utf-8', errors='ignore'),
                "xml_respuesta": res_aut.get('xml_respuesta_raw', str(res_aut))
            })

        update_nc = {
            "clave_acceso": clave,
            "estado_sri": estado_aut.upper() if estado_aut != "DEVUELTA" else "DEVUELTO",
            "numero_autorizacion": res_aut.get('numeroAutorizacion')
        }
        self.nc_repo.actualizar_nota_credito(nc_id, update_nc)

    def consultar_estado_sri_nc(self, nc_id: UUID, usuario_actual: dict):
        """
        Consulta al SRI si una NC ya fue autorizada, útil en casos de timeout previo.
        """
        nc = self.nc_repo.obtener_por_id(nc_id)
        if not nc: raise AppError("Nota de Crédito no encontrada", 404, "NC_NOT_FOUND")
        
        clave = nc.get('clave_acceso')
        if not clave:
            raise AppError("La NC no tiene una clave de acceso registrada para consulta", 400, "VAL_ERROR")

        # Ambiente forzado a PRUEBAS para desarrollo
        ambiente = SRIAmbiente.PRUEBAS
        start_time = time.time()
        client_info = {
            "ip": usuario_actual.get("ip", "desconocida"),
            "user_agent": usuario_actual.get("user_agent", "desconocido"),
            "version_app": usuario_actual.get("version_app", "1.0.0")
        }

        try:
            res_aut = self.client_sri.autorizar_comprobante(clave, ambiente)
            self._procesar_resultado_autorizacion(nc_id, res_aut, clave, start_time, usuario_actual, client_info, b"Consulta SRI")
            return res_aut
        except Exception as e:
            logger.error(f"[NC-SRI-CONSULTA] Error: {str(e)}")
            raise e

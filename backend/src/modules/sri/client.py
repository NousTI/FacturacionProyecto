import requests
from requests.exceptions import RequestException
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import xml.etree.ElementTree as ET
from ...constants.sri_constants import SRIEstadoRespuesta, SRI_TIMEOUT_SECONDS, SRI_URLS, SRIAmbiente

class ClienteSRI:
    # Utiliza SRI_URLS importado de constantes globales

    def __init__(self):
        # Configurar estrategia de reintentos para fallos de conexión (como el 10054)
        retry_strategy = Retry(
            total=3,  # 3 intentos en total
            backoff_factor=1,  # Espera exponencial (1s, 2s, 4s)
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session = requests.Session()
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def validar_comprobante(self, xml_b64: str, ambiente: str = SRIAmbiente.PRUEBAS) -> dict:
        url = SRI_URLS.get(ambiente, SRI_URLS[SRIAmbiente.PRUEBAS])['recepcion']
        soap_body = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
           <soapenv:Header/>
           <soapenv:Body>
              <ec:validarComprobante><xml>{xml_b64}</xml></ec:validarComprobante>
           </soapenv:Body>
        </soapenv:Envelope>
        """
        try:
             headers = {'Content-Type': 'text/xml;charset=UTF-8'}
             response = self.session.post(url, data=soap_body, headers=headers, timeout=SRI_TIMEOUT_SECONDS)
             response.raise_for_status()
             result = self._parse_recepcion(response.text)
             result['xml_respuesta_raw'] = response.text
             return result
        except requests.exceptions.Timeout:
             return {"estado": SRIEstadoRespuesta.ERROR_TIMEOUT, "mensaje": "El SRI tardó demasiado en responder (Timeout). Posiblemente sí se recibió.", "codigos": ["TIMEOUT"]}
        except RequestException as e:
             err_msg = str(e)
             err_code = "CONNECTION_ERROR"
             if "10054" in err_msg: err_code = "ERR_10054"
             elif "timeout" in err_msg.lower(): err_code = "TIMEOUT"
             return {"estado": SRIEstadoRespuesta.ERROR_CONEXION, "mensaje": err_msg, "codigos": [err_code]}

    def autorizar_comprobante(self, clave_acceso: str, ambiente: str = SRIAmbiente.PRUEBAS) -> dict:
        url = SRI_URLS.get(ambiente, SRI_URLS[SRIAmbiente.PRUEBAS])['autorizacion']
        soap_body = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
           <soapenv:Header/>
           <soapenv:Body>
              <ec:autorizacionComprobante><claveAccesoComprobante>{clave_acceso}</claveAccesoComprobante></ec:autorizacionComprobante>
           </soapenv:Body>
        </soapenv:Envelope>
        """
        try:
             headers = {'Content-Type': 'text/xml;charset=UTF-8'}
             response = self.session.post(url, data=soap_body, headers=headers, timeout=SRI_TIMEOUT_SECONDS)
             response.raise_for_status()
             result = self._parse_autorizacion(response.text)
             result['xml_respuesta_raw'] = response.text
             return result
        except requests.exceptions.Timeout:
             return {"estado": SRIEstadoRespuesta.ERROR_TIMEOUT, "mensaje": "El SRI tardó en autorizar.", "codigos": ["TIMEOUT"]}
        except RequestException as e:
             err_msg = str(e)
             err_code = "CONNECTION_ERROR"
             if "10054" in err_msg: err_code = "ERR_10054"
             elif "timeout" in err_msg.lower(): err_code = "TIMEOUT"
             return {"estado": SRIEstadoRespuesta.ERROR_CONEXION, "mensaje": err_msg, "codigos": [err_code]}

    def _parse_msg_node(self, root) -> tuple:
        codigos = []
        mensajes = []
        
        # Buscar todos los nodos que contengan información de mensaje
        for node in root.iter():
            tag_local = node.tag.split('}')[-1] if '}' in node.tag else node.tag
            
            # Caso 1: Estructura compleja de mensaje (con hijos como identificador, mensaje, etc.)
            if tag_local == 'mensaje' and len(list(node)) > 0:
                identificador = None
                texto = None
                tipo = None
                info_adicional = None
                
                for child in node:
                    c_tag = child.tag.split('}')[-1].lower() if '}' in child.tag else child.tag.lower()
                    if 'identificador' in c_tag: identificador = child.text
                    elif 'mensaje' in c_tag: texto = child.text
                    elif 'tipo' in c_tag: tipo = child.text
                    elif 'informacionadicional' in c_tag: info_adicional = child.text
                
                if identificador: codigos.append(identificador)
                
                full_msg = ""
                if texto: full_msg += texto
                if info_adicional: full_msg += f" ({info_adicional})"
                if full_msg: mensajes.append(full_msg)
            
            # Caso 2: Mensaje simple de texto (e.g. SOAP Fault o mensaje directo)
            elif tag_local in ['mensaje', 'faultstring', 'message'] and len(list(node)) == 0 and node.text:
                if node.text not in mensajes:
                    mensajes.append(node.text)
                    
        return codigos, mensajes

    def _parse_recepcion(self, xml_text: str) -> dict:
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            
            # Buscar estado de forma segura (ignorando namespaces)
            for elem in root.iter():
                tag_local = elem.tag.split('}')[-1].lower() if '}' in elem.tag else elem.tag.lower()
                if tag_local == 'estado':
                    estado = elem.text; break
            
            codigos, mensajes = self._parse_msg_node(root)

            return {
                "estado": estado, 
                "mensajes": mensajes,  # Cambiado de 'mensaje' a 'mensajes' para consistencia
                "mensaje": "; ".join(mensajes) if mensajes else ("Sin detalles" if estado != "DESCONOCIDO" else "Error de comunicación o respuesta inesperada"),
                "codigos": codigos
            }
        except Exception as e:
            return {"estado": SRIEstadoRespuesta.ERROR_PARSING, "mensaje": f"Error parseando respuesta SRI: {str(e)}", "mensajes": [str(e)], "codigos": []}

    def _parse_autorizacion(self, xml_text: str) -> dict:
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            num_auth = None
            fecha_auth = None
            clave_acceso_consultada = None
            numero_comprobantes = "0"
            
            for elem in root.iter():
                tag_local = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
                if tag_local == 'estado':
                    estado = elem.text
                elif tag_local == 'numeroAutorizacion':
                    num_auth = elem.text
                elif tag_local == 'fechaAutorizacion':
                    fecha_auth = elem.text
                elif tag_local == 'claveAccesoConsultada':
                    clave_acceso_consultada = elem.text
                elif tag_local == 'numeroComprobantes':
                    numero_comprobantes = elem.text

            # Si no hay comprobantes y el estado quedó en DESCONOCIDO, es un "No encontrado"
            if numero_comprobantes == "0" and estado == "DESCONOCIDO":
                estado = "NO_ENCONTRADO"
                
            codigos, mensajes = self._parse_msg_node(root)
            
            return {
                "estado": estado,
                "numeroAutorizacion": num_auth,
                "fechaAutorizacion": fecha_auth,
                "claveAccesoConsultada": clave_acceso_consultada,
                "numeroComprobantes": int(numero_comprobantes),
                "mensajes": mensajes,
                "codigos": codigos
            }
        except Exception as e:
            return {"estado": SRIEstadoRespuesta.ERROR_PARSING, "mensajes": [f"Error de parseo: {str(e)}"], "codigos": []}

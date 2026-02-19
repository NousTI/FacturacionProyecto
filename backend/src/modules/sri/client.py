import requests
from requests.exceptions import RequestException
import xml.etree.ElementTree as ET
from .constants import SRIEstadoRespuesta, SRI_TIMEOUT_SECONDS

class ClienteSRI:
    URLS = {
        '1': { # Pruebas
            'recepcion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
        },
        '2': { # Producción
            'recepcion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
        }
    }

    def validar_comprobante(self, xml_b64: str, ambiente: str = '1') -> dict:
        url = self.URLS.get(ambiente, self.URLS['1'])['recepcion']
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
             response = requests.post(url, data=soap_body, headers=headers, timeout=SRI_TIMEOUT_SECONDS)
             response.raise_for_status()
             result = self._parse_recepcion(response.text)
             result['xml_respuesta_raw'] = response.text
             return result
        except requests.exceptions.Timeout:
             return {"estado": SRIEstadoRespuesta.ERROR_TIMEOUT, "mensaje": "El SRI tardó demasiado en responder (Timeout). Posiblemente sí se recibió."}
        except RequestException as e:
             return {"estado": SRIEstadoRespuesta.ERROR_CONEXION, "mensaje": str(e)}

    def autorizar_comprobante(self, clave_acceso: str, ambiente: str = '1') -> dict:
        url = self.URLS.get(ambiente, self.URLS['1'])['autorizacion']
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
             response = requests.post(url, data=soap_body, headers=headers, timeout=SRI_TIMEOUT_SECONDS)
             response.raise_for_status()
             result = self._parse_autorizacion(response.text)
             result['xml_respuesta_raw'] = response.text
             return result
        except requests.exceptions.Timeout:
             return {"estado": SRIEstadoRespuesta.ERROR_TIMEOUT, "mensaje": "El SRI tardó en autorizar."}
        except RequestException as e:
             return {"estado": SRIEstadoRespuesta.ERROR_CONEXION, "mensaje": str(e)}

    def _parse_msg_node(self, root) -> tuple:
        codigos = []
        mensajes = []
        # Buscar nodos <mensaje> que tengan hijos (estructura compleja)
        for msg in root.iter():
            if 'mensaje' in msg.tag and len(list(msg)) > 0:
                # Estructura típica: <identificador>43</identificador><mensaje>...</mensaje><tipo>ERROR</tipo>
                identificador = None
                texto = None
                tipo = None
                info_adicional = None
                
                for child in msg:
                    tag = child.tag.lower()
                    if 'identificador' in tag: identificador = child.text
                    elif 'mensaje' in tag: texto = child.text
                    elif 'tipo' in tag: tipo = child.text
                    elif 'informacionadicional' in tag: info_adicional = child.text
                
                if identificador: codigos.append(identificador)
                
                full_msg = ""
                if texto: full_msg += texto
                if info_adicional: full_msg += f" ({info_adicional})"
                if full_msg: mensajes.append(full_msg)
        
        return codigos, mensajes

    def _parse_recepcion(self, xml_text: str) -> dict:
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            for elem in root.iter():
                if 'estado' in elem.tag: estado = elem.text; break
            
            codigos, mensajes = self._parse_msg_node(root)

            return {
                "estado": estado, 
                "mensaje": "; ".join(mensajes) if mensajes else "Sin detalles",
                "codigos": codigos
            }
        except:
            return {"estado": SRIEstadoRespuesta.ERROR_PARSING, "mensaje": "Error parseando respuesta SRI", "codigos": []}

    def _parse_autorizacion(self, xml_text: str) -> dict:
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            num_auth = None
            fecha_auth = None
            for elem in root.iter():
                if 'estado' in elem.tag: estado = elem.text
                if 'numeroAutorizacion' in elem.tag: num_auth = elem.text
                if 'fechaAutorizacion' in elem.tag: fecha_auth = elem.text

            codigos, mensajes = self._parse_msg_node(root)
            
            return {
                "estado": estado,
                "numeroAutorizacion": num_auth,
                "fechaAutorizacion": fecha_auth,
                "mensajes": mensajes,
                "codigos": codigos
            }
        except:
            return {"estado": SRIEstadoRespuesta.ERROR_PARSING, "mensajes": ["Error parseando respuesta"], "codigos": []}

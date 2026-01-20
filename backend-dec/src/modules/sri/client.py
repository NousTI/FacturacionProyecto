import requests
from requests.exceptions import RequestException
import xml.etree.ElementTree as ET

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
             response = requests.post(url, data=soap_body, headers=headers, timeout=10)
             response.raise_for_status()
             return self._parse_recepcion(response.text)
        except RequestException as e:
             return {"estado": "ERROR_CONEXION", "mensaje": str(e)}

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
             response = requests.post(url, data=soap_body, headers=headers, timeout=10)
             response.raise_for_status()
             return self._parse_autorizacion(response.text)
        except RequestException as e:
             return {"estado": "ERROR_CONEXION", "mensaje": str(e)}

    def _parse_recepcion(self, xml_text: str) -> dict:
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            for elem in root.iter():
                if 'estado' in elem.tag: estado = elem.text; break
            
            mensajes = []
            for msg in root.iter():
                if 'mensaje' in msg.tag and len(list(msg)) > 0:
                    texto = [child.text for child in msg if child.text]
                    if texto: mensajes.append(" ".join(texto))

            return {"estado": estado, "mensaje": "; ".join(mensajes) if mensajes else "Sin detalles"}
        except:
            return {"estado": "ERROR_PARSING", "mensaje": "Error parseando respuesta SRI"}

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

            mensajes = []
            for msg in root.iter():
                if 'mensaje' in msg.tag and len(list(msg)) > 0:
                    texto = [child.text for child in msg if child.text]
                    if texto: mensajes.append(" ".join(texto))
            
            return {
                "estado": estado,
                "numeroAutorizacion": num_auth,
                "fechaAutorizacion": fecha_auth,
                "mensajes": mensajes
            }
        except:
            return {"estado": "ERROR_PARSING", "mensajes": ["Error parseando respuesta"]}

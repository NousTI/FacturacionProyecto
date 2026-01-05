import requests
from requests.exceptions import RequestException

class SRIClient:
    # WSDLs
    URLS = {
        '1': { # Pruebas
            'recepcion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
        },
        '2': { # Produccion
            'recepcion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
        }
    }

    MAX_RETRIES = 3

    def validar_comprobante(self, xml_b64: str, ambiente: str) -> dict:
        """
        Sends the XML to 'RecepcionComprobantes' via SOAP.
        """
        url = self.URLS.get(ambiente, self.URLS['1'])['recepcion']
        
        # SOAP Envelope for Validar
        soap_body = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
           <soapenv:Header/>
           <soapenv:Body>
              <ec:validarComprobante>
                 <xml>{xml_b64}</xml>
              </ec:validarComprobante>
           </soapenv:Body>
        </soapenv:Envelope>
        """
        
        try:
             # Attempt Real Call
             headers = {'Content-Type': 'text/xml;charset=UTF-8'}
             response = requests.post(url, data=soap_body, headers=headers, timeout=10)
             response.raise_for_status()
             
             # Check for SOAP Fault or SRI Response
             # For robustness without zeep, we parse the raw XML response text simply or use specific parser
             # Ideally we would use lxml here too.
             
             # If response 200 OK
             # We need to parse <estado> and <mensajes>
             
             return self._parse_recepcion_response(response.text)

        except RequestException as e:
             # Network Error
             return {"estado": "ERROR_CONEXION", "mensaje": str(e)}
        except Exception as e:
             # Logic Error (Parsing etc)
             return {"estado": "ERROR_INTERNO", "mensaje": str(e)}

    def autorizar_comprobante(self, clave_acceso: str, ambiente: str) -> dict:
        """
        Queries 'AutorizacionComprobantes' via SOAP.
        """
        url = self.URLS.get(ambiente, self.URLS['1'])['autorizacion']
        
        soap_body = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
           <soapenv:Header/>
           <soapenv:Body>
              <ec:autorizacionComprobante>
                 <claveAccesoComprobante>{clave_acceso}</claveAccesoComprobante>
              </ec:autorizacionComprobante>
           </soapenv:Body>
        </soapenv:Envelope>
        """
        
        try:
             headers = {'Content-Type': 'text/xml;charset=UTF-8'}
             response = requests.post(url, data=soap_body, headers=headers, timeout=10)
             response.raise_for_status()
             
             return self._parse_autorizacion_response(response.text)
             
        except RequestException as e:
             return {"estado": "ERROR_CONEXION", "mensaje": str(e)}
        except Exception as e:
             return {"estado": "ERROR_INTERNO", "mensaje": str(e)}

    def _parse_recepcion_response(self, xml_text: str) -> dict:
        import xml.etree.ElementTree as ET
        try:
            # Strip namespaces for easier parsing or just simple search
            root = ET.fromstring(xml_text)
            
            # Find 'estado'
            estado = "DESCONOCIDO"
            for elem in root.iter():
                if 'estado' in elem.tag:
                    estado = elem.text
                    break
            
            mensajes_list = []
            if state := estado:
                 # Find messages
                 for msg in root.iter():
                     if 'mensaje' in msg.tag and len(list(msg)) > 0: # Is a container of message details
                          texto = []
                          for child in msg:
                               if 'mensaje' in child.tag: texto.append(child.text)
                               if 'informacionAdicional' in child.tag: texto.append(child.text)
                               if 'identificador' in child.tag: texto.append(f"[{child.text}]")
                          if texto:
                               mensajes_list.append(" ".join([t for t in texto if t]))

            return {"estado": estado, "mensaje": "; ".join(mensajes_list) if mensajes_list else "Sin detalles"}
            
        except Exception:
            # Fallback
            if "RECIBIDA" in xml_text: return {"estado": "RECIBIDA", "mensaje": "OK"}
            elif "DEVUELTA" in xml_text: return {"estado": "DEVUELTA", "mensaje": "Devuelta (Error parsing failure)"}
            return {"estado": "ERROR_PARSING", "mensaje": xml_text[:500]}

    def _parse_autorizacion_response(self, xml_text: str) -> dict:
        import xml.etree.ElementTree as ET
        try:
            root = ET.fromstring(xml_text)
            estado = "DESCONOCIDO"
            clave_acceso = None
            
            for elem in root.iter():
                if 'estado' in elem.tag:
                    estado = elem.text
                if 'claveAccesoConsultada' in elem.tag:
                     clave_acceso = elem.text

            mensajes = []
            if estado == 'NO AUTORIZADO':
                 for msg in root.iter():
                      if 'mensaje' in msg.tag and len(list(msg)) > 0:
                          texto = []
                          for child in msg:
                               if 'mensaje' in child.tag: texto.append(child.text)
                               if 'informacionAdicional' in child.tag: texto.append(child.text)
                          if texto:
                               mensajes.append(" ".join([t for t in texto if t]))
            
            return {
                "estado": estado,
                "mensajes": mensajes,
                "clave_acceso": clave_acceso
            }

        except Exception:
            if "AUTORIZADO" in xml_text: return {"estado": "AUTORIZADO", "mensajes": [], "clave_acceso": "N/A"}
            return {"estado": "ERROR_PARSING", "mensajes": [xml_text[:500]]}

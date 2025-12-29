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
        # Simple string search fallback if lxml is missing, but better use lxml
        # Assuming lxml or re
        if "RECIBIDA" in xml_text:
            return {"estado": "RECIBIDA", "mensaje": "OK"}
        elif "DEVUELTA" in xml_text:
            return {"estado": "DEVUELTA", "mensaje": "Revise errores en el XML"}
        else:
             # Fallback simulation used previously? 
             # If this is strictly real now:
             return {"estado": "RESPUESTA_DESCONOCIDA", "mensaje": xml_text[:200]}

    def _parse_autorizacion_response(self, xml_text: str) -> dict:
        if "AUTORIZADO" in xml_text:
             return {
                 "estado": "AUTORIZADO", 
                 "numeroAutorizacion": "N/A", # Need parsing
                 "fechaAutorizacion": "N/A", 
                 "mensajes": []
             }
        else:
             return {"estado": "NO_AUTORIZADO", "mensajes": [xml_text[:200]]}

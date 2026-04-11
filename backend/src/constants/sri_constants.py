from enum import Enum

class SRIAmbiente(str, Enum):
    PRUEBAS = "1"
    PRODUCCION = "2"

class SRITipoEmision(str, Enum):
    NORMAL = "1"
    CONTINGENCIA = "2"

class SRICodigoDocumento(str, Enum):
    FACTURA = "01"
    NOTA_DE_DEBITO = "04"
    NOTA_DE_CREDITO = "05"
    GUIA_DE_REMISION = "06"
    COMPROBANTE_DE_RETENCION = "07"

class SRICodigoImpuesto(str, Enum):
    IVA = "2"
    ICE = "3"
    IRBPN = "5"

class SRITipoIdentificacion(str, Enum):
    RUC = "04"
    CEDULA = "05"
    PASAPORTE = "06"
    CONSUMIDOR_FINAL = "07"
    ID_EXTERIOR = "08"
    PLACA = "09"

class SRIEstadoRespuesta(str, Enum):
    RECIBIDA = 'RECIBIDA'
    DEVUELTA = 'DEVUELTA'
    AUTORIZADO = 'AUTORIZADO'
    NO_AUTORIZADO = 'NO AUTORIZADO'
    EN_PROCESO = 'EN PROCESO'
    ERROR_TIMEOUT = 'ERROR_TIMEOUT'
    ERROR_CONEXION = 'ERROR_CONEXION'

# Mapeo de porcentajes de IVA (Código SRI -> Porcentaje)
SRI_TARIFAS_IVA = {
    "0": 0,    # 0%
    "2": 12,   # 12% (Tarifa histórica / Notas de Crédito)
    "3": 14,   # 14% (Tarifa histórica)
    "4": 15,   # 15% (Tarifa General Vigente)
    "5": 5,    # 5% (Canasta básica / Otros)
    "6": 0,    # No objeto de impuesto
    "7": 0,    # Exento de IVA
    "8": 8,    # 8% (Tarifa reducida feriados turísticos)
    "10": 13   # 13% (Materiales de construcción)
}

SRI_URLS = {
    SRIAmbiente.PRUEBAS: {
        'recepcion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        'autorizacion': 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    },
    SRIAmbiente.PRODUCCION: {
        'recepcion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        'autorizacion': 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    }
}

SRI_TIMEOUT_SECONDS = 30
SRI_TIME_SLEEP_AUTORIZACION = 3

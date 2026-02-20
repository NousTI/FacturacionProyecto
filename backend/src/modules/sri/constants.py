"""
Constantes específicas para el módulo SRI.
Centraliza códigos de error, estados y parámetros de configuración.
"""

class SRIAmbiente:
    PRUEBAS = '1'
    PRODUCCION = '2'
    MAP = {"PRUEBAS": "1", "PRODUCCION": "2"}

class SRITipoEmision:
    NORMAL = '1'
    CONTINGENCIA = '2'
    MAP = {"NORMAL": "1", "CONTINGENCIA": "2"}

class SRIEstadoRespuesta:
    """Estados devueltos por el WS del SRI (Recepcion/Autorizacion)."""
    RECIBIDA = 'RECIBIDA'
    DEVUELTA = 'DEVUELTA'
    DEVUELTO = 'DEVUELTO' # Variación
    AUTORIZADO = 'AUTORIZADO'
    NO_AUTORIZADO = 'NO AUTORIZADO'
    EN_PROCESO = 'EN PROCESO'
    
    # Estados inferidos / internos del cliente SRI
    ERROR_TIMEOUT = 'ERROR_TIMEOUT'
    ERROR_CONEXION = 'ERROR_CONEXION'
    ERROR_PARSING = 'ERROR_PARSING'

class SRIErrorCodes:
    """Códigos de error y mensajes clave del SRI."""
    CLAVE_ACCESO_REGISTRADA = '43'
    CLAVE_EN_PROCESAMIENTO = '70'
    TIMEOUT = 'TIMEOUT'
    
    # Textos par buscar en mensajes sin código estructurado
    TXT_EN_PROCESAMIENTO = 'EN PROCESAMIENTO'

class LogEstado:
    """Estados para la tabla log_emision_facturas."""
    EXITOSO = 'EXITOSO'
    ERROR_VALIDACION = 'ERROR_VALIDACION'
    ERROR_CONECTIVIDAD = 'ERROR_CONECTIVIDAD'
    ERROR_SISTEMA = 'ERROR_SISTEMA'
    EN_PROCESO = 'EN_PROCESO'

class FacturaEstado:
    """Estados de la factura en el sistema local."""
    BORRADOR = 'BORRADOR'
    EN_PROCESO = 'EN_PROCESO'
    AUTORIZADA = 'AUTORIZADA'
    DEVUELTA = 'DEVUELTA'
    NO_AUTORIZADA = 'NO_AUTORIZADA'
    RECHAZADA = 'RECHAZADA'
    ANULADA = 'ANULADA'
    ERROR_TECNICO = 'ERROR_TECNICO'

# Configuración de Cliente
SRI_TIMEOUT_SECONDS = 30
SRI_TIME_SLEEP_AUTORIZACION = 3

class SRICodigoDocumento:
    FACTURA = '01'
    NOTA_CREDITO = '04'
    NOTA_DEBITO = '05'
    GUIA_REMISION = '06'
    RETENCION = '07'

class SRICodigoImpuesto:
    IVA = '2'
    ICE = '3'
    IRBPNR = '5'

class SRITipoIdentificacion:
    RUC = '04'
    CEDULA = '05'
    PASAPORTE = '06'
    CONSUMIDOR_FINAL = '07'
    ID_EXTERIOR = '08'
    PLACA = '09'

SRI_TARIFAS_IVA = {
    '0': 0,
    '2': 12,
    '3': 14,
    '4': 15,
    '5': 5,
    '6': 0,
    '7': 0,
    '8': 8,
    '10': 13
}

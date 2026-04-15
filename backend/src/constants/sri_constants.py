from enum import Enum

class SRIAmbiente(str, Enum):
    PRUEBAS = "1"
    PRODUCCION = "2"

class SRITipoEmision(str, Enum):
    NORMAL = "1"
    CONTINGENCIA = "2"

class SRICodigoDocumento(str, Enum):
    FACTURA = "01"
    NOTA_DE_DEBITO = "04"  # [cite: 583]
    NOTA_DE_CREDITO = "05" # [cite: 583]
    GUIA_DE_REMISION = "06"
    COMPROBANTE_DE_RETENCION = "07" # [cite: 417, 789]
    LIQUIDACION_DE_COMPRA = "03"    # Muy importante para compras a personas sin RUC [cite: 226, 626]
    TIQUETES_MAQUINAS_REGISTRADORAS = "12" 
    NOTAS_DE_VENTA_RIMPE = "11"     # El antiguo RISE [cite: 315, 683]

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

class SRITipoPersona(str, Enum):
    NATURAL = "NATURAL"
    JURIDICA = "JURIDICA"

class SRITipoContribuyente(str, Enum):
    REGIMEN_GENERAL = "REGIMEN_GENERAL"
    RIMPE_EMPRENDEDOR = "RIMPE_EMPRENDEDOR"
    RIMPE_POPULAR = "RIMPE_POPULAR"

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

# Formas de pago SRI con indicador de si requieren plazo de crédito
# requiere_plazo=True → el pago no es inmediato, se debe registrar plazo y unidad_tiempo
SRI_FORMAS_PAGO = [
    {"codigo": "01", "label": "Efectivo",                                        "requiere_plazo": False},
    {"codigo": "15", "label": "Compensación de deudas",                          "requiere_plazo": False},
    {"codigo": "16", "label": "Tarjeta de débito",                               "requiere_plazo": False},
    {"codigo": "17", "label": "Dinero electrónico",                              "requiere_plazo": False},
    {"codigo": "18", "label": "Tarjeta prepago",                                 "requiere_plazo": False},
    {"codigo": "19", "label": "Tarjeta de crédito",                              "requiere_plazo": True},
    {"codigo": "20", "label": "Otros con utilización del sistema financiero",    "requiere_plazo": False},
    {"codigo": "21", "label": "Endoso de títulos",                               "requiere_plazo": True},
]

SRI_FORMAS_PAGO_CON_PLAZO = {fp["codigo"] for fp in SRI_FORMAS_PAGO if fp["requiere_plazo"]}

SRI_TIMEOUT_SECONDS = 30
SRI_TIME_SLEEP_AUTORIZACION = 3


class UnidadMedida(str, Enum):
    UNIDAD = "u"        # [cite: 315]
    KILOGRAMO = "kg"
    GRAMO = "g"
    LIBRA = "lb"
    METRO = "m"
    METRO_CUADRADO = "m2"
    LITRO = "l"
    CAJA = "cj"         # [cite: 359]
    PAQUETE = "pq"
    SERVICIO = "serv"   # Para ítems intangibles [cite: 589]
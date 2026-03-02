from typing import Optional, Dict
import xml.etree.ElementTree as ET
from decimal import Decimal

class EstrategiaPago:
    """Clase base para estrategias de pago SRI."""
    codigo_sri: str

    def generar_nodo(self, parent: ET.Element, total: Decimal, plazo: Optional[int] = None, unidad_tiempo: Optional[str] = None):
        """Genera el nodo XML <pago> correspondiente."""
        pago = ET.SubElement(parent, 'pago')
        ET.SubElement(pago, 'formaPago').text = self.codigo_sri
        ET.SubElement(pago, 'total').text = f"{total:.2f}"
        
        # Validaciones de campos extra
        if self._requiere_plazo():
            # Si no vienen datos, ponemos defaults para evitar rechazo
            p_val = str(plazo) if plazo is not None else "0"
            u_val = unidad_tiempo if unidad_tiempo else "DIAS"
            
            ET.SubElement(pago, 'plazo').text = p_val
            ET.SubElement(pago, 'unidadTiempo').text = u_val.lower() # SRI espera minúsculas?

    def _requiere_plazo(self) -> bool:
        return False


class PagoSinSistemaFinanciero(EstrategiaPago):
    """01 - Efectivo / Sin sistema financiero."""
    codigo_sri = '01'
    # No requiere plazo ni unidad


class PagoConSistemaFinanciero(EstrategiaPago):
    """Clase para pagos que requieren plazo/unidad (Tarjetas, Cheques, etc)."""
    def __init__(self, codigo: str):
        self.codigo_sri = codigo
    
    def _requiere_plazo(self) -> bool:
        return True


class FactoryPagosSRI:
    """Fábrica para obtener la estrategia correcta según el código."""
    
    _INSTANCIAS: Dict[str, EstrategiaPago] = {
        '01': PagoSinSistemaFinanciero(),
        # Todos estos requieren plazo/unidad según ficha técnica SRI (Tabla 24)
        '15': PagoConSistemaFinanciero('15'), # Compensación de deudas
        '16': PagoConSistemaFinanciero('16'), # Tarjeta de Débito
        '17': PagoConSistemaFinanciero('17'), # Dinero Electrónico
        '18': PagoConSistemaFinanciero('18'), # Tarjeta Prepago
        '19': PagoConSistemaFinanciero('19'), # Tarjeta de Crédito
        '20': PagoConSistemaFinanciero('20'), # Otros con utilización del sistema financiero
        '21': PagoConSistemaFinanciero('21'), # Endoso de Títulos
    }

    @classmethod
    def obtener_estrategia(cls, codigo: str) -> EstrategiaPago:
        codigo_limpio = str(codigo).strip().zfill(2)
        return cls._INSTANCIAS.get(codigo_limpio, PagoConSistemaFinanciero(codigo_limpio))

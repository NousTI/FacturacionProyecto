import xml.etree.ElementTree as ET
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class SRIXMLService:
    def generar_xml_factura(self, factura: dict, cliente: dict, empresa: dict, detalles: list, ambiente: str = '1', info_adicional: dict = None) -> str:
        """
        Generates the XML v2.1.0 for a Factura.
        Returns the XML string.
        """
        # 1. Root Element
        factura_xml = ET.Element('factura', id="comprobante", version="2.1.0")
        
        # 2. InfoTributaria
        # ambiente provided via argument
        tipo_emision = '1' # Normal
        
        info_tributaria = ET.SubElement(factura_xml, 'infoTributaria')
        ET.SubElement(info_tributaria, 'ambiente').text = ambiente
        ET.SubElement(info_tributaria, 'tipoEmision').text = tipo_emision
        ET.SubElement(info_tributaria, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info_tributaria, 'nombreComercial').text = empresa.get('nombre_comercial', empresa['razon_social'])
        ET.SubElement(info_tributaria, 'ruc').text = empresa['ruc']
        
        # Generar Clave de Acceso Real
        secuencial = factura.get('numero_factura', '000000001').split('-')[-1]
        estab_code = factura.get('establecimiento_codigo', '001')
        pto_emi_code = factura.get('punto_emision_codigo', '001')
        
        # Codigo numerico (8 digitos) - Usamos algo estable o aleatorio.
        # Para pruebas, podemos usar un valor fijo o derivado del ID para simplicidad, 
        # pero idealmente deberia ser aleatorio y persistido.
        # Usaremos '12345678' por defecto si no existe campo, o '87654321' para variar.
        codigo_numerico = '12345678' 
        
        clave_acceso = self._generar_clave_acceso(
            fecha_emision=factura['fecha_emision'],
            tipo_comprobante='01', # Factura
            ruc=empresa['ruc'],
            ambiente=ambiente,
            establecimiento=estab_code,
            punto_emision=pto_emi_code,
            secuencial=secuencial,
            codigo_numerico=codigo_numerico
        )
        
        ET.SubElement(info_tributaria, 'claveAcceso').text = clave_acceso
        
        ET.SubElement(info_tributaria, 'codDoc').text = '01'
        ET.SubElement(info_tributaria, 'estab').text = estab_code
        ET.SubElement(info_tributaria, 'ptoEmi').text = pto_emi_code
        ET.SubElement(info_tributaria, 'secuencial').text = secuencial
        ET.SubElement(info_tributaria, 'dirMatriz').text = empresa.get('direccion', 'S/N')
        
        # 3. InfoFactura
        info_factura = ET.SubElement(factura_xml, 'infoFactura')
        ET.SubElement(info_factura, 'fechaEmision').text = factura['fecha_emision'].strftime('%d/%m/%Y')
        ET.SubElement(info_factura, 'dirEstablecimiento').text = empresa.get('direccion', 'S/N') # Should be establishment address
        ET.SubElement(info_factura, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        ET.SubElement(info_factura, 'tipoIdentificacionComprador').text = self._map_tipo_identificacion(cliente.get('tipo_identificacion'))
        ET.SubElement(info_factura, 'razonSocialComprador').text = cliente['razon_social']
        ET.SubElement(info_factura, 'identificacionComprador').text = cliente['identificacion']
        ET.SubElement(info_factura, 'totalSinImpuestos').text = f"{factura['subtotal_sin_iva']:.2f}"
        ET.SubElement(info_factura, 'totalDescuento').text = f"{factura['descuento']:.2f}"
        
        # Total con impuestos
        total_impuesto = ET.SubElement(info_factura, 'totalConImpuestos')
        # Here we should iterate over tax summary. Assuming simple structure for now.
        impuesto = ET.SubElement(total_impuesto, 'totalImpuesto')
        ET.SubElement(impuesto, 'codigo').text = '2' # IVA
        ET.SubElement(impuesto, 'codigoPorcentaje').text = '2' # 12% currently/dynamic
        ET.SubElement(impuesto, 'baseImponible').text = f"{factura['subtotal_sin_iva']:.2f}"
        ET.SubElement(impuesto, 'valor').text = f"{factura['iva']:.2f}"
        
        ET.SubElement(info_factura, 'propina').text = f"{factura['propina']:.2f}"
        ET.SubElement(info_factura, 'importeTotal').text = f"{factura['total']:.2f}"
        ET.SubElement(info_factura, 'moneda').text = 'DOLAR'
        
        # 4. Detalles
        detalles_xml = ET.SubElement(factura_xml, 'detalles')
        for det in detalles:
            detalle = ET.SubElement(detalles_xml, 'detalle')
            ET.SubElement(detalle, 'codigoPrincipal').text = det['codigo_producto']
            ET.SubElement(detalle, 'descripcion').text = det['descripcion']
            ET.SubElement(detalle, 'cantidad').text = f"{det['cantidad']:.6f}"
            ET.SubElement(detalle, 'precioUnitario').text = f"{det['precio_unitario']:.6f}"
            ET.SubElement(detalle, 'descuento').text = f"{det['descuento']:.2f}"
            ET.SubElement(detalle, 'precioTotalSinImpuesto').text = f"{det['subtotal']:.2f}"
            
            impuestos_det = ET.SubElement(detalle, 'impuestos')
            imp_det = ET.SubElement(impuestos_det, 'impuesto')
            ET.SubElement(imp_det, 'codigo').text = '2' # IVA
            ET.SubElement(imp_det, 'codigoPorcentaje').text = '2' # Example
            ET.SubElement(imp_det, 'tarifa').text = '12' # Example
            ET.SubElement(imp_det, 'baseImponible').text = f"{det['subtotal']:.2f}"
            ET.SubElement(imp_det, 'valor').text = f"{det['valor_iva']:.2f}"

        # 5. InfoAdicional
        if info_adicional:
             info_ad = ET.SubElement(factura_xml, 'infoAdicional')
             for k, v in info_adicional.items():
                 campo = ET.SubElement(info_ad, 'campoAdicional', nombre=k)
                 campo.text = str(v)

        return self._prettify(factura_xml)

    def _prettify(self, elem):
        """Return a pretty-printed XML string for the Element."""
        try:
             # Py 3.9+
             ET.indent(elem, space="  ", level=0)
        except:
             pass
        return ET.tostring(elem, encoding='unicode', method='xml')

    def _generar_clave_acceso(self, fecha_emision: datetime, tipo_comprobante: str, ruc: str, ambiente: str, establecimiento: str, punto_emision: str, secuencial: str, codigo_numerico: str) -> str:
        """
        Generates the 49-digit Access Key (Clave de Acceso).
        Format:
        ddmmyyyy (8)
        tipo_comprobante (2)
        ruc (13)
        ambiente (1)
        serie (est + pto) (6)
        secuencial (9)
        codigo_numerico (8)
        tipo_emision (1)
        digito_verificador (1) -> Modulo 11
        """
        fecha = fecha_emision.strftime('%d%m%Y')
        serie = f"{establecimiento}{punto_emision}"
        
        # Base key (48 digits)
        clave = f"{fecha}{tipo_comprobante}{ruc}{ambiente}{serie}{secuencial}{codigo_numerico}1" # 1 is Initial Emision Type (Normal)
        
        # Verify Length should be 48
        if len(clave) != 48:
             # Fallback or error? For now assume inputs are correct/padded
             pass

        digito = self._compute_modulo_11(clave)
        return f"{clave}{digito}"

    def _compute_modulo_11(self, clave: str) -> int:
        """
        Computes Modulo 11 check digit.
        """
        suma = 0
        factor = 2
        
        for digit in reversed(clave):
            suma += int(digit) * factor
            factor += 1
            if factor > 7:
                factor = 2
                
        residuo = suma % 11
        check_digit = 11 - residuo
        
        if check_digit == 11:
            return 0
        if check_digit == 10:
            return 1
        return check_digit

    def _map_tipo_identificacion(self, tipo: str) -> str:
        if not tipo: return '07' # Consumidor Final
        tipo = tipo.upper()
        if 'RUC' in tipo: return '04'
        if 'CEDULA' in tipo: return '05'
        if 'PASAPORTE' in tipo: return '06'
        return '07'

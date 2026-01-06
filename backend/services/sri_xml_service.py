import xml.etree.ElementTree as ET
from datetime import datetime
from uuid import UUID
from decimal import Decimal, ROUND_HALF_UP

class SRIXMLService:
    def generar_xml_factura(self, factura: dict, cliente: dict, empresa: dict, detalles: list, ambiente: str = '1', info_adicional: dict = None) -> str:
        """
        Generates the XML v1.1.0 for a Factura complying with SRI logic.
        Validates data before generation.
        """
        # 0. Validations
        self.validateFacturaXmlData(factura, detalles, cliente)

        # 1. Root Element (Version 1.1.0 as requested)
        factura_xml = ET.Element('factura', id="comprobante", version="1.1.0")

        # 2. InfoTributaria
        self.generateInfoTributaria(factura_xml, factura, empresa, ambiente)

        # 3. InfoFactura
        self.generateInfoFactura(factura_xml, factura, cliente, empresa)

        # 4. Detalles
        self.generateDetalles(factura_xml, detalles)

        # 5. InfoAdicional
        if info_adicional:
            self.generateInfoAdicional(factura_xml, info_adicional)

        return self._prettify(factura_xml)

    def generateInfoTributaria(self, root: ET.Element, factura: dict, empresa: dict, ambiente: str):
        """Generates infoTributaria node with strict ordering and Clave Acceso."""
        info = ET.SubElement(root, 'infoTributaria')
        
        # Order: ambiente, tipoEmision, razonSocial, nombreComercial, ruc, claveAcceso, codDoc, estab, ptoEmi, secuencial, dirMatriz
        ET.SubElement(info, 'ambiente').text = ambiente
        ET.SubElement(info, 'tipoEmision').text = '1' # Normal
        ET.SubElement(info, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info, 'nombreComercial').text = empresa.get('nombre_comercial', empresa['razon_social'])
        ET.SubElement(info, 'ruc').text = empresa['ruc']

        # Clave Acceso Logic
        fecha_emision = factura['fecha_emision'] # DateTime object
        if isinstance(fecha_emision, str):
            fecha_emision = datetime.fromisoformat(fecha_emision)

        estab = factura.get('establecimiento_codigo', '001')
        pto_emi = factura.get('punto_emision_codigo', '001')
        secuencial = factura.get('numero_factura', '000000001').split('-')[-1]
        
        # Padding checks
        estab = estab.zfill(3)
        pto_emi = pto_emi.zfill(3)
        secuencial = secuencial.zfill(9)

        # Codigo Numerico (8 digits)
        codigo_numerico = '12345678' # Fixed for stability in this iteration, ideally random.

        clave_acceso = self.generateClaveAcceso(
            fecha_emision, '01', empresa['ruc'], ambiente, estab, pto_emi, secuencial, codigo_numerico
        )

        ET.SubElement(info, 'claveAcceso').text = clave_acceso
        ET.SubElement(info, 'codDoc').text = '01' # Factura
        ET.SubElement(info, 'estab').text = estab
        ET.SubElement(info, 'ptoEmi').text = pto_emi
        ET.SubElement(info, 'secuencial').text = secuencial
        ET.SubElement(info, 'dirMatriz').text = empresa.get('direccion', 'S/N')

    def generateInfoFactura(self, root: ET.Element, factura: dict, cliente: dict, empresa: dict):
        """Generates infoFactura node."""
        info = ET.SubElement(root, 'infoFactura')
        
        # Fecha Emision: dd/mm/yyyy
        fecha_str = self.normalizeDate(factura['fecha_emision'])
        ET.SubElement(info, 'fechaEmision').text = fecha_str
        
        ET.SubElement(info, 'dirEstablecimiento').text = empresa.get('direccion', 'S/N')
        ET.SubElement(info, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        tipo_ident = self._map_tipo_identificacion(cliente.get('tipo_identificacion'))
        ET.SubElement(info, 'tipoIdentificacionComprador').text = tipo_ident
        ET.SubElement(info, 'razonSocialComprador').text = cliente['razon_social']
        ET.SubElement(info, 'identificacionComprador').text = cliente['identificacion']
        
        ET.SubElement(info, 'totalSinImpuestos').text = self.normalizeNumber(factura['subtotal_sin_iva'])
        ET.SubElement(info, 'totalDescuento').text = self.normalizeNumber(factura['descuento'])
        
        # Total con Impuestos
        total_impuesto_node = ET.SubElement(info, 'totalConImpuestos')
        # Assuming all IVA 12/15 is aggregated. For simple implementation:
        impuesto = ET.SubElement(total_impuesto_node, 'totalImpuesto')
        ET.SubElement(impuesto, 'codigo').text = '2' # IVA
        ET.SubElement(impuesto, 'codigoPorcentaje').text = '2' # 12% - ToDo: Make dynamic based on tax logic
        ET.SubElement(impuesto, 'baseImponible').text = self.normalizeNumber(factura['subtotal_sin_iva'])
        ET.SubElement(impuesto, 'valor').text = self.normalizeNumber(factura['iva'])
        
        ET.SubElement(info, 'propina').text = self.normalizeNumber(factura['propina'])
        ET.SubElement(info, 'importeTotal').text = self.normalizeNumber(factura['total'])
        ET.SubElement(info, 'moneda').text = 'DOLAR'
        
        # Pagos (Optional but recommended)
        # pagos = ET.SubElement(info, 'pagos')
        # ...

    def generateDetalles(self, root: ET.Element, detalles: list):
        """Generates detalles node."""
        detalles_node = ET.SubElement(root, 'detalles')
        
        for det in detalles:
            item = ET.SubElement(detalles_node, 'detalle')
            ET.SubElement(item, 'codigoPrincipal').text = det['codigo_producto']
            ET.SubElement(item, 'descripcion').text = det['descripcion']
            ET.SubElement(item, 'cantidad').text = self.normalizeNumber(det['cantidad'], precision=6) # Cantidad can have up to 6
            ET.SubElement(item, 'precioUnitario').text = self.normalizeNumber(det['precio_unitario'], precision=6)
            ET.SubElement(item, 'descuento').text = self.normalizeNumber(det['descuento'])
            ET.SubElement(item, 'precioTotalSinImpuesto').text = self.normalizeNumber(det['subtotal'])
            
            impuestos = ET.SubElement(item, 'impuestos')
            imp = ET.SubElement(impuestos, 'impuesto')
            ET.SubElement(imp, 'codigo').text = '2' # IVA
            ET.SubElement(imp, 'codigoPorcentaje').text = '2' # ToDo: Dynamic
            ET.SubElement(imp, 'tarifa').text = '12' # ToDo: Dynamic
            ET.SubElement(imp, 'baseImponible').text = self.normalizeNumber(det['subtotal'])
            ET.SubElement(imp, 'valor').text = self.normalizeNumber(det['valor_iva'])

    def generateInfoAdicional(self, root: ET.Element, info_adicional: dict):
        info_ad = ET.SubElement(root, 'infoAdicional')
        for k, v in info_adicional.items():
            if v:
                campo = ET.SubElement(info_ad, 'campoAdicional', nombre=k)
                campo.text = str(v)

    def generateClaveAcceso(self, fecha_emision: datetime, tipo_comprobante: str, ruc: str, ambiente: str, establecimiento: str, punto_emision: str, secuencial: str, codigo_numerico: str) -> str:
        """
        Generates 49 digit Clave de Acceso with Modulo 11.
        """
        fecha = fecha_emision.strftime('%d%m%Y')
        tipo_emision = '1' # Normal
        
        # Padding enforcement (just in case)
        establecimiento = establecimiento.zfill(3)
        punto_emision = punto_emision.zfill(3)
        secuencial = secuencial.zfill(9)
        codigo_numerico = codigo_numerico.zfill(8)
        
        clave_base = f"{fecha}{tipo_comprobante}{ruc}{ambiente}{establecimiento}{punto_emision}{secuencial}{codigo_numerico}{tipo_emision}"
        
        digito_verificador = self.modulo11(clave_base)
        
        return f"{clave_base}{digito_verificador}"

    def modulo11(self, clave: str) -> int:
        """
        Calculates Modulo 11 check digit.
        If result is 10 -> 1
        If result is 11 -> 0
        """
        # Reverse string
        reversed_digits = [int(d) for d in reversed(clave)]
        factor = 2
        suma = 0
        
        for d in reversed_digits:
            suma += d * factor
            factor += 1
            if factor > 7:
                factor = 2
                
        residuo = suma % 11
        resultado = 11 - residuo
        
        if resultado == 11:
            return 0
        if resultado == 10:
            return 1
        return resultado

    def validateFacturaXmlData(self, factura: dict, detalles: list, cliente: dict):
        """
        Validates data coherence. Raises ValueError if invalid.
        """
        # 1. Totals Coherence
        subtotal = Decimal(str(factura['subtotal_sin_iva']))
        iva = Decimal(str(factura['iva']))
        propina = Decimal(str(factura.get('propina', 0)))
        total_db = Decimal(str(factura['total']))
        
        calculated_total = subtotal + iva + propina
        
        # Allow small epsilon difference due to rounding
        if abs(calculated_total - total_db) > Decimal('0.02'):
             raise ValueError(f"Inconsistencia en totales: Calculado ({calculated_total}) != DB ({total_db})")
             
        # 2. Detalles Sum Validation
        sum_detalles = sum(Decimal(str(d['subtotal'])) for d in detalles)
        if abs(sum_detalles - subtotal) > Decimal('0.02'):
             raise ValueError(f"Inconsistencia detalles: Suma Detalles ({sum_detalles}) != Subtotal Factura ({subtotal})")
             
        # 3. Identificacion Validation
        tipo_id = cliente.get('tipo_identificacion', '')
        ident = cliente.get('identificacion', '')
        if 'RUC' in tipo_id.upper() and len(ident) != 13:
             raise ValueError(f"RUC inválido: {ident} (Debe tener 13 dígitos)")
        if 'CEDULA' in tipo_id.upper() and len(ident) != 10:
             raise ValueError(f"Cédula inválida: {ident} (Debe tener 10 dígitos)")

    def normalizeNumber(self, val, precision=2) -> str:
        """Formats number to fixed decimal places."""
        d = Decimal(str(val))
        return f"{d:.{precision}f}"

    def normalizeDate(self, date_obj) -> str:
        """Formats date to dd/mm/yyyy."""
        if isinstance(date_obj, str):
            date_obj = datetime.fromisoformat(date_obj)
        return date_obj.strftime('%d/%m/%Y')

    def _map_tipo_identificacion(self, tipo: str) -> str:
        if not tipo: return '07'
        tipo = tipo.upper()
        if 'RUC' in tipo: return '04'
        if 'CEDULA' in tipo: return '05'
        if 'PASAPORTE' in tipo: return '06'
        return '07'

    def _prettify(self, elem):
        try:
             ET.indent(elem, space="  ", level=0)
        except: pass
        return ET.tostring(elem, encoding='unicode', method='xml')


import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal

class ServicioSRIXML:
    def generar_xml_factura(self, factura: dict, cliente: dict, empresa: dict, detalles: list, ambiente: str = '1') -> str:
        root = ET.Element('factura', id="comprobante", version="1.1.0")
        
        # Info Tributaria
        info_trib = ET.SubElement(root, 'infoTributaria')
        ET.SubElement(info_trib, 'ambiente').text = ambiente
        ET.SubElement(info_trib, 'tipoEmision').text = '1'
        ET.SubElement(info_trib, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info_trib, 'nombreComercial').text = empresa.get('nombre_comercial') or empresa['razon_social']
        ET.SubElement(info_trib, 'ruc').text = empresa['ruc']
        
        # Clave Acceso
        f_emision = factura['fecha_emision']
        if isinstance(f_emision, str): f_emision = datetime.fromisoformat(f_emision)
        
        estab = factura.get('establecimiento_codigo', '001').zfill(3)
        pto_emi = factura.get('punto_emision_codigo', '001').zfill(3)
        secuencial = factura.get('numero_factura', '001-001-000000001').split('-')[-1].zfill(9)
        
        clave = self.generar_clave_acceso(f_emision, '01', empresa['ruc'], ambiente, estab, pto_emi, secuencial)
        ET.SubElement(info_trib, 'claveAcceso').text = clave
        ET.SubElement(info_trib, 'codDoc').text = '01'
        ET.SubElement(info_trib, 'estab').text = estab
        ET.SubElement(info_trib, 'ptoEmi').text = pto_emi
        ET.SubElement(info_trib, 'secuencial').text = secuencial
        ET.SubElement(info_trib, 'dirMatriz').text = empresa.get('direccion', 'S/N')

        # Info Factura
        info_fac = ET.SubElement(root, 'infoFactura')
        ET.SubElement(info_fac, 'fechaEmision').text = f_emision.strftime('%d/%m/%Y')
        ET.SubElement(info_fac, 'dirEstablecimiento').text = empresa.get('direccion', 'S/N')
        ET.SubElement(info_fac, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        tipo_id = '04' if 'RUC' in cliente.get('tipo_identificacion', '').upper() else '05'
        ET.SubElement(info_fac, 'tipoIdentificacionComprador').text = tipo_id
        ET.SubElement(info_fac, 'razonSocialComprador').text = cliente['razon_social']
        ET.SubElement(info_fac, 'identificacionComprador').text = cliente['identificacion']
        ET.SubElement(info_fac, 'totalSinImpuestos').text = f"{Decimal(str(factura['subtotal_sin_iva'])):.2f}"
        ET.SubElement(info_fac, 'totalDescuento').text = f"{Decimal(str(factura.get('descuento', 0))):.2f}"
        
        total_imp = ET.SubElement(info_fac, 'totalConImpuestos')
        imp = ET.SubElement(total_imp, 'totalImpuesto')
        ET.SubElement(imp, 'codigo').text = '2'
        ET.SubElement(imp, 'codigoPorcentaje').text = '2'
        ET.SubElement(imp, 'baseImponible').text = f"{Decimal(str(factura['subtotal_sin_iva'])):.2f}"
        ET.SubElement(imp, 'valor').text = f"{Decimal(str(factura['iva'])):.2f}"
        
        ET.SubElement(info_fac, 'propina').text = '0.00'
        ET.SubElement(info_fac, 'importeTotal').text = f"{Decimal(str(factura['total'])):.2f}"
        ET.SubElement(info_fac, 'moneda').text = 'DOLAR'

        # Detalles
        detalles_node = ET.SubElement(root, 'detalles')
        for det in detalles:
            d = ET.SubElement(detalles_node, 'detalle')
            ET.SubElement(d, 'codigoPrincipal').text = det['codigo_producto']
            ET.SubElement(d, 'descripcion').text = det['descripcion']
            ET.SubElement(d, 'cantidad').text = f"{Decimal(str(det['cantidad'])):.6f}"
            ET.SubElement(d, 'precioUnitario').text = f"{Decimal(str(det['precio_unitario'])):.6f}"
            ET.SubElement(d, 'descuento').text = f"{Decimal(str(det.get('descuento', 0))):.2f}"
            ET.SubElement(d, 'precioTotalSinImpuesto').text = f"{Decimal(str(det['subtotal'])):.2f}"
            
            imps = ET.SubElement(d, 'impuestos')
            im = ET.SubElement(imps, 'impuesto')
            ET.SubElement(im, 'codigo').text = '2'
            ET.SubElement(im, 'codigoPorcentaje').text = '2'
            ET.SubElement(im, 'tarifa').text = '12'
            ET.SubElement(im, 'baseImponible').text = f"{Decimal(str(det['subtotal'])):.2f}"
            ET.SubElement(im, 'valor').text = f"{Decimal(str(det['valor_iva'])):.2f}"

        return ET.tostring(root, encoding='unicode')

    def generar_clave_acceso(self, fecha: datetime, tipo: str, ruc: str, ambiente: str, estab: str, pto: str, secuencial: str) -> str:
        base = f"{fecha.strftime('%d%m%Y')}{tipo}{ruc}{ambiente}{estab}{pto}{secuencial}123456781"
        return f"{base}{self.modulo11(base)}"

    def modulo11(self, clave: str) -> int:
        reversed_digits = [int(d) for d in reversed(clave)]
        factor = 2
        suma = 0
        for d in reversed_digits:
            suma += d * factor
            factor = 2 if factor >= 7 else factor + 1
        residuo = suma % 11
        res = 11 - residuo
        return 0 if res == 11 else (1 if res == 10 else res)

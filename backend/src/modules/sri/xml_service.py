import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List

class ServicioSRIXML:
    def _round(self, value, places=2):
        if not isinstance(value, Decimal):
            value = Decimal(str(value))
        return value.quantize(Decimal(f"1.{'0'*places}"), rounding=ROUND_HALF_UP)

    def generar_xml_factura(self, factura: dict, cliente: dict, empresa: dict, detalles: list, ambiente: str = '1', tipo_emision: str = '1') -> str:
        root = ET.Element('factura', id="comprobante", version="1.1.0")
        
        # Info Tributaria
        info_trib = ET.SubElement(root, 'infoTributaria')
        ET.SubElement(info_trib, 'ambiente').text = ambiente
        ET.SubElement(info_trib, 'tipoEmision').text = tipo_emision
        ET.SubElement(info_trib, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info_trib, 'nombreComercial').text = empresa.get('nombre_comercial') or empresa['razon_social']
        ET.SubElement(info_trib, 'ruc').text = empresa['ruc']
        
        # Clave Acceso: Se genera después con todos los datos
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
        
        # Agentes de Retención / Microempresas / RIMPE
        tipo_cont = str(empresa.get('tipo_contribuyente', '')).upper()
        if 'RIMPE' in tipo_cont or empresa.get('contribuyente_rimpe'):
             ET.SubElement(info_trib, 'contribuyenteRimpe').text = 'CONTRIBUYENTE RÉGIMEN RIMPE'

        # --- CÁLCULOS DE PRECISIÓN ---
        t_sin_impuestos = Decimal('0.00')
        t_descuentos = Decimal('0.00')
        impuestos_map = {}
        
        detalles_procesados = []
        
        for det in detalles:
            # 1. Normalizar valores unitarios (6 decimales para precisión en cálculo)
            cantidad = self._round(det['cantidad'], 6)
            precio_u = self._round(det['precio_unitario'], 6)
            descuento = self._round(det.get('descuento', 0), 2)
            
            # 2. Calcular Subtotal Línea: (Cant * Precio) - Desc
            subtotal_bruto = cantidad * precio_u
            subtotal = subtotal_bruto - descuento
            subtotal = self._round(subtotal, 2)
            
            # 3. Acumular globales
            t_sin_impuestos += subtotal
            t_descuentos += descuento
            
            # 4. Calcular Impuestos Línea
            cod_sri = str(det.get('tipo_iva', '2')) 
            # Mapa de tarifas (SRI Código Porcentaje -> Valor %)
            tarifas = {'0': 0, '2': 12, '3': 14, '4': 15, '5': 5, '6': 0, '7': 0, '8': 8, '10': 13}
            porcentaje = tarifas.get(cod_sri, 12)
            
            valor_iva = Decimal('0.00')
            if porcentaje > 0:
                raw_iva = subtotal * (Decimal(porcentaje) / Decimal(100))
                valor_iva = self._round(raw_iva, 2)
                
            # Agrupar impuestos para tabla resumen
            if cod_sri not in impuestos_map:
                impuestos_map[cod_sri] = {'base': Decimal('0.00'), 'valor': Decimal('0.00'), 'tarifa': porcentaje}
            impuestos_map[cod_sri]['base'] += subtotal
            impuestos_map[cod_sri]['valor'] += valor_iva
            
            # Guardar procesado
            detalles_procesados.append({
                'data': det,
                'cantidad': cantidad,
                'precioUnitario': precio_u,
                'descuento': descuento,
                'precioTotalSinImpuesto': subtotal,
                'impuesto': {
                    'codigo': '2',
                    'codigoPorcentaje': cod_sri,
                    'tarifa': str(porcentaje),
                    'baseImponible': subtotal,
                    'valor': valor_iva
                }
            })

        # 5. Calcular Totales Finales
        t_propina = self._round(factura.get('propina', 0), 2)
        t_impuestos_total = sum(i['valor'] for i in impuestos_map.values())
        importe_total = t_sin_impuestos + t_impuestos_total + t_propina

        # Info Factura
        info_fac = ET.SubElement(root, 'infoFactura')
        ET.SubElement(info_fac, 'fechaEmision').text = f_emision.strftime('%d/%m/%Y')
        ET.SubElement(info_fac, 'dirEstablecimiento').text = empresa.get('direccion_sucursal') or empresa.get('direccion', 'S/N')
        ET.SubElement(info_fac, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        tipo_id_raw = cliente.get('tipo_identificacion', '').upper()
        identificacion = str(cliente.get('identificacion', ''))
        
        if identificacion == '9999999999999': tipo_id = '07'
        elif 'RUC' in tipo_id_raw: tipo_id = '04'
        elif 'CEDULA' in tipo_id_raw: tipo_id = '05'
        elif 'PASAPORTE' in tipo_id_raw: tipo_id = '06'
        else: tipo_id = '08' 
            
        ET.SubElement(info_fac, 'tipoIdentificacionComprador').text = tipo_id
        ET.SubElement(info_fac, 'razonSocialComprador').text = cliente['razon_social']
        ET.SubElement(info_fac, 'identificacionComprador').text = identificacion
        ET.SubElement(info_fac, 'totalSinImpuestos').text = f"{t_sin_impuestos:.2f}"
        ET.SubElement(info_fac, 'totalDescuento').text = f"{t_descuentos:.2f}"
        
        total_imp = ET.SubElement(info_fac, 'totalConImpuestos')
        for cod, data in impuestos_map.items():
            imp = ET.SubElement(total_imp, 'totalImpuesto')
            ET.SubElement(imp, 'codigo').text = '2'
            ET.SubElement(imp, 'codigoPorcentaje').text = cod
            ET.SubElement(imp, 'baseImponible').text = f"{data['base']:.2f}"
            ET.SubElement(imp, 'valor').text = f"{data['valor']:.2f}"
        
        ET.SubElement(info_fac, 'propina').text = f"{t_propina:.2f}"
        ET.SubElement(info_fac, 'importeTotal').text = f"{importe_total:.2f}"
        ET.SubElement(info_fac, 'moneda').text = 'DOLAR'

        # Pagos
        pagos_node = ET.SubElement(info_fac, 'pagos')
        pago = ET.SubElement(pagos_node, 'pago')
        ET.SubElement(pago, 'formaPago').text = factura.get('forma_pago_sri', '01') 
        ET.SubElement(pago, 'total').text = f"{importe_total:.2f}"

        # Detalles
        detalles_node = ET.SubElement(root, 'detalles')
        for item in detalles_procesados:
            d = ET.SubElement(detalles_node, 'detalle')
            orig = item['data']
            ET.SubElement(d, 'codigoPrincipal').text = orig['codigo_producto']
            ET.SubElement(d, 'descripcion').text = orig['descripcion']
            ET.SubElement(d, 'cantidad').text = f"{item['cantidad']:.6f}"
            ET.SubElement(d, 'precioUnitario').text = f"{item['precioUnitario']:.6f}"
            ET.SubElement(d, 'descuento').text = f"{item['descuento']:.2f}"
            ET.SubElement(d, 'precioTotalSinImpuesto').text = f"{item['precioTotalSinImpuesto']:.2f}"
            
            imps = ET.SubElement(d, 'impuestos')
            im = ET.SubElement(imps, 'impuesto')
            ET.SubElement(im, 'codigo').text = item['impuesto']['codigo']
            ET.SubElement(im, 'codigoPorcentaje').text = item['impuesto']['codigoPorcentaje']
            ET.SubElement(im, 'tarifa').text = item['impuesto']['tarifa']
            ET.SubElement(im, 'baseImponible').text = f"{item['impuesto']['baseImponible']:.2f}"
            ET.SubElement(im, 'valor').text = f"{item['impuesto']['valor']:.2f}"
        
        return ET.tostring(root, encoding='unicode')

    def generar_clave_acceso(self, fecha: datetime, tipo: str, ruc: str, ambiente: str, estab: str, pto: str, secuencial: str) -> str:
        """
        Genera la Clave de Acceso de 49 dígitos.
        Estructura: Fecha(8) + Tipo(2) + RUC(13) + Ambiente(1) + Serie(6) + Secuencial(9) + CodNum(8) + TipoEmision(1) + Digito(1)
        """
        fecha_str = fecha.strftime('%d%m%Y')
        
        # Generación aleatoria del código numérico (8 dígitos)
        import random
        codigo_numerico = f"{random.randint(0, 99999999):08d}"
        tipo_emision = "1" # Normal
        
        # Base de 48 dígitos
        base = f"{fecha_str}{tipo}{ruc}{ambiente}{estab}{pto}{secuencial}{codigo_numerico}{tipo_emision}"
        
        # Calcular dígito verificador
        digito = self.modulo11(base)
        
        return f"{base}{digito}"

    def modulo11(self, clave: str) -> int:
        reversed_digits = [int(d) for d in reversed(clave)]
        factor = 2
        suma = 0
        for d in reversed_digits:
            suma += d * factor
            factor = 2 if factor >= 7 else factor + 1
        
        residuo = suma % 11
        res = 11 - residuo
        
        if res == 11: return 0
        if res == 10: return 1
        return res

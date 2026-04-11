import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List
import random

from .constants import (
    SRIAmbiente, SRITipoEmision, SRICodigoDocumento, 
    SRICodigoImpuesto, SRITipoIdentificacion, SRI_TARIFAS_IVA
)
from .payment_strategies import FactoryPagosSRI
from ...utils.validators import validar_identificacion

class ServicioSRIXML:
    def _round(self, value, places=2):
        if not isinstance(value, Decimal):
            value = Decimal(str(value))
        return value.quantize(Decimal(f"1.{'0'*places}"), rounding=ROUND_HALF_UP)

    def generar_xml_factura(self, factura: dict, cliente: dict, empresa: dict, detalles: list, formas_pago: list, ambiente: str = SRIAmbiente.PRUEBAS, tipo_emision: str = SRITipoEmision.NORMAL) -> str:
        # Sanitizar ambiente para asegurar que sea numérico ("1" o "2")
        if str(ambiente).upper() == "PRUEBAS" or str(ambiente) == "1":
            ambiente = "1"
        elif str(ambiente).upper() == "PRODUCCION" or str(ambiente) == "2":
            ambiente = "2"
        else:
            ambiente = "1" # Default pruebas
            
        root = ET.Element('factura', id="comprobante", version="1.1.0")
        
        # Info Tributaria
        info_trib = ET.SubElement(root, 'infoTributaria')
        ET.SubElement(info_trib, 'ambiente').text = ambiente
        ET.SubElement(info_trib, 'tipoEmision').text = tipo_emision
        ET.SubElement(info_trib, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info_trib, 'nombreComercial').text = empresa.get('nombre_comercial') or empresa['razon_social']
        ET.SubElement(info_trib, 'ruc').text = empresa['ruc']
        
        # Preparar datos base
        f_emision = factura['fecha_emision']
        if isinstance(f_emision, str): f_emision = datetime.fromisoformat(f_emision)
        
        num_factura = factura.get('numero_factura', '001-001-000000001')
        parts = num_factura.split('-') if '-' in num_factura else ['001', '001', num_factura]
        estab = parts[0].zfill(3) if len(parts) > 0 else '001'
        pto_emi = parts[1].zfill(3) if len(parts) > 1 else '001'
        secuencial = parts[2].zfill(9) if len(parts) > 2 else num_factura.zfill(9)

        # Clave Acceso: Generación idempotente basada en el ID de la factura
        id_str = str(factura.get('id', '0')).replace('-', '')
        codigo_numerico = f"{int(id_str[-8:], 16) % 100000000:08d}"
        
        clave = self.generar_clave_acceso(f_emision, SRICodigoDocumento.FACTURA, empresa['ruc'], ambiente, estab, pto_emi, secuencial, tipo_emision, codigo_numerico)
        
        ET.SubElement(info_trib, 'claveAcceso').text = clave
        ET.SubElement(info_trib, 'codDoc').text = SRICodigoDocumento.FACTURA
        ET.SubElement(info_trib, 'estab').text = estab
        ET.SubElement(info_trib, 'ptoEmi').text = pto_emi
        ET.SubElement(info_trib, 'secuencial').text = secuencial
        ET.SubElement(info_trib, 'dirMatriz').text = empresa.get('direccion', 'S/N')
        
        # Agentes de Retención / Microempresas / RIMPE
        tipo_cont = str(empresa.get('tipo_contribuyente', '')).upper()
        if 'RIMPE' in tipo_cont or empresa.get('contribuyente_rimpe'):
             ET.SubElement(info_trib, 'contribuyenteRimpe').text = 'CONTRIBUYENTE RÉGIMEN RIMPE'
        
        if empresa.get('agente_retencion_num'):
            ET.SubElement(info_trib, 'agenteRetencion').text = str(empresa['agente_retencion_num'])

        # --- CÁLCULOS DE PRECISIÓN ---
        t_sin_impuestos = Decimal('0.00')
        t_descuentos = Decimal('0.00')
        impuestos_map = {}
        
        detalles_procesados = []
        
        for det in detalles:
            cantidad = self._round(det['cantidad'], 6)
            precio_u = self._round(det['precio_unitario'], 6)
            descuento = self._round(det.get('descuento', 0), 2)
            
            subtotal_bruto = cantidad * precio_u
            subtotal = subtotal_bruto - descuento
            subtotal = self._round(subtotal, 2)
            
            t_sin_impuestos += subtotal
            t_descuentos += descuento
            
            cod_sri = str(det.get('tipo_iva', SRICodigoImpuesto.IVA)) 
            porcentaje = SRI_TARIFAS_IVA.get(cod_sri, 12)
            
            valor_iva = Decimal('0.00')
            if porcentaje > 0:
                raw_iva = subtotal * (Decimal(porcentaje) / Decimal(100))
                valor_iva = self._round(raw_iva, 2)
                
            if cod_sri not in impuestos_map:
                impuestos_map[cod_sri] = {'base': Decimal('0.00'), 'valor': Decimal('0.00'), 'tarifa': porcentaje}
            impuestos_map[cod_sri]['base'] += subtotal
            impuestos_map[cod_sri]['valor'] += valor_iva
            
            detalles_procesados.append({
                'data': det,
                'cantidad': cantidad,
                'precioUnitario': precio_u,
                'descuento': descuento,
                'precioTotalSinImpuesto': subtotal,
                'impuesto': {
                    'codigo': SRICodigoImpuesto.IVA,
                    'codigoPorcentaje': cod_sri,
                    'tarifa': f"{porcentaje:.2f}",
                    'baseImponible': subtotal,
                    'valor': valor_iva
                }
            })

        t_propina = self._round(factura.get('propina', 0), 2)
        t_impuestos_total = sum(i['valor'] for i in impuestos_map.values())
        importe_total = t_sin_impuestos + t_impuestos_total + t_propina

        info_fac = ET.SubElement(root, 'infoFactura')
        ET.SubElement(info_fac, 'fechaEmision').text = f_emision.strftime('%d/%m/%Y')
        ET.SubElement(info_fac, 'dirEstablecimiento').text = empresa.get('direccion_sucursal') or empresa.get('direccion', 'S/N')
        
        if empresa.get('contribuyente_especial_num'):
            ET.SubElement(info_fac, 'contribuyenteEspecial').text = str(empresa['contribuyente_especial_num'])
            
        ET.SubElement(info_fac, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        tipo_id_raw = str(cliente.get('tipo_identificacion', '')).strip().upper()
        identificacion = str(cliente.get('identificacion', ''))
        
        if identificacion == '9999999999999': 
            tipo_id = SRITipoIdentificacion.CONSUMIDOR_FINAL
        elif tipo_id_raw in ['04', 'RUC']: 
            tipo_id = SRITipoIdentificacion.RUC
        elif tipo_id_raw in ['05', 'CEDULA']: 
            tipo_id = SRITipoIdentificacion.CEDULA
        elif tipo_id_raw in ['06', 'PASAPORTE']:
             tipo_id = SRITipoIdentificacion.PASAPORTE
        elif tipo_id_raw == '07':
             tipo_id = SRITipoIdentificacion.CONSUMIDOR_FINAL
        else: 
            tipo_id = SRITipoIdentificacion.ID_EXTERIOR 

        if tipo_id in [SRITipoIdentificacion.CEDULA, SRITipoIdentificacion.RUC]:
           if not self.validar_ruc_cedula(identificacion, tipo_id):
               raise ValueError(f"Identificación inválida según algoritmo SRI: {identificacion}") 
            
        ET.SubElement(info_fac, 'tipoIdentificacionComprador').text = tipo_id
        
        razon_comprador = "CONSUMIDOR FINAL" if identificacion == '9999999999999' else cliente['razon_social']
        ET.SubElement(info_fac, 'razonSocialComprador').text = razon_comprador
        ET.SubElement(info_fac, 'identificacionComprador').text = identificacion
        
        if cliente.get('direccion'):
            ET.SubElement(info_fac, 'direccionComprador').text = cliente['direccion']
        ET.SubElement(info_fac, 'totalSinImpuestos').text = f"{t_sin_impuestos:.2f}"
        ET.SubElement(info_fac, 'totalDescuento').text = f"{t_descuentos:.2f}"
        
        total_imp = ET.SubElement(info_fac, 'totalConImpuestos')
        for cod, data in impuestos_map.items():
            imp = ET.SubElement(total_imp, 'totalImpuesto')
            ET.SubElement(imp, 'codigo').text = SRICodigoImpuesto.IVA
            ET.SubElement(imp, 'codigoPorcentaje').text = str(cod)
            ET.SubElement(imp, 'baseImponible').text = f"{data['base']:.2f}"
            ET.SubElement(imp, 'valor').text = f"{data['valor']:.2f}"
        
        ET.SubElement(info_fac, 'propina').text = f"{t_propina:.2f}"
        ET.SubElement(info_fac, 'importeTotal').text = f"{importe_total:.2f}"
        ET.SubElement(info_fac, 'moneda').text = 'DOLAR'

        pagos_node = ET.SubElement(info_fac, 'pagos')
        if not formas_pago:
            formas_pago = [{'forma_pago_sri': '01', 'valor': importe_total}]
            
        for p in formas_pago:
            codigo_pago = str(p.get('forma_pago_sri', '01')).strip().zfill(2)
            valor_pago = Decimal(str(p.get('valor', importe_total)))
            
            p_val = p.get('plazo')
            u_val = p.get('unidad_tiempo')

            if codigo_pago == '01':
                p_val = None
                u_val = None

            if (p_val is None or p_val == 0) and factura.get('fecha_vencimiento'):
                f_venc = factura.get('fecha_vencimiento')
                try:
                    if isinstance(f_venc, str): f_venc = datetime.fromisoformat(f_venc)
                    d_venc = f_venc.date() if hasattr(f_venc, 'date') else f_venc
                    d_emis = f_emision.date() if hasattr(f_emision, 'date') else f_emision
                    p_val = (d_venc - d_emis).days
                    if p_val < 0: p_val = 0
                    u_val = 'DIAS'
                except:
                    p_val = 0
                    u_val = 'DIAS'

            if u_val:
                u_val = u_val.upper()

            estrategia = FactoryPagosSRI.obtener_estrategia(codigo_pago)
            estrategia.generar_nodo(pagos_node, valor_pago, plazo=p_val, unidad_tiempo=u_val)

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
        
        if cliente.get('email'):
            info_adi = ET.SubElement(root, 'infoAdicional')
            campo = ET.SubElement(info_adi, 'campoAdicional', nombre="Email")
            campo.text = cliente['email']
        
        return ET.tostring(root, encoding='unicode')

    def generar_clave_acceso(self, fecha: datetime, tipo: str, ruc: str, ambiente: str, estab: str, pto: str, secuencial: str, tipo_emision: str = "1", codigo_numerico: str = None) -> str:
        fecha_str = fecha.strftime('%d%m%Y')
        if not codigo_numerico:
            codigo_numerico = f"{random.randint(0, 99999999):08d}"
        
        # Base de 48 dígitos (Aseguramos que no haya letras en campos críticos)
        # Sanitización de emergencia para ruc/estab/pto/secuencial
        import re
        ruc_clean = re.sub(r'[^0-9]', '', str(ruc))
        base = f"{fecha_str}{tipo}{ruc_clean}{ambiente}{estab}{pto}{secuencial}{codigo_numerico}{tipo_emision}"
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

    def validar_ruc_cedula(self, identificacion: str, tipo: str) -> bool:
        return validar_identificacion(identificacion)

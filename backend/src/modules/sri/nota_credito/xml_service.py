import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
from ..xml_service import ServicioSRIXML
from ..constants import (
    SRIAmbiente, SRITipoEmision, SRICodigoDocumento, 
    SRICodigoImpuesto, SRITipoIdentificacion, SRI_TARIFAS_IVA
)

class ServicioSRIXMLNotaCredito(ServicioSRIXML):
    """
    MODULO: NOTA CREDITO (XML)
    Extensión modular para generar XMLs tipo 04.
    """

    def generar_xml_nota_credito(
        self, 
        nota_credito: dict, 
        cliente: dict, 
        empresa: dict, 
        detalles: list, 
        ambiente: str = SRIAmbiente.PRUEBAS, 
        tipo_emision: str = SRITipoEmision.NORMAL
    ) -> str:
        # Sanitizar ambiente
        if str(ambiente).upper() == "PRUEBAS" or str(ambiente) == "1":
            ambiente = "1"
        elif str(ambiente).upper() == "PRODUCCION" or str(ambiente) == "2":
            ambiente = "2"
        else:
            ambiente = "1"
            
        root = ET.Element('notaCredito', id="comprobante", version="1.0.0")
        
        # 1. infoTributaria
        info_trib = ET.SubElement(root, 'infoTributaria')
        ET.SubElement(info_trib, 'ambiente').text = ambiente
        ET.SubElement(info_trib, 'tipoEmision').text = tipo_emision
        ET.SubElement(info_trib, 'razonSocial').text = empresa['razon_social']
        ET.SubElement(info_trib, 'nombreComercial').text = empresa.get('nombre_comercial') or empresa['razon_social']
        ET.SubElement(info_trib, 'ruc').text = empresa['ruc']
        
        f_emision_nc = nota_credito['fecha_emision']
        if isinstance(f_emision_nc, str): f_emision_nc = datetime.fromisoformat(f_emision_nc)
        
        f_emision_fac = nota_credito['fecha_emision_docs_modificado']
        if isinstance(f_emision_fac, str): f_emision_fac = datetime.fromisoformat(f_emision_fac)

        estab = nota_credito['establecimiento']
        pto_emi = nota_credito['punto_emision']
        secuencial = nota_credito['secuencial']

        id_str = str(nota_credito.get('id', '0')).replace('-', '')
        codigo_numerico = f"{int(id_str[-8:], 16) % 100000000:08d}"
        
        clave = self.generar_clave_acceso(
            f_emision_nc, SRICodigoDocumento.NOTA_CREDITO, 
            empresa['ruc'], ambiente, estab, pto_emi, secuencial, 
            tipo_emision, codigo_numerico
        )
        
        ET.SubElement(info_trib, 'claveAcceso').text = clave
        ET.SubElement(info_trib, 'codDoc').text = SRICodigoDocumento.NOTA_CREDITO
        ET.SubElement(info_trib, 'estab').text = estab
        ET.SubElement(info_trib, 'ptoEmi').text = pto_emi
        ET.SubElement(info_trib, 'secuencial').text = secuencial
        ET.SubElement(info_trib, 'dirMatriz').text = empresa.get('direccion', 'S/N')
        
        tipo_cont = str(empresa.get('tipo_contribuyente', '')).upper()
        if 'RIMPE' in tipo_cont or empresa.get('contribuyente_rimpe'):
             ET.SubElement(info_trib, 'contribuyenteRimpe').text = 'CONTRIBUYENTE RÉGIMEN RIMPE'
        
        if empresa.get('agente_retencion_num'):
            ET.SubElement(info_trib, 'agenteRetencion').text = str(empresa['agente_retencion_num'])

        # 2. infoNotaCredito
        info_nc = ET.SubElement(root, 'infoNotaCredito')
        ET.SubElement(info_nc, 'fechaEmision').text = f_emision_nc.strftime('%d/%m/%Y')
        ET.SubElement(info_nc, 'dirEstablecimiento').text = empresa.get('direccion_sucursal') or empresa.get('direccion', 'S/N')
        
        tipo_id_raw = str(cliente.get('tipo_identificacion', '')).strip().upper()
        identificacion = str(cliente.get('identificacion', ''))
        
        if identificacion == '9999999999999': tipo_id = SRITipoIdentificacion.CONSUMIDOR_FINAL
        elif tipo_id_raw in ['04', 'RUC']: tipo_id = SRITipoIdentificacion.RUC
        elif tipo_id_raw in ['05', 'CEDULA']: tipo_id = SRITipoIdentificacion.CEDULA
        else: tipo_id = SRITipoIdentificacion.PASAPORTE 

        ET.SubElement(info_nc, 'tipoIdentificacionComprador').text = tipo_id
        ET.SubElement(info_nc, 'razonSocialComprador').text = cliente['razon_social']
        ET.SubElement(info_nc, 'identificacionComprador').text = identificacion
        
        if empresa.get('contribuyente_especial_num'):
            ET.SubElement(info_nc, 'contribuyenteEspecial').text = str(empresa['contribuyente_especial_num'])
        ET.SubElement(info_nc, 'obligadoContabilidad').text = 'SI' if empresa.get('obligado_contabilidad') else 'NO'
        
        ET.SubElement(info_nc, 'codDocModificado').text = nota_credito['cod_doc_modificado']
        ET.SubElement(info_nc, 'numDocModificado').text = nota_credito['num_doc_modificado']
        ET.SubElement(info_nc, 'fechaEmisionDocSustento').text = f_emision_fac.strftime('%d/%m/%Y')
        ET.SubElement(info_nc, 'totalSinImpuestos').text = f"{self._round(nota_credito['subtotal_15_iva'] + nota_credito['subtotal_0_iva'], 2):.2f}"
        ET.SubElement(info_nc, 'valorModificacion').text = f"{self._round(nota_credito['valor_total_anulado'], 2):.2f}"
        ET.SubElement(info_nc, 'moneda').text = 'DOLAR'

        total_imp = ET.SubElement(info_nc, 'totalConImpuestos')
        if nota_credito['subtotal_15_iva'] > 0:
            imp15 = ET.SubElement(total_imp, 'totalImpuesto')
            ET.SubElement(imp15, 'codigo').text = SRICodigoImpuesto.IVA
            ET.SubElement(imp15, 'codigoPorcentaje').text = '4'
            ET.SubElement(imp15, 'baseImponible').text = f"{self._round(nota_credito['subtotal_15_iva'], 2):.2f}"
            ET.SubElement(imp15, 'valor').text = f"{self._round(nota_credito['iva_total'], 2):.2f}"
            
        if nota_credito['subtotal_0_iva'] > 0:
            imp0 = ET.SubElement(total_imp, 'totalImpuesto')
            ET.SubElement(imp0, 'codigo').text = SRICodigoImpuesto.IVA
            ET.SubElement(imp0, 'codigoPorcentaje').text = '0'
            ET.SubElement(imp0, 'baseImponible').text = f"{self._round(nota_credito['subtotal_0_iva'], 2):.2f}"
            ET.SubElement(imp0, 'valor').text = "0.00"

        ET.SubElement(info_nc, 'motivo').text = nota_credito['motivo_anulacion']

        # 3. Detalles
        detalles_node = ET.SubElement(root, 'detalles')
        for det in detalles:
            d = ET.SubElement(detalles_node, 'detalle')
            ET.SubElement(d, 'codigoInterno').text = det['codigo_producto']
            ET.SubElement(d, 'descripcion').text = det['nombre']
            ET.SubElement(d, 'cantidad').text = f"{self._round(det['cantidad'], 6):.6f}"
            ET.SubElement(d, 'precioUnitario').text = f"{self._round(det['precio_unitario'], 6):.6f}"
            ET.SubElement(d, 'descuento').text = f"{self._round(det.get('descuento', 0), 2):.2f}"
            ET.SubElement(d, 'precioTotalSinImpuesto').text = f"{self._round(det['subtotal'], 2):.2f}"
            
            imps = ET.SubElement(d, 'impuestos')
            im = ET.SubElement(imps, 'impuesto')
            ET.SubElement(im, 'codigo').text = SRICodigoImpuesto.IVA
            
            tarifa = '4' if det['valor_iva'] > 0 else '0'
            ET.SubElement(im, 'codigoPorcentaje').text = tarifa 
            ET.SubElement(im, 'tarifa').text = '15.00' if tarifa == '4' else '0.00'
            ET.SubElement(im, 'baseImponible').text = f"{self._round(det['subtotal'], 2):.2f}"
            ET.SubElement(im, 'valor').text = f"{self._round(det['valor_iva'], 2):.2f}"

        if cliente.get('email'):
            info_adi = ET.SubElement(root, 'infoAdicional')
            campo = ET.SubElement(info_adi, 'campoAdicional', nombre="Email")
            campo.text = cliente['email']
        
        return ET.tostring(root, encoding='unicode')

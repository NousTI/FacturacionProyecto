import { AutorizacionSRI } from './factura.model';

export interface NotaCreditoDetalle {
    id: string;
    nota_credito_id: string;
    codigo_producto: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    valor_iva: number;
    created_at?: string;
}

export interface NotaCredito {
    id: string;
    factura_id: string;
    establecimiento: string;
    punto_emision: string;
    secuencial: string;
    numero_nota_credito?: string; // Formato NNN-NNN-NNNNNNNNN
    
    // Info SRI
    clave_acceso?: string;
    numero_autorizacion?: string;
    cod_doc_modificado: string;
    num_doc_modificado: string;
    fecha_emision_docs_modificado: string;
    motivo_anulacion: string;
    
    // Totales
    subtotal_15_iva: number;
    subtotal_0_iva: number;
    iva_total: number;
    valor_total_anulado: number;
    
    estado_sri: 'BORRADOR' | 'EN_PROCESO' | 'AUTORIZADO' | 'DEVUELTO' | 'NO_AUTORIZADO' | 'ERROR_TECNICO';
    
    fecha_emision: string;
    autorizacion?: AutorizacionSRI;
    detalles?: NotaCreditoDetalle[];
    
    created_at: string;
    updated_at: string;
}

export interface ResultadoEmisionNC {
    nota_credito: NotaCredito;
    resultado_sri: {
        estado: string;
        numeroAutorizacion?: string;
        fechaAutorizacion?: string;
        mensajes?: string[];
        codigos?: string[];
        xml_respuesta_raw?: string;
    };
}

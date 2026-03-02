
export interface FacturaDetalle {
    id: string;
    factura_id: string;
    producto_id?: string;
    codigo_producto: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    tipo_iva: string; // '0', '2', '3' (tarifa)
    valor_iva: number;
    costo_unitario?: number;
    created_at?: string;
    updated_at?: string;
}

export interface FacturaDetalleCreacion {
    producto_id?: string;
    codigo_producto: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    tipo_iva: string;
    costo_unitario?: number;
}

export interface AutorizacionSRI {
    id: string;
    numero_autorizacion: string;
    fecha_autorizacion: string;
    estado: string;
    mensajes?: any;
    xml_enviado?: string;
    xml_respuesta?: string;
}

export interface Factura {
    id: string;
    empresa_id: string;
    usuario_id: string;
    establecimiento_id: string;
    punto_emision_id: string;
    cliente_id: string;
    facturacion_programada_id?: string;

    numero_factura: string;
    secuencial_punto_emision: number;

    // SRI
    clave_acceso?: string;
    numero_autorizacion?: string;
    tipo_documento: string; // '01'
    ambiente: number; // 1=Prueba, 2=Prod
    tipo_emision: number; // 1=Normal
    forma_pago_sri: string; // '01', etc
    plazo?: number;
    unidad_tiempo?: 'DIAS' | 'MESES' | 'ANIOS';

    estado: 'BORRADOR' | 'EN_PROCESO' | 'AUTORIZADA' | 'DEVUELTA' | 'NO_AUTORIZADA' | 'RECHAZADA' | 'ANULADA' | 'ERROR_TECNICO';
    estado_pago: 'PENDIENTE' | 'PAGADO' | 'PARCIAL' | 'VENCIDO';
    razon_anulacion?: string;

    fecha_emision: string; // YYYY-MM-DD
    fecha_vencimiento?: string;
    fecha_autorizacion?: string;

    // Montos
    subtotal_sin_iva: number;
    subtotal_con_iva: number;
    iva: number;
    descuento: number;
    propina: number;
    retencion_iva: number;
    retencion_renta: number;
    total: number;

    origen?: string;
    observaciones?: string;

    // Snapshots (simplificado, typo any para detalle completo si se necesita)
    snapshot_empresa?: any;
    snapshot_cliente?: any;
    snapshot_establecimiento?: any;
    snapshot_punto_emision?: any;
    snapshot_usuario?: any;

    autorizacion?: AutorizacionSRI;

    created_at: string;
    updated_at: string;
}

export interface FacturaCreacion {
    cliente_id: string;
    establecimiento_id: string;
    punto_emision_id: string;
    facturacion_programada_id?: string;

    tipo_documento?: string;
    ambiente?: number;
    tipo_emision?: number;
    forma_pago_sri?: string;
    plazo?: number;
    unidad_tiempo?: 'DIAS' | 'MESES' | 'ANIOS';

    fecha_emision: string;
    fecha_vencimiento?: string;

    subtotal_sin_iva?: number;
    subtotal_con_iva?: number;
    iva?: number;
    descuento?: number;
    propina?: number;
    retencion_iva?: number;
    retencion_renta?: number;
    total: number;

    origen?: string; // MANUAL
    observaciones?: string;
}

export interface FacturaResumen {
    id: string;
    numero_factura: string;
    cliente_razon_social: string;
    fecha_emision: string;
    total: number;
    estado: string;
    estado_pago: string;
    clave_acceso?: string;
    created_at: string;
}

export interface FacturaListadoFiltros {
    estado?: string;
    estado_pago?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente_id?: string;
    establecimiento_id?: string;
    punto_emision_id?: string;
    solo_propias?: boolean;
    page: number;
    page_size: number;
}

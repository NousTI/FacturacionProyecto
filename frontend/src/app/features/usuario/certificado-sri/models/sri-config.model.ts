export interface ConfigSRI {
    id: string;
    empresa_id: string;
    ambiente: 'PRUEBAS' | 'PRODUCCION';
    tipo_emision: 'NORMAL' | 'CONTINGENCIA';
    fecha_activacion_cert: string;
    fecha_expiracion_cert: string;
    cert_serial?: string;
    cert_sujeto?: string;
    cert_emisor?: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'EXPIRADO' | 'REVOCADO';
    created_at: string;
    updated_at: string;
}

export interface ActualizarParametrosSRI {
    ambiente: 'PRUEBAS' | 'PRODUCCION';
    tipo_emision: 'NORMAL' | 'CONTINGENCIA';
}

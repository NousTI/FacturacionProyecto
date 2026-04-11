export interface Empresa {
    facturas_mes_count: number;
    facturas_consumidas: number;
    usuarios_count: number;
    // Identidad
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial: string | null;
    email: string;
    telefono: string | null;
    direccion: string;
    logo_url: string | null;
    activo: boolean;

    // SRI y Contabilidad
    tipo_persona: 'NATURAL' | 'JURIDICA';
    tipo_contribuyente: 'REGIMEN_GENERAL' | 'RIMPE_EMPRENDEDOR' | 'RIMPE_POPULAR';
    obligado_contabilidad: boolean;

    // Suscripción y Vendedor
    vendedor_id: string | null;
    vendedor_name: string | null;
    plan_nombre: string | null;
    current_plan_id: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    suscripcion_estado: 'active' | 'inactive' | 'trial' | 'past_due' | string | null;

    // Límites Operativos del Plan
    max_usuarios: number | null;
    max_facturas_mes: number | null;
    max_establecimientos: number | null;
    max_programaciones: number | null;

    // Info Técnica SRI y Firma (Consolidado)
    sri_ambiente: string | null;
    sri_estado: string | null;
    firma_expiracion: string | null;
    firma_emisor: string | null;

    // Infraestructura Real (Conteo actual)
    establecimientos_count: number;
    puntos_emision_count: number;

    // Historial de Pago
    ultimo_pago_fecha: string | null;
    ultimo_pago_monto: number | null;

    // Auditoría
    created_at: string;
    updated_at: string;
}

/**
 * Plantilla de datos iniciales para evitar errores de referencia nula
 */
export const EMPRESA_TEMPLATE: Partial<Empresa> = {
    razon_social: '',
    ruc: '',
    email: '',
    direccion: '',
    tipo_persona: 'NATURAL',
    tipo_contribuyente: 'REGIMEN_GENERAL',
    obligado_contabilidad: false,
    activo: true,
    plan_nombre: 'Cargando...',
    max_usuarios: 0,
    max_facturas_mes: 0,
    max_establecimientos: 0,
    establecimientos_count: 0,
    puntos_emision_count: 0,
    usuarios_count: 0,
    facturas_mes_count: 0,
    facturas_consumidas: 0
};

export interface EmpresaCreate {
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    email: string;
    telefono?: string;
    direccion: string;
    logo_url?: string;
    activo?: boolean;
    tipo_persona: 'NATURAL' | 'JURIDICA';
    tipo_contribuyente: 'REGIMEN_GENERAL' | 'RIMPE_EMPRENDEDOR' | 'RIMPE_POPULAR';
    obligado_contabilidad?: boolean;
    vendedor_id?: string;
}

export interface EmpresaUpdate {
    ruc?: string;
    razon_social?: string;
    nombre_comercial?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    logo_url?: string;
    activo?: boolean;
    tipo_persona?: 'NATURAL' | 'JURIDICA';
    tipo_contribuyente?: 'REGIMEN_GENERAL' | 'RIMPE_EMPRENDEDOR' | 'RIMPE_POPULAR';
    obligado_contabilidad?: boolean;
    vendedor_id?: string;
}

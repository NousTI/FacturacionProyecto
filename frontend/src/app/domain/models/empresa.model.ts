export interface Empresa {
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    email: string;
    telefono?: string;
    direccion: string;
    logo_url?: string;
    activo: boolean;
    tipo_contribuyente: string;
    obligado_contabilidad: boolean;
    vendedor_id?: string;
    vendedor_name?: string;
    created_at: string;
    updated_at: string;
}

export interface EmpresaCreate {
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    email: string;
    telefono?: string;
    direccion: string;
    logo_url?: string;
    activo?: boolean;
    tipo_contribuyente: string;
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
    tipo_contribuyente?: string;
    obligado_contabilidad?: boolean;
    vendedor_id?: string;
}

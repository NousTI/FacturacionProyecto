export interface Vendedor {
    id: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    documento_identidad?: string;
    porcentaje_comision?: number;
    porcentaje_comision_inicial?: number;
    porcentaje_comision_recurrente?: number;
    tipo_comision?: string;
    puede_crear_empresas: boolean;
    puede_gestionar_planes: boolean;
    puede_acceder_empresas: boolean;
    puede_ver_reportes: boolean;
    activo: boolean;
    configuracion?: any;
    fecha_registro?: string;
    created_at?: string;
    updated_at?: string;
    ultimo_acceso?: string;
}

export interface VendedorCreate {
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    telefono?: string;
    documento_identidad?: string;
    porcentaje_comision?: number;
    porcentaje_comision_inicial?: number;
    porcentaje_comision_recurrente?: number;
    tipo_comision?: string;
    puede_crear_empresas?: boolean;
    puede_gestionar_planes?: boolean;
    puede_acceder_empresas?: boolean;
    puede_ver_reportes?: boolean;
    activo?: boolean;
    configuracion?: any;
}

export interface VendedorUpdate {
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    documento_identidad?: string;
    porcentaje_comision?: number;
    porcentaje_comision_inicial?: number;
    porcentaje_comision_recurrente?: number;
    tipo_comision?: string;
    puede_crear_empresas?: boolean;
    puede_gestionar_planes?: boolean;
    puede_acceder_empresas?: boolean;
    puede_ver_reportes?: boolean;
    activo?: boolean;
    configuracion?: any;
}

export interface VendedorStats {
    total: number;
    activos: number;
    inactivos: number;
    empresas_totales: number;
    ingresos_generados: number;
}

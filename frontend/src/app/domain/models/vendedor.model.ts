export interface Vendedor {
    id: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    tipoIdentificacion?: string;
    documentoIdentidad?: string;
    porcentajeComision?: number;
    porcentajeComisionInicial?: number;
    porcentajeComisionRecurrente?: number;
    tipoComision?: string;
    puedeCrearEmpresas: boolean;
    puedeGestionarPlanes: boolean;
    puedeAccederEmpresas: boolean;
    puedeVerReportes: boolean;
    activo: boolean;
    configuracion?: any;
    fechaRegistro?: string;
    createdAt?: string;
    updatedAt?: string;
    ultimoAcceso?: string;
}

export interface VendedorCreate {
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    tipoIdentificacion?: string;
    telefono?: string;
    documentoIdentidad?: string;
    porcentajeComision?: number;
    porcentajeComisionInicial?: number;
    porcentajeComisionRecurrente?: number;
    tipoComision?: string;
    puedeCrearEmpresas?: boolean;
    puedeGestionarPlanes?: boolean;
    puedeAccederEmpresas?: boolean;
    puedeVerReportes?: boolean;
    activo?: boolean;
    configuracion?: any;
}

export interface VendedorUpdate {
    nombres?: string;
    apellidos?: string;
    tipoIdentificacion?: string;
    telefono?: string;
    documentoIdentidad?: string;
    porcentajeComision?: number;
    porcentajeComisionInicial?: number;
    porcentajeComisionRecurrente?: number;
    tipoComision?: string;
    puedeCrearEmpresas?: boolean;
    puedeGestionarPlanes?: boolean;
    puedeAccederEmpresas?: boolean;
    puedeVerReportes?: boolean;
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

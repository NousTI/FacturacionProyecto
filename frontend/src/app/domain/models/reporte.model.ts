


export interface Reporte {
    id: string;
    nombre: string;
    tipo: string;
    parametros?: any;
    url_descarga?: string;
    estado: string;
    created_at: string;
    updated_at: string;
}

export interface ReporteCreacion {
    nombre: string;
    tipo: string;
    parametros?: any;
}

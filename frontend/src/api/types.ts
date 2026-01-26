export interface ApiResponse<T = any> {
    ok: boolean;
    mensaje: string;
    codigo: string;
    detalles: T;
    timestamp: string;
}

export interface ApiError {
    codigo: string;
    mensaje: string;
    detalle?: any;
    status: number;
}

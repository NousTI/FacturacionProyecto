export interface ApiResponse<T> {
    ok: boolean;
    mensaje: string;
    codigo: string;
    detalles: T;
    timestamp: string;
}

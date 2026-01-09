import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// TODO: Move to environment
const API_URL = 'http://localhost:8000/api';

export interface Comision {
    id: string;
    vendedor_id: string;
    pago_suscripcion_id: string;
    monto: number;
    porcentaje_aplicado: number;
    estado: string;
    fecha_generacion: string;
    fecha_pago?: string;
    metodo_pago?: string;
    observaciones?: string;
    vendedor_nombre?: string;
    empresa_nombre?: string;
    monto_pago?: number;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ComisionService {
    private http = inject(HttpClient);

    getComisiones(): Observable<Comision[]> {
        return this.http.get<Comision[]>(`${API_URL}/comisiones/`);
    }

    getComision(id: string): Observable<Comision> {
        return this.http.get<Comision>(`${API_URL}/comisiones/${id}`);
    }

    updateComision(id: string, data: Partial<Comision>): Observable<Comision> {
        return this.http.put<Comision>(`${API_URL}/comisiones/${id}`, data);
    }

    deleteComision(id: string): Observable<any> {
        return this.http.delete(`${API_URL}/comisiones/${id}`);
    }
}

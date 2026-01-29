import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface Suscripcion {
    id: string;
    empresa_id: string;
    plan_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'ACTIVA' | 'CANCELADA' | 'SUSPENDIDA' | 'VENCIDA';
    created_at: string;
    updated_at: string;
    // Annotated fields from potential joins/view models
    empresa_nombre?: string; // We might need to fetch this or it comes joined
    plan_nombre?: string;
    precio_plan?: number;
}

export interface PagoHistorico {
    id: string;
    empresa_id: string;
    razon_social: string;
    plan_nombre: string;
    monto: number;
    fecha_pago: string;
    numero_comprobante?: string;
    metodo_pago: string;
}

export interface PagoQuick {
    empresa_id: string;
    plan_id: string;
    metodo_pago: string;
    monto: number;
    fecha_inicio_periodo?: string; // YYYY-MM-DD
    fecha_fin_periodo?: string; // YYYY-MM-DD
    numero_comprobante?: string;
}

export interface SuscripcionStats {
    total_mrr: number;
    suscripciones_activas: number;
    suscripciones_vencidas: number; // Inferred or added if backend supports
    proyeccion_cobros: number;
}

@Injectable({
    providedIn: 'root'
})
export class SuscripcionService {
    private apiUrl = `${environment.apiUrl}/suscripciones`;

    constructor(private http: HttpClient) { }

    // --- Suscripciones ---
    // Note: Backend currently doesn't have a direct "list all subscriptions with details" endpoint 
    // that joins everything. We might need to use /empresas to get companies and their subscriptions, 
    // or I might need to ask the user to add one. For now I will assume I can filter/list them.
    // Actually, looking at the backend routes, there isn't a "get all subscriptions". 
    // There is /planes/{id}/empresas and /planes. 
    // I will check if there is an existing service or if I need to do a workaround. 
    // WORKAROUND: Get all planes -> For each plan get companies -> flatten list.

    getPlanes(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/planes`).pipe(
            map(res => res.detalles || [])
        );
    }

    getEmpresasPorPlan(planId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/planes/${planId}/empresas`).pipe(
            map(res => res.detalles || [])
        );
    }

    // --- Pagos ---
    getPagos(empresaId?: string): Observable<PagoHistorico[]> {
        let url = `${this.apiUrl}/pagos`;
        if (empresaId) {
            url += `?empresa_id=${empresaId}`;
        }
        return this.http.get<any>(url).pipe(
            map(res => res.detalles || [])
        );
    }

    registrarPago(data: PagoQuick): Observable<any> {
        return this.http.post(`${this.apiUrl}/pagos/rapido`, data);
    }

    // --- Lifecycle ---
    activarSuscripcion(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/activar`, data);
    }

    cancelarSuscripcion(empresaId: string, observaciones: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${empresaId}/cancelar`, null, { params: { observaciones } });
    }

    suspenderSuscripcion(empresaId: string, observaciones: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${empresaId}/suspender`, null, { params: { observaciones } });
    }

    verificarVencimientos(): Observable<any> {
        return this.http.post(`${this.apiUrl}/verificar-vencimientos`, {});
    }

    getHistorialCambios(empresaId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/${empresaId}/historial`).pipe(
            map(res => res.detalles || [])
        );
    }
}

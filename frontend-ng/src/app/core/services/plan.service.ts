import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Plan {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio_mensual: number;
    max_usuarios: number;
    max_facturas_mes: number;
    max_establecimientos: number;
    max_programaciones: number;
    caracteristicas?: { nombre: string; descripcion: string }[];
    visible_publico: boolean;
    activo: boolean;
    orden?: number;
}

export type PlanCreate = Omit<Plan, 'id'>;
export type PlanUpdate = Partial<PlanCreate>;

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8000/api/planes';

    getPlanes(): Observable<Plan[]> {
        return this.http.get<Plan[]>(this.apiUrl);
    }

    getCompaniesByPlan(planId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${planId}/companies`);
    }

    createPlan(plan: PlanCreate): Observable<Plan> {
        return this.http.post<Plan>(this.apiUrl, plan);
    }

    updatePlan(id: string, plan: PlanUpdate): Observable<Plan> {
        return this.http.put<Plan>(`${this.apiUrl}/${id}`, plan);
    }

    reorderPlans(updates: { id: string, orden: number }[]): Observable<any> {
        return this.http.put(`${this.apiUrl}/reorder`, updates);
    }

    deletePlan(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

// frontend-ng/src/app/core/services/modulo.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Modulo {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    activo: boolean;
}

import { AppConfig } from '../config/app.config';

@Injectable({
    providedIn: 'root'
})
export class ModuloService {
    private http = inject(HttpClient);
    private apiUrl = `${AppConfig.apiUrl}/modulos`;

    getModulos(): Observable<Modulo[]> {
        return this.http.get<Modulo[]>(this.apiUrl);
    }

    getModulosByPlan(planId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/plans/${planId}`);
    }

    assignModuloToPlan(planId: string, moduloId: string, incluido: boolean): Observable<any> {
        return this.http.post(`${this.apiUrl}/plans/${planId}/assign`, {
            modulo_id: moduloId,
            incluido: incluido
        });
    }

    removeModuloFromPlan(planId: string, moduloId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/plans/${planId}/modulos/${moduloId}`);
    }
}

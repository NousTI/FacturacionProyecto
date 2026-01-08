import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Plan {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    precio_mensual: number;
    max_usuarios: number;
    max_facturas_mes: number;
    caracteristicas: any;
    visible_publico: boolean;
    activo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8000/api/planes';

    getPlanes(): Observable<Plan[]> {
        return this.http.get<Plan[]>(this.apiUrl);
    }
}

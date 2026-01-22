import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EmpresaStats {
    total: number;
    activas: number;
    inactivas: number;
}

@Injectable({
    providedIn: 'root'
})
export class EmpresaService {
    private apiUrl = `${environment.apiUrl}/empresas`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<EmpresaStats> {
        return this.http.get<EmpresaStats>(`${this.apiUrl}/stats`);
    }

    getEmpresas(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    createEmpresa(data: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, data);
    }

    toggleActive(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, {});
    }

    changePlan(empresaId: string, planId: string, monto: number = 0, observaciones: string = ''): Observable<any> {
        return this.http.post(`${this.apiUrl}/${empresaId}/change-plan`, {
            plan_id: planId,
            monto,
            observaciones
        });
    }

    assignVendor(empresaId: string, vendedorId: string | null): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${empresaId}/assign-vendor`, { vendedor_id: vendedorId });
    }

    getVendedores(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/vendedores`);
    }

    getPlanes(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/suscripciones/planes`);
    }
}

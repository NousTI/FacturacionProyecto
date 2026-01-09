
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Empresa {
    id: string;
    vendedor_id?: string;
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
    email?: string;
    email_contacto?: string; // Frontend alias or mismatch
    telefono?: string;
    direccion?: string;
    logo_url?: string;
    activo: boolean;
    estado_suscripcion: string;
    tipo_contribuyente?: string;
    obligado_contabilidad: boolean;
    fecha_registro: string;
    fecha_activacion?: string;
    fecha_vencimiento?: string;
    created_at?: string;
    updated_at?: string;
    plan?: string;
    plan_id?: string;
    fecha_inicio_plan?: string;
    fecha_fin_plan?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmpresaService {
    private http = inject(HttpClient);
    // private apiUrl = `${environment.apiUrl}/empresas`; // Assuming environment
    // Hardcoding for now based on AuthService usage of API_URL constant if available, or relative.
    // AuthService uses const API_URL = 'http://localhost:8000/api'; 
    // Better to declare it here too or import.
    private apiUrl = 'http://localhost:8000/api/empresas';

    private empresasCache: Empresa[] | null = null;

    getEmpresas(vendedorId?: string, forceReload: boolean = false): Observable<Empresa[]> {
        if (this.empresasCache && !forceReload && !vendedorId) {
            return new Observable(observer => {
                observer.next(this.empresasCache!);
                observer.complete();
            });
        }

        let params = new HttpParams();
        if (vendedorId) {
            params = params.set('vendedor_id', vendedorId);
        }
        return this.http.get<Empresa[]>(this.apiUrl, { params }).pipe(
            map(empresas => {
                if (!vendedorId) this.empresasCache = empresas;
                return empresas;
            })
        );
    }

    clearCache() {
        this.empresasCache = null;
    }

    createEmpresa(data: Partial<Empresa>): Observable<Empresa> {
        return this.http.post<Empresa>(this.apiUrl, data);
    }

    updateEmpresa(id: string, data: Partial<Empresa>): Observable<Empresa> {
        return this.http.put<Empresa>(`${this.apiUrl}/${id}`, data);
    }

    toggleActive(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, {});
    }

    assignVendor(id: string, vendedorId: string | null): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/assign-vendor`, { vendedor_id: vendedorId });
    }

    deleteEmpresa(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    changePlan(id: string, planId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/change-plan`, { plan_id: planId });
    }
}

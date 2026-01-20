import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// TODO: Move to environment
import { AppConfig } from '../config/app.config';

const API_URL = AppConfig.apiUrl;

export interface Vendedor {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    documento_identidad?: string;
    porcentaje_comision?: number;
    porcentaje_comision_inicial?: number;
    porcentaje_comision_recurrente?: number;
    tipo_comision?: string;
    puede_crear_empresas: boolean;
    puede_gestionar_planes: boolean;
    puede_ver_reportes: boolean;
    activo: boolean;
    last_login?: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorService {
    private http = inject(HttpClient);

    getVendedores(): Observable<Vendedor[]> {
        return this.http.get<Vendedor[]>(`${API_URL}/vendedores/`);
    }

    getVendedor(id: string): Observable<Vendedor> {
        return this.http.get<Vendedor>(`${API_URL}/vendedores/${id}`);
    }

    createVendedor(vendedor: Partial<Vendedor> & { password?: string }): Observable<Vendedor> {
        return this.http.post<Vendedor>(`${API_URL}/vendedores/`, vendedor);
    }

    updateVendedor(id: string, vendedor: Partial<Vendedor> & { password?: string }): Observable<Vendedor> {
        return this.http.put<Vendedor>(`${API_URL}/vendedores/${id}`, vendedor);
    }

    deleteVendedor(id: string): Observable<any> {
        return this.http.delete(`${API_URL}/vendedores/${id}`);
    }
}

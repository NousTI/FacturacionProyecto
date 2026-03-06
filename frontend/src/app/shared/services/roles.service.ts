import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    modulo: string;
    descripcion: string;
    tipo: string;
    selected?: boolean; // UI helper
}

export interface Rol {
    id: string;
    nombre: string;
    codigo: string;
    descripcion?: string;
    empresa_id: string;
    es_sistema: boolean;
    activo: boolean;
    num_usuarios?: number;
    permisos?: Permiso[];
}

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private apiUrl = `${environment.apiUrl}/roles`;

    constructor(private http: HttpClient) { }

    listarRoles(empresaId?: string): Observable<Rol[]> {
        let url = this.apiUrl;
        if (empresaId) url += `?empresa_id=${empresaId}`;

        return this.http.get<any>(url).pipe(
            map(res => res.detalles || [])
        );
    }

    obtenerRol(id: string): Observable<Rol> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(res => res.detalles)
        );
    }

    crearRol(data: Partial<Rol> & { permiso_ids?: string[] }): Observable<Rol> {
        return this.http.post<any>(this.apiUrl, data).pipe(
            map(res => res.detalles)
        );
    }

    actualizarRol(id: string, data: Partial<Rol> & { permiso_ids?: string[] }): Observable<Rol> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
            map(res => res.detalles)
        );
    }

    eliminarRol(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    listarPermisosCatalogo(): Observable<Permiso[]> {
        return this.http.get<any>(`${this.apiUrl}/permisos`).pipe(
            map(res => res.detalles || [])
        );
    }
}

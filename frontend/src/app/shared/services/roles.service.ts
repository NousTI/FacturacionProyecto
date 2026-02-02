import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface Rol {
    id: string;
    nombre: string;
    codigo: string;
    empresa_id: string;
    es_sistema: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private apiUrl = `${environment.apiUrl}/empresa-roles`;

    constructor(private http: HttpClient) { }

    listarRoles(empresaId?: string): Observable<Rol[]> {
        let url = this.apiUrl;
        if (empresaId) url += `?empresa_id=${empresaId}`;

        return this.http.get<any>(url).pipe(
            map(res => res.detalles || [])
        );
    }
}

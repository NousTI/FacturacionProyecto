import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface VendedorStats {
    total: number;
    activos: number;
    inactivos: number;
    empresasTotales: number;
    ingresosGenerados: number;
}

export interface Vendedor {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    activo: boolean;
    empresasAsignadas: number;
    empresasActivas: number;
    ingresosGenerados: number;
    fechaRegistro: Date;
    porcentajeComision: number;
    tipoComision: string;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorService {
    private apiUrl = `${environment.apiUrl}/vendedores`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<VendedorStats> {
        return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(data => ({
                total: data.total,
                activos: data.activos,
                inactivos: data.inactivos,
                empresasTotales: data.empresas_totales,
                ingresosGenerados: data.ingresos_generados
            }))
        );
    }

    getVendedores(): Observable<Vendedor[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            map(list => list.map(v => this.mapVendedor(v)))
        );
    }

    private mapVendedor(data: any): Vendedor {
        return {
            id: data.id,
            nombre: `${data.nombres} ${data.apellidos}`,
            email: data.email,
            telefono: data.telefono || '',
            dni: data.documento_identidad || '',
            activo: data.activo,
            empresasAsignadas: data.empresas_asignadas || 0,
            empresasActivas: data.empresas_activas || 0,
            ingresosGenerados: data.ingresos_generados || 0,
            fechaRegistro: new Date(data.created_at),
            porcentajeComision: data.porcentaje_comision || 0,
            tipoComision: data.tipo_comision || 'FIJO'
        };
    }

    toggleStatus(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
    }

    crearVendedor(data: any): Observable<any> {
        // Map frontend fields back to backend if necessary
        const backendData = {
            email: data.email,
            nombres: data.nombre.split(' ')[0],
            apellidos: data.nombre.split(' ').slice(1).join(' '),
            telefono: data.telefono,
            documento_identidad: data.dni,
            password: data.password,
            activo: true
        };
        return this.http.post(this.apiUrl, backendData);
    }

    actualizarVendedor(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    reassignCompanies(fromId: string, toId: string, empresaIds?: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/${fromId}/reasignar`, {
            vendedor_destino_id: toId,
            empresa_ids: empresaIds || null
        });
    }

    getVendedorEmpresas(vendedorId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${vendedorId}/empresas`);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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
    nombres?: string;
    apellidos?: string;
    email: string;
    telefono: string;
    documento_identidad: string;
    activo: boolean;
    empresasAsignadas: number;
    empresas_asignadas?: number;
    empresasActivas: number;
    empresas_activas?: number;
    ingresosGenerados: number;
    ingresos_generados?: number;
    fechaRegistro: Date;
    porcentajeComision: number;
    porcentajeComisionInicial: number;
    porcentajeComisionRecurrente: number;
    tipoComision: string;
    puede_crear_empresas: boolean;
    puede_gestionar_planes: boolean;
    puede_acceder_empresas: boolean;
    puede_ver_reportes: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorService {
    private apiUrl = `${environment.apiUrl}/vendedores`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<VendedorStats> {
        return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => {
                const data = res.detalles;
                return {
                    total: data.total,
                    activos: data.activos,
                    inactivos: data.inactivos,
                    empresasTotales: data.empresas_totales,
                    ingresosGenerados: data.ingresos_generados
                };
            })
        );
    }

    getVendedores(): Observable<Vendedor[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(res => (res.detalles || []).map((v: any) => this.mapVendedor(v)))
        );
    }

    private mapVendedor(data: any): Vendedor {
        return {
            id: data.id,
            nombre: `${data.nombres} ${data.apellidos}`,
            nombres: data.nombres,
            apellidos: data.apellidos,
            email: data.email,
            telefono: data.telefono || '',
            documento_identidad: data.documento_identidad || '',
            activo: data.activo,
            empresasAsignadas: data.empresas_asignadas || 0,
            empresasActivas: data.empresas_activas || 0,
            ingresosGenerados: data.ingresos_generados || 0,
            fechaRegistro: new Date(data.created_at),
            porcentajeComision: data.porcentaje_comision || 0,
            porcentajeComisionInicial: data.porcentaje_comision_inicial || 0,
            porcentajeComisionRecurrente: data.porcentaje_comision_recurrente || 0,
            tipoComision: data.tipo_comision || 'PORCENTAJE',
            puede_crear_empresas: data.puede_crear_empresas || false,
            puede_gestionar_planes: data.puede_gestionar_planes || false,
            puede_acceder_empresas: data.puede_acceder_empresas || false,
            puede_ver_reportes: data.puede_ver_reportes || false
        };
    }

    toggleStatus(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
    }

    crearVendedor(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    actualizarVendedor(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}`, data);
    }

    reassignCompanies(fromId: string, toId: string, empresaIds?: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/${fromId}/reasignar-empresas`, {
            vendedor_destino_id: toId,
            empresa_ids: empresaIds || null
        });
    }

    getVendedorEmpresas(vendedorId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/${vendedorId}/empresas`).pipe(
            map(res => res.detalles || [])
        );
    }
}

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
    tipoIdentificacion?: string;
    documentoIdentidad: string;
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
    puedeCrearEmpresas: boolean;
    puedeGestionarPlanes: boolean;
    puedeAccederEmpresas: boolean;
    puedeVerReportes: boolean;
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
            tipoIdentificacion: data.tipo_identificacion || 'CEDULA',
            documentoIdentidad: data.documento_identidad || '',
            activo: data.activo,
            empresasAsignadas: data.empresas_asignadas || 0,
            empresasActivas: data.empresas_activas || 0,
            ingresosGenerados: data.ingresos_generados || 0,
            fechaRegistro: new Date(data.created_at),
            porcentajeComision: data.porcentaje_comision || 0,
            porcentajeComisionInicial: data.porcentaje_comision_inicial || 0,
            porcentajeComisionRecurrente: data.porcentaje_comision_recurrente || 0,
            tipoComision: data.tipo_comision || 'PORCENTAJE',
            puedeCrearEmpresas: data.puede_crear_empresas || false,
            puedeGestionarPlanes: data.puede_gestionar_planes || false,
            puedeAccederEmpresas: data.puede_acceder_empresas || false,
            puedeVerReportes: data.puede_ver_reportes || false
        };
    }

    toggleStatus(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
    }

    crearVendedor(data: any): Observable<any> {
        const mappedData = this.toSnakeCase(data);
        return this.http.post(this.apiUrl, mappedData);
    }

    actualizarVendedor(id: string, data: any): Observable<any> {
        const mappedData = this.toSnakeCase(data);
        return this.http.patch(`${this.apiUrl}/${id}`, mappedData);
    }

    private toSnakeCase(data: any): any {
        const mapped: any = {};
        const mapping: any = {
            'tipoIdentificacion': 'tipo_identificacion',
            'documentoIdentidad': 'documento_identidad',
            'tipoComision': 'tipo_comision',
            'porcentajeComisionInicial': 'porcentaje_comision_inicial',
            'porcentajeComisionRecurrente': 'porcentaje_comision_recurrente',
            'puedeCrearEmpresas': 'puede_crear_empresas',
            'puedeGestionarPlanes': 'puede_gestionar_planes',
            'puedeAccederEmpresas': 'puede_acceder_empresas',
            'puedeVerReportes': 'puede_ver_reportes'
        };

        Object.keys(data).forEach(key => {
            const mappedKey = mapping[key] || key;
            mapped[mappedKey] = data[key];
        });

        return mapped;
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

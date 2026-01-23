import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, filter, take } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

export interface PlanCharacteristics {
    api_acceso: boolean;
    multi_usuario: boolean;
    backup_automatico: boolean;
    exportacion_datos: boolean;
    reportes_avanzados: boolean;
    alertas_vencimiento: boolean;
    personalizacion_pdf: boolean;
    soporte_prioritario: boolean;
    facturacion_electronica: boolean;
}

// Plan interface with all subscription plan properties
export interface Plan {
    id: string;
    codigo: string;
    name: string;
    description: string;
    price: number;
    activeCompanies: number;
    status: 'ACTIVO' | 'INACTIVO';
    visible_publico: boolean; // Controls plan visibility in public catalog
    max_usuarios: number;
    max_facturas_mes: number;
    max_establecimientos: number;
    max_programaciones: number;
    caracteristicas: PlanCharacteristics;
    orden: number;
    isProfitable?: boolean;
}

export interface PlanHistory {
    id: string;
    empresaId: string;
    empresaName: string;
    oldPlan: string;
    newPlan: string;
    date: Date;
    reason: string;
    monto: number;
}

export interface PlanStats {
    totalMRR: number;
    activeSubscriptions: number;
    mostProfitable: string;
    growth: number;
}

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private apiUrl = `${environment.apiUrl}/suscripciones`;

    // Cache para planes y stats
    private planesCache$ = new BehaviorSubject<Plan[] | null>(null);
    private statsCache$ = new BehaviorSubject<PlanStats | null>(null);
    private isLoadingPlanes = false;
    private isLoadingStats = false;

    constructor(private http: HttpClient) { }

    getPlanes(forceRefresh: boolean = false): Observable<Plan[]> {
        // Si ya tenemos datos en caché y no es refresh forzado, retornar el caché
        if (!forceRefresh && this.planesCache$.value !== null) {
            console.log('📦 Usando planes desde caché');
            return of(this.planesCache$.value);
        }

        // Si ya está cargando, esperar el resultado
        if (this.isLoadingPlanes) {
            console.log('⏳ Esperando carga en progreso...');
            return this.planesCache$.asObservable().pipe(
                filter(planes => planes !== null),
                take(1)
            );
        }

        // Cargar desde el servidor
        console.log('🌐 Cargando planes desde servidor...');
        this.isLoadingPlanes = true;

        return this.http.get<any[]>(`${this.apiUrl}/planes`).pipe(
            map(planes => planes.map(p => this.mapToPlan(p))),
            tap(planes => {
                console.log('✅ Planes cargados y guardados en caché:', planes.length);
                this.planesCache$.next(planes);
                this.isLoadingPlanes = false;
            }),
            catchError(error => {
                console.error('❌ Error cargando planes:', error);
                this.isLoadingPlanes = false;
                throw error;
            })
        );
    }

    getStats(forceRefresh: boolean = false): Observable<PlanStats> {
        // Si ya tenemos datos en caché y no es refresh forzado, retornar el caché
        if (!forceRefresh && this.statsCache$.value !== null) {
            console.log('📦 Usando stats desde caché');
            return of(this.statsCache$.value);
        }

        // Si ya está cargando, esperar el resultado
        if (this.isLoadingStats) {
            console.log('⏳ Esperando carga de stats en progreso...');
            return this.statsCache$.asObservable().pipe(
                filter(stats => stats !== null),
                take(1)
            );
        }

        console.log('🌐 Cargando stats desde servidor...');
        this.isLoadingStats = true;

        return this.http.get<any>(`${this.apiUrl}/planes/stats`).pipe(
            map(stats => ({
                totalMRR: stats.total_mrr,
                activeSubscriptions: stats.suscripciones_activas,
                mostProfitable: stats.plan_mas_rentable,
                growth: stats.crecimiento
            })),
            tap(stats => {
                console.log('✅ Stats cargadas y guardadas en caché');
                this.statsCache$.next(stats);
                this.isLoadingStats = false;
            }),
            catchError(error => {
                console.error('❌ Error cargando stats:', error);
                this.isLoadingStats = false;
                throw error;
            })
        );
    }

    getCompanies(planId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/planes/${planId}/empresas`);
    }

    getHistory(empresaId?: string): Observable<PlanHistory[]> {
        const url = empresaId ? `${this.apiUrl}/pagos?empresa_id=${empresaId}` : `${this.apiUrl}/pagos`;
        return this.http.get<any[]>(url).pipe(
            map(pagos => pagos.map(p => ({
                id: p.id,
                empresaId: p.empresa_id,
                empresaName: p.empresa_nombre || p.razon_social, // Fallback safely
                oldPlan: 'N/A',
                newPlan: p.plan_nombre,
                date: new Date(p.fecha_pago),
                reason: p.numero_comprobante || '',
                monto: p.monto
            })))
        );
    }

    savePlan(data: any): Observable<any> {
        const payload = this.mapToBackend(data);
        const request = data.id
            ? this.http.patch(`${this.apiUrl}/planes/${data.id}`, payload)
            : this.http.post(`${this.apiUrl}/planes`, payload);

        return request.pipe(
            map(response => this.mapToPlan(response)),
            tap(() => {
                // Invalidar caché para forzar recarga en la próxima petición
                console.log('🔄 Invalidando caché de planes después de guardar');
                this.planesCache$.next(null);
                this.statsCache$.next(null);
            })
        );
    }

    deletePlan(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/planes/${id}`).pipe(
            tap(() => {
                // Invalidar caché
                console.log('🔄 Invalidando caché de planes después de eliminar');
                this.planesCache$.next(null);
                this.statsCache$.next(null);
            })
        );
    }



    // Método para forzar recarga de datos
    refreshData(): void {
        console.log('🔄 Forzando refresh de datos...');
        this.planesCache$.next(null);
        this.statsCache$.next(null);
    }

    private mapToPlan(p: any): Plan {
        let caracteristicas: PlanCharacteristics;

        // Parse caracteristicas from JSON if it's a string
        if (typeof p.caracteristicas === 'string') {
            try {
                caracteristicas = JSON.parse(p.caracteristicas);
            } catch (e) {
                console.warn('Error parsing caracteristicas for plan', p.id, e);
                caracteristicas = this.getDefaultCharacteristics();
            }
        } else if (typeof p.caracteristicas === 'object' && p.caracteristicas !== null) {
            caracteristicas = p.caracteristicas;
        } else {
            caracteristicas = this.getDefaultCharacteristics();
        }

        return {
            id: p.id,
            codigo: p.codigo,
            name: p.nombre,
            description: p.descripcion || '',
            price: p.precio_mensual,
            activeCompanies: p.active_companies || 0,
            status: p.activo ? 'ACTIVO' : 'INACTIVO',
            visible_publico: !!p.visible_publico,
            max_usuarios: p.max_usuarios || 0,
            max_facturas_mes: p.max_facturas_mes || 0,
            max_establecimientos: p.max_establecimientos || 0,
            max_programaciones: p.max_programaciones || 0,
            caracteristicas: caracteristicas,
            orden: p.orden || 0
        };
    }

    private mapToBackend(p: any): any {
        return {
            codigo: p.codigo || (p.name ? p.name.toUpperCase().replace(/\s+/g, '_') : ''),
            nombre: p.name,
            descripcion: p.description || '',
            precio_mensual: p.price,
            max_usuarios: p.max_usuarios || 0,
            max_facturas_mes: p.max_facturas_mes || 0,
            max_establecimientos: p.max_establecimientos || 0,
            max_programaciones: p.max_programaciones || 0,
            caracteristicas: p.caracteristicas || this.getDefaultCharacteristics(),
            activo: p.activo !== undefined ? p.activo : (p.status === 'ACTIVO'),
            visible_publico: p.visible_publico !== undefined ? p.visible_publico : true,
            orden: p.orden || 0
        };
    }

    getDefaultCharacteristics(): PlanCharacteristics {
        return {
            api_acceso: false,
            multi_usuario: false,
            backup_automatico: true,
            exportacion_datos: false,
            reportes_avanzados: false,
            alertas_vencimiento: true,
            personalizacion_pdf: false,
            soporte_prioritario: false,
            facturacion_electronica: true
        };
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, filter, take, finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

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

    loadData(forceRefresh: boolean = false) {
        this.loadPlanes(forceRefresh);
        this.loadStats(forceRefresh);
    }

    private loadPlanes(forceRefresh: boolean = false) {
        if (!forceRefresh && this.planesCache$.value !== null) return;
        if (this.isLoadingPlanes) return;

        this.isLoadingPlanes = true;
        console.log('🌐 Cargando planes desde servidor...');

        this.http.get<any>(`${this.apiUrl}/planes`).pipe(
            map(res => (res.detalles || []).map((p: any) => this.mapToPlan(p))),
            finalize(() => this.isLoadingPlanes = false)
        ).subscribe({
            next: (planes: Plan[]) => {
                console.log('✅ Planes cargados:', planes.length);
                this.planesCache$.next(planes);
            },
            error: (err) => console.error('❌ Error cargando planes:', err)
        });
    }

    private loadStats(forceRefresh: boolean = false) {
        if (!forceRefresh && this.statsCache$.value !== null) return;
        if (this.isLoadingStats) return;

        this.isLoadingStats = true;
        console.log('🌐 Cargando stats desde servidor...');

        this.http.get<any>(`${this.apiUrl}/planes/stats`).pipe(
            map(res => {
                const stats = res.detalles;
                return {
                    totalMRR: stats.total_mrr,
                    activeSubscriptions: stats.suscripciones_activas,
                    mostProfitable: stats.plan_mas_rentable,
                    growth: stats.crecimiento
                };
            }),
            finalize(() => this.isLoadingStats = false)
        ).subscribe({
            next: (stats: any) => {
                console.log('✅ Stats cargadas');
                this.statsCache$.next(stats as PlanStats);
            },
            error: (err) => console.error('❌ Error cargando stats:', err)
        });
    }

    getPlanes(): Observable<Plan[]> {
        return this.planesCache$.asObservable().pipe(
            filter(planes => planes !== null),
            map(planes => planes as Plan[])
        );
    }

    getStats(forceRefresh: boolean = false): Observable<PlanStats> {
        if (forceRefresh) this.loadStats(true);
        return this.statsCache$.asObservable().pipe(
            filter(stats => stats !== null),
            map(stats => stats as PlanStats)
        );
    }

    getCompanies(planId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/planes/${planId}/empresas`).pipe(
            map(res => res.detalles || [])
        );
    }

    getHistory(empresaId?: string): Observable<PlanHistory[]> {
        const url = empresaId ? `${this.apiUrl}/pagos?empresa_id=${empresaId}` : `${this.apiUrl}/pagos`;
        return this.http.get<any>(url).pipe(
            map(res => (res.detalles || []).map((p: any) => ({
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
            ? this.http.put(`${this.apiUrl}/planes/${data.id}`, payload)
            : this.http.post(`${this.apiUrl}/planes`, payload);

        return request.pipe(
            map((response: any) => {
                console.log('📡 Save/Update Response:', response);
                if (!response.detalles) {
                    console.error('❌ Response missing detalles property!');
                    return null;
                }
                return this.mapToPlan(response.detalles);
            }),
            tap((savedPlan) => {
                if (!savedPlan) return;
                // Actualizar caché de manera optimista/reactiva
                console.log('🔄 Actualizando caché de planes después de guardar');
                const currentPlanes = this.planesCache$.value || [];

                if (data.id) {
                    // Update
                    const index = currentPlanes.findIndex(p => p.id === data.id);
                    if (index !== -1) {
                        const updatedPlanes = [...currentPlanes];
                        updatedPlanes[index] = savedPlan;
                        this.planesCache$.next(updatedPlanes);
                    } else {
                        // Fallback if not found, add it
                        this.planesCache$.next([...currentPlanes, savedPlan]);
                    }
                } else {
                    // Create
                    this.planesCache$.next([...currentPlanes, savedPlan]);
                }

                // For stats, we might need to invalidate or complex update. 
                // Simple invalidation is safer for stats as they are aggregates.
                // Or if we want to be very granular we would fetch stats.
                // Let's invalidate stats to force refresh only on stats, but keep list fast
                this.statsCache$.next(null);
            })
        );
    }

    updatePlan(id: string, plan: Partial<Plan>): Observable<Plan> {
        return this.http.patch<any>(`${this.apiUrl}/planes/${id}`, plan)
            .pipe(map(response => response.detalles || response));
    }

    deletePlan(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/planes/${id}`).pipe(
            tap(() => {
                // Actualizar caché: eliminar el plan
                console.log('🔄 Actualizando caché de planes después de eliminar');
                const currentPlanes = this.planesCache$.value || [];
                const updatedPlanes = currentPlanes.filter(p => p.id !== id);
                this.planesCache$.next(updatedPlanes);

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

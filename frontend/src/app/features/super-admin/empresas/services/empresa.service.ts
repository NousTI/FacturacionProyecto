import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, finalize, filter, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

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

    // State management
    private _empresas$ = new BehaviorSubject<any[]>([]);
    private _stats$ = new BehaviorSubject<EmpresaStats | null>(null);

    // Loading state
    private _loading = false;

    constructor(private http: HttpClient) { }

    loadData(force: boolean = false) {
        if (this._loading && !force) return;

        this._loading = true;

        // Fetch Empresas
        this.http.get<any>(this.apiUrl).pipe(
            map(res => (res.detalles || []).map((e: any) => this.mapEmpresa(e))),
            finalize(() => this._loading = false)
        ).subscribe({
            next: (data) => {
                this._empresas$.next(data);
            },
            error: (err) => console.error('Error loading empresas:', err)
        });

        this.refreshStats();
    }

    private mapEmpresa(e: any): any {
        return {
            ...e,
            razonSocial: e.razon_social,
            nombreComercial: e.nombre_comercial,
            estado: e.activo ? 'ACTIVO' : 'INACTIVO',
            vendedorId: e.vendedor_id,
            vendedorName: e.vendedor_name,
            plan: e.plan_nombre || 'SIN PLAN',
            currentPlanId: e.current_plan_id,
            fechaVencimiento: e.fecha_fin ? new Date(e.fecha_fin) : null,
            ultimoPagoFecha: e.ultimo_pago_fecha ? new Date(e.ultimo_pago_fecha) : null,
            ultimoPagoMonto: e.ultimo_pago_monto || 0,
            limits: {
                max_usuarios: e.max_usuarios,
                max_facturas: e.max_facturas_mes,
                max_establecimientos: e.max_establecimientos,
                max_programaciones: e.max_programaciones
            }
        };
    }

    getStats(): Observable<EmpresaStats> {
        return this._stats$.asObservable().pipe(
            filter(stats => stats !== null),
            map(stats => stats as EmpresaStats)
        );
    }

    getEmpresas(): Observable<any[]> {
        return this._empresas$.asObservable();
    }

    createEmpresa(data: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, data).pipe(
            map(res => this.mapEmpresa(res.detalles)),
            tap(nueva => {
                const current = this._empresas$.value;
                this._empresas$.next([nueva, ...current]);
                this.refreshStats();
            })
        );
    }

    updateEmpresa(id: string, data: any): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
            map(res => this.mapEmpresa(res.detalles)),
            tap(updated => {
                const current = this._empresas$.value;
                const index = current.findIndex(e => e.id.toString() === id.toString());
                if (index !== -1) {
                    current[index] = { ...current[index], ...updated };
                    this._empresas$.next([...current]);
                }
            })
        );
    }

    toggleActive(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, {}).pipe(
            map((res: any) => this.mapEmpresa(res.detalles)),
            tap(updated => {
                const current = this._empresas$.value;
                const index = current.findIndex(e => e.id.toString() === id.toString());
                if (index !== -1) {
                    current[index] = { ...current[index], ...updated };
                    this._empresas$.next([...current]);
                    this.refreshStats();
                }
            })
        );
    }

    changePlan(empresaId: string, planId: string, monto: number = 0, observaciones: string = ''): Observable<any> {
        return this.http.post(`${this.apiUrl}/${empresaId}/change-plan`, {
            plan_id: planId,
            monto,
            observaciones
        }).pipe(
            map((res: any) => this.mapEmpresa(res.detalles)),
            tap(updated => {
                const current = this._empresas$.value;
                const index = current.findIndex(e => e.id.toString() === empresaId.toString());
                if (index !== -1) {
                    current[index] = { ...current[index], ...updated };
                    this._empresas$.next([...current]);
                    this.refreshStats();
                }
            })
        );
    }

    assignVendor(empresaId: string, vendedorId: string | null): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${empresaId}/assign-vendor`, { vendedor_id: vendedorId }).pipe(
            map((res: any) => this.mapEmpresa(res.detalles)),
            tap(updated => {
                const current = this._empresas$.value;
                const index = current.findIndex(e => e.id.toString() === empresaId.toString());
                if (index !== -1) {
                    current[index] = { ...current[index], ...updated };
                    this._empresas$.next([...current]);
                }
            })
        );
    }

    getVendedores(): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/vendedores`).pipe(
            map(res => res.detalles || [])
        );
    }

    getPlanes(): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/suscripciones/planes`).pipe(
            map(res => res.detalles || [])
        );
    }

    refreshStats() {
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => res.detalles)
        ).subscribe({
            next: (data) => this._stats$.next(data),
            error: (err) => console.error('Error loading stats:', err)
        });
    }
}

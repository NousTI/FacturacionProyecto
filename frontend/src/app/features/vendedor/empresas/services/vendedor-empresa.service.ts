import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, finalize, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthFacade } from '../../../../core/auth/auth.facade';

export interface VendedorEmpresaStats {
    total: number;
    activas: number;
    inactivas: number;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorEmpresaService {
    private apiUrl = `${environment.apiUrl}/empresas`; // Reusing main endpoint, assuming backend filters or we filter
    private planesUrl = `${environment.apiUrl}/suscripciones/planes`;

    // State
    private _empresas$ = new BehaviorSubject<any[]>([]);
    private _loading = false;

    constructor(
        private http: HttpClient,
        private authFacade: AuthFacade
    ) { }

    loadMyEmpresas(force: boolean = false) {
        if (this._loading && !force) return;

        const user = this.authFacade.getUser();
        if (!user) return; // Should not happen if guarded

        this._loading = true;

        this.http.get<any>(this.apiUrl).pipe(
            map(res => {
                const all: any[] = res.detalles || [];
                // Backend now filters by vendor context correctly
                return all.map(e => this.mapEmpresa(e));
            }),
            finalize(() => this._loading = false)
        ).subscribe({
            next: (data) => this._empresas$.next(data),
            error: (err) => console.error('Error loading vendor empresas:', err)
        });
    }

    getEmpresas(): Observable<any[]> {
        return this._empresas$.asObservable();
    }

    createEmpresa(data: any): Observable<any> {
        // Ensure vendedor_id is set to current user
        const user = this.authFacade.getUser();
        const payload = { ...data, vendedor_id: user?.id };

        return this.http.post<any>(this.apiUrl, payload).pipe(
            map(res => this.mapEmpresa(res.detalles)),
            tap(nueva => {
                const current = this._empresas$.value;
                this._empresas$.next([nueva, ...current]);
            })
        );
    }

    changePlan(empresaId: string, planId: string, monto: number = 0, observaciones: string = '', metodo_pago: string = 'MANUAL_VENDEDOR'): Observable<any> {
        return this.http.post(`${this.apiUrl}/${empresaId}/change-plan`, {
            plan_id: planId,
            monto,
            observaciones,
            metodo_pago
        }).pipe(
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

    getPlanes(): Observable<any[]> {
        return this.http.get<any>(this.planesUrl).pipe(
            map(res => res.detalles || [])
        );
    }

    private mapEmpresa(e: any): any {
        return {
            ...e,
            razonSocial: e.razon_social,
            nombreComercial: e.nombre_comercial,
            estado: e.activo ? 'ACTIVO' : 'INACTIVO',
            vendedorId: e.vendedor_id,
            plan: e.plan_nombre || 'SIN PLAN',
            planId: e.current_plan_id,
            precioPlan: e.precio_mensual || 0,
            fechaVencimiento: e.fecha_fin ? new Date(e.fecha_fin) : null,
            ultimoPagoFecha: e.ultimo_pago_fecha ? new Date(e.ultimo_pago_fecha) : null,
            ultimoPagoMonto: e.ultimo_pago_monto || 0,
            ultimoPagoEstado: e.ultimo_pago_estado || 'PENDIENTE',
            usage: e.usage || {},
            limits: {
                max_usuarios: e.max_usuarios,
                max_facturas: e.max_facturas_mes,
                max_establecimientos: e.max_establecimientos,
                max_programaciones: e.max_programaciones
            }
        };
    }
}

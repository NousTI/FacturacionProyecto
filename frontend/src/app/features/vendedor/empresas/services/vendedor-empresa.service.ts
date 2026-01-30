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
                // Client-side filtering just in case backend returns all
                // Ideally backend handles this via token context
                return all.filter(e => e.vendedor_id === user.id).map(e => this.mapEmpresa(e));
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
            fechaVencimiento: e.fecha_fin ? new Date(e.fecha_fin) : null,
            usage: {
                usuarios: e.usage?.usuarios || 0,
                max_usuarios: e.max_usuarios
            }
        };
    }
}

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
    private _dataLoaded = false;
    private _loading = false;

    constructor(private http: HttpClient) { }

    loadData(force: boolean = false) {
        if (!force && (this._dataLoaded || this._loading)) return;

        this._loading = true;

        // Fetch Empresas
        this.http.get<any>(this.apiUrl).pipe(
            map(res => res.detalles || []),
            finalize(() => {
                this._loading = false;
                this._dataLoaded = true;
            })
        ).subscribe({
            next: (data) => this._empresas$.next(data),
            error: (err) => console.error('Error loading empresas:', err)
        });

        this.refreshStats();
    }

    refreshStats() {
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => res.detalles)
        ).subscribe({
            next: (data) => this._stats$.next(data),
            error: (err) => console.error('Error loading stats:', err)
        });
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
            map(res => res.detalles),
            tap(nueva => {
                const current = this._empresas$.value;
                this._empresas$.next([nueva, ...current]);
                this.refreshStats();
            })
        );
    }

    updateEmpresa(id: string, data: any): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
            map(res => res.detalles),
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

    toggleActive(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, {}).pipe(
            map((res: any) => res.detalles),
            tap(updated => {
                const current = this._empresas$.value;
                const index = current.findIndex(e => e.id === parseInt(id));
                if (index !== -1) {
                    current[index] = { ...current[index], ...updated, activo: updated.activo };
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
            tap(() => this.loadData(true))
        );
    }

    assignVendor(empresaId: string, vendedorId: string | null): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${empresaId}/assign-vendor`, { vendedor_id: vendedorId }).pipe(
            tap(() => this.loadData(true))
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


}

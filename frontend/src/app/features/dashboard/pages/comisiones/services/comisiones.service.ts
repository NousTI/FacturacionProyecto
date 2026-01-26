import { Injectable } from '@angular/core';
import { Observable, map, BehaviorSubject, tap, filter, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

export interface Comision {
    id: string; // UUID from backend
    vendedor_id: string;
    vendedor_nombre?: string;
    empresa_nombre?: string;
    monto: number;
    monto_pago?: number;
    porcentaje_aplicado: number;
    fecha_generacion: Date; // Mapped from backend date string
    estado: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'RECHAZADA';
    concepto?: string;
    fecha_pago?: Date;
    observaciones?: string;
    metodo_pago?: string;
    aprobado_por_nombre?: string;
    fecha_aprobacion?: Date;
}

export interface ComisionStats {
    total: number; // Mapped from 'total' in backend
    pendientes: number;
    pagados: number;
}

@Injectable({
    providedIn: 'root'
})
export class ComisionesService {
    private apiUrl = `${environment.apiUrl}/comisiones`;

    // State management
    private _comisiones$ = new BehaviorSubject<Comision[]>([]);
    private _stats$ = new BehaviorSubject<ComisionStats | null>(null);

    // Loading state
    private _dataLoaded = false;
    private _loading = false;

    constructor(private http: HttpClient) { }

    /**
     * Explicitly loads data from backend.
     * Prevents duplicate requests if already loading or already loaded.
     */
    loadData() {
        if (this._dataLoaded || this._loading) return;

        this._loading = true;

        // Fetch Commissions
        this.http.get<any[]>(this.apiUrl).pipe(
            map(data => data.map(item => this.mapBackendToFrontend(item)))
        ).subscribe({
            next: (data) => {
                this._comisiones$.next(data);
                this._dataLoaded = true;
                this._loading = false;
            },
            error: (err) => {
                console.error('Error fetching commissions', err);
                this._loading = false;
            }
        });

        // Fetch Stats
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(data => ({
                total: parseFloat(data.total),
                pendientes: parseFloat(data.pendientes),
                pagados: parseFloat(data.pagados)
            }))
        ).subscribe({
            next: (stats) => this._stats$.next(stats),
            error: (err) => console.error('Error fetching stats', err)
        });
    }

    getStats(): Observable<ComisionStats> {
        // Return observable derived from state. 
        // Note: We filter nulls so views only get data when available.
        return this._stats$.asObservable().pipe(
            filter(stats => stats !== null),
            map(stats => stats as ComisionStats)
        );
    }

    getAllComisiones(): Observable<Comision[]> {
        return this._comisiones$.asObservable();
    }

    getComisionesByEstado(estado?: string): Observable<Comision[]> {
        return this.getAllComisiones().pipe(
            map(items => estado ? items.filter(i => i.estado === estado) : items)
        );
    }

    approveComision(id: string, observaciones?: string): Observable<Comision> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, {
            estado: 'APROBADA',
            observaciones
        }).pipe(
            map(item => this.mapBackendToFrontend(item)),
            tap(updatedComision => {
                const current = this._comisiones$.value;
                const index = current.findIndex(c => c.id === updatedComision.id);
                if (index !== -1) {
                    current[index] = updatedComision;
                    this._comisiones$.next([...current]);
                    this.refreshStats();
                }
            })
        );
    }

    rejectComision(id: string, observaciones?: string): Observable<boolean> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, {
            estado: 'RECHAZADA',
            observaciones
        }).pipe(
            map(() => true),
            tap(() => {
                this.refreshStats();
                // Optimistic update
                const current = this._comisiones$.value;
                const index = current.findIndex(c => c.id === id);
                if (index !== -1) {
                    current[index].estado = 'RECHAZADA';
                    this._comisiones$.next([...current]);
                }
            })
        );
    }

    getHistory(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/historial`);
    }

    registerPayment(ids: string[], details: { metodo_pago?: string, observaciones?: string }): Observable<boolean> {
        if (ids.length === 1) {
            return this.http.put<any>(`${this.apiUrl}/${ids[0]}`, {
                estado: 'PAGADA',
                fecha_pago: new Date().toISOString().split('T')[0],
                ...details
            }).pipe(
                map(() => true),
                tap(() => {
                    this.refreshStats();
                    const current = this._comisiones$.value;
                    const index = current.findIndex(c => c.id === ids[0]);
                    if (index !== -1) {
                        current[index].estado = 'PAGADA';
                        current[index].fecha_pago = new Date();
                        if (details.observaciones) current[index].observaciones = details.observaciones;
                        this._comisiones$.next([...current]);
                    }
                })
            );
        }
        return of(false);
    }

    private refreshStats() {
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(data => ({
                total: parseFloat(data.total),
                pendientes: parseFloat(data.pendientes),
                pagados: parseFloat(data.pagados)
            }))
        ).subscribe(stats => this._stats$.next(stats));
    }

    private mapBackendToFrontend(item: any): Comision {
        return {
            id: item.id,
            vendedor_id: item.vendedor_id,
            vendedor_nombre: item.vendedor_nombre,
            empresa_nombre: item.empresa_nombre,
            monto: parseFloat(item.monto),
            monto_pago: item.monto_pago ? parseFloat(item.monto_pago) : undefined,
            porcentaje_aplicado: parseFloat(item.porcentaje_aplicado),
            fecha_generacion: new Date(item.created_at),
            estado: item.estado,
            concepto: item.empresa_nombre ? `Comisión ${item.empresa_nombre}` : 'Comisión General',
            fecha_pago: item.fecha_pago ? new Date(item.fecha_pago) : undefined,
            observaciones: item.observaciones,
            metodo_pago: item.metodo_pago,
            aprobado_por_nombre: item.aprobado_por_nombre,
            fecha_aprobacion: item.fecha_aprobacion ? new Date(item.fecha_aprobacion) : undefined
        };
    }
}

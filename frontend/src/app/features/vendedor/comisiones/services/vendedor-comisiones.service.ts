import { Injectable } from '@angular/core';
import { Observable, map, BehaviorSubject, filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface Comision {
    id: string; // UUID from backend
    vendedor_id: string;
    vendedor_nombre?: string; // Might not be needed for vendor view but keeping for compatibility
    empresa_nombre?: string;
    monto: number;
    monto_pago?: number;
    porcentaje_aplicado: number;
    fecha_generacion: Date;
    estado: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'RECHAZADA';
    concepto?: string;
    fecha_pago?: Date;
    observaciones?: string;
    metodo_pago?: string;
    aprobado_por_nombre?: string;
    fecha_aprobacion?: Date;
}

export interface ComisionStats {
    total: number;
    pendientes: number;
    pagados: number;
    aprobadas: number; // Added field for vendor details if backend returns it
}

@Injectable({
    providedIn: 'root'
})
export class VendedorComisionesService {
    private apiUrl = `${environment.apiUrl}/comisiones`;

    // State management
    private _comisiones$ = new BehaviorSubject<Comision[]>([]);
    private _stats$ = new BehaviorSubject<ComisionStats | null>(null);

    private _loading = false;
    private _dataLoaded = false;

    constructor(private http: HttpClient) { }

    loadData(force = false) {
        if ((this._dataLoaded || this._loading) && !force) return;

        this._loading = true;

        // Fetch Commissions (Backend filters by current user automatically)
        this.http.get<any>(this.apiUrl).pipe(
            map(res => (res.detalles || []).map((item: any) => this.mapBackendToFrontend(item)))
        ).subscribe({
            next: (data) => {
                this._comisiones$.next(data);
                this._dataLoaded = true;
                this._loading = false;
            },
            error: (err) => {
                console.error('Error fetching vendor commissions', err);
                this._loading = false;
            }
        });

        // Fetch Stats
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => {
                const data = res.detalles;
                return {
                    total: parseFloat(data.total || 0),
                    pendientes: parseFloat(data.pendientes || 0),
                    pagados: parseFloat(data.pagados || 0),
                    aprobadas: parseFloat(data.aprobadas || 0) // Ensure backend sends this or we default to 0
                };
            })
        ).subscribe({
            next: (stats) => this._stats$.next(stats),
            error: (err) => console.error('Error fetching vendor stats', err)
        });
    }

    getStats(): Observable<ComisionStats> {
        return this._stats$.asObservable().pipe(
            filter(stats => stats !== null),
            map(stats => stats as ComisionStats)
        );
    }

    getAllComisiones(): Observable<Comision[]> {
        return this._comisiones$.asObservable();
    }

    getHistory(id: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/${id}/historial`).pipe(
            map(res => res.detalles || [])
        );
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

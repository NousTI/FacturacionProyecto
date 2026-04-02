import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter, shareReplay } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Cliente, ClienteCreate, ClienteUpdate, ClienteStats,
    ReporteNuevosClientes, ReporteTopClientes,
    ReporteClientesInactivos, ReporteAnalisisClientes
} from '../../../../domain/models/cliente.model';

import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ClientesService extends BaseApiService {
    private readonly ENDPOINT = 'clientes';

    // Caching State
    private _clientes$ = new BehaviorSubject<Cliente[] | null>(null);
    private _stats$ = new BehaviorSubject<ClienteStats | null>(null);
    private _loaded = false;

    // Caching State para Analítica
    private cacheNuevos = new Map<number, Observable<ApiResponse<ReporteNuevosClientes>>>();
    private cacheTop = new Map<string, Observable<ApiResponse<ReporteTopClientes>>>();
    private cacheInactivos = new Map<number, Observable<ApiResponse<ReporteClientesInactivos>>>();
    private cacheAnalisis = new Map<number, Observable<ApiResponse<ReporteAnalisisClientes>>>();

    constructor(http: HttpClient) {
        super(http);
    }

    // Getters for the state
    get clientes$() { 
        return this._clientes$.pipe(
            filter(data => data !== null),
            map(data => data as Cliente[])
        ); 
    }
    get stats$() { return this._stats$.asObservable(); }

    /**
     * Loads data from API and updates local cache
     */
    loadInitialData(): void {
        if (this._loaded) return;

        this.get<ApiResponse<Cliente[]>>(this.ENDPOINT).subscribe(resp => {
            if (resp && resp.detalles) {
                this._clientes$.next(resp.detalles);
                this._loaded = true;
            }
        });

        this.get<ApiResponse<ClienteStats>>(`${this.ENDPOINT}/stats`).subscribe(resp => {
            if (resp && resp.detalles) {
                this._stats$.next(resp.detalles);
            }
        });
    }

    /**
     * Returns current cached clients or fetches if empty
     */
    getClientes(): Observable<Cliente[]> {
        if (!this._loaded) {
            this.loadInitialData();
        }
        return this.clientes$;
    }

    getActivos(): Observable<Cliente[]> {
        return this.getClientes().pipe(
            filter(data => data !== null),
            map((list: Cliente[]) => list.filter((c: Cliente) => c.activo))
        );
    }

    getStats(): Observable<ClienteStats | null> {
        if (!this._loaded) {
            this.loadInitialData();
        }
        return this.stats$;
    }

    createCliente(cliente: ClienteCreate): Observable<ApiResponse<Cliente>> {
        return this.post<ApiResponse<Cliente>>(this.ENDPOINT, cliente).pipe(
            tap(resp => {
                if (resp && resp.detalles) {
                    const current = this._clientes$.value || [];
                    this._clientes$.next([resp.detalles, ...current]);
                    this._updateStatsLocally('create', resp.detalles);
                }
            })
        );
    }

    updateCliente(id: string, cliente: ClienteUpdate): Observable<ApiResponse<Cliente>> {
        return this.put<ApiResponse<Cliente>>(`${this.ENDPOINT}/${id}`, cliente).pipe(
            tap(resp => {
                if (resp && resp.detalles) {
                    const current = this._clientes$.value || [];
                    const index = current.findIndex(c => c.id === id);
                    if (index !== -1) {
                        const oldCliente = current[index];
                        current[index] = { ...current[index], ...resp.detalles };
                        this._clientes$.next([...current]);
                        this._updateStatsLocally('update', resp.detalles, oldCliente);
                    }
                }
            })
        );
    }

    deleteCliente(id: string): Observable<ApiResponse<null>> {
        return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
            tap(() => {
                const current = this._clientes$.value || [];
                const clienteToDelete = current.find(c => c.id === id);
                if (clienteToDelete) {
                    this._clientes$.next(current.filter(c => c.id !== id));
                    this._updateStatsLocally('delete', clienteToDelete);
                }
            })
        );
    }

    private _updateStatsLocally(action: 'create' | 'update' | 'delete', cliente: Cliente, oldCliente?: Cliente) {
        const currentStats = this._stats$.value;
        if (!currentStats) return;

        const newStats = { ...currentStats };

        if (action === 'create') {
            newStats.total++;
            if (cliente.activo) newStats.activos++;
            if (cliente.limite_credito > 0) newStats.con_credito++;
        } else if (action === 'delete') {
            newStats.total--;
            if (cliente.activo) newStats.activos--;
            if (cliente.limite_credito > 0) newStats.con_credito--;
        } else if (action === 'update' && oldCliente) {
            // Activo change
            if (oldCliente.activo !== cliente.activo) {
                newStats.activos += cliente.activo ? 1 : -1;
            }
            // Credit change
            const oldHasCredit = oldCliente.limite_credito > 0;
            const newHasCredit = cliente.limite_credito > 0;
            if (oldHasCredit !== newHasCredit) {
                newStats.con_credito += newHasCredit ? 1 : -1;
            }
        }

        this._stats$.next(newStats);
    }

    /**
     * Export clients as Excel
     */
    exportClientes(startDate?: string, endDate?: string): Observable<Blob> {
        let params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        return this.http.get(`${this.apiUrl}/${this.ENDPOINT}/exportar`, {
            params,
            responseType: 'blob'
        });
    }

    /**
     * Forces a refresh from the server
     */
    refresh(): void {
        this._loaded = false;
        this.cacheNuevos.clear();
        this.cacheTop.clear();
        this.cacheInactivos.clear();
        this.cacheAnalisis.clear();
        this.loadInitialData();
    }

    // ── Analítica ────────────────────────────────────────────────────────

    /** R-017: Clientes nuevos por mes */
    getNuevosPorMes(meses: number = 6): Observable<ApiResponse<ReporteNuevosClientes>> {
        if (!this.cacheNuevos.has(meses)) {
            const params = new HttpParams().set('meses', meses.toString());
            const req = this.get<ApiResponse<ReporteNuevosClientes>>(
                `${this.ENDPOINT}/analitica/nuevos-por-mes`, params
            ).pipe(shareReplay(1));
            this.cacheNuevos.set(meses, req);
        }
        return this.cacheNuevos.get(meses)!;
    }

    /** R-018: Top clientes */
    getTopClientes(opts: {
        fechaInicio?: string;
        fechaFin?: string;
        criterio?: 'monto' | 'facturas';
        limit?: 5 | 10 | 20;
    } = {}): Observable<ApiResponse<ReporteTopClientes>> {
        const cacheKey = JSON.stringify(opts);
        if (!this.cacheTop.has(cacheKey)) {
            let params = new HttpParams();
            if (opts.fechaInicio) params = params.set('fecha_inicio', opts.fechaInicio);
            if (opts.fechaFin)    params = params.set('fecha_fin',    opts.fechaFin);
            if (opts.criterio)    params = params.set('criterio',     opts.criterio);
            if (opts.limit)       params = params.set('limit',        opts.limit.toString());
            
            const req = this.get<ApiResponse<ReporteTopClientes>>(
                `${this.ENDPOINT}/analitica/top`, params
            ).pipe(shareReplay(1));
            this.cacheTop.set(cacheKey, req);
        }
        return this.cacheTop.get(cacheKey)!;
    }

    /** R-019: Clientes inactivos */
    getClientesInactivos(dias: number = 90): Observable<ApiResponse<ReporteClientesInactivos>> {
        if (!this.cacheInactivos.has(dias)) {
            const params = new HttpParams().set('dias', dias.toString());
            const req = this.get<ApiResponse<ReporteClientesInactivos>>(
                `${this.ENDPOINT}/analitica/inactivos`, params
            ).pipe(shareReplay(1));
            this.cacheInactivos.set(dias, req);
        }
        return this.cacheInactivos.get(dias)!;
    }

    /** R-020: Análisis de segmentación */
    getAnalisisClientes(periodoMeses: number = 3): Observable<ApiResponse<ReporteAnalisisClientes>> {
        if (!this.cacheAnalisis.has(periodoMeses)) {
            const params = new HttpParams().set('periodo_meses', periodoMeses.toString());
            const req = this.get<ApiResponse<ReporteAnalisisClientes>>(
                `${this.ENDPOINT}/analitica/analisis`, params
            ).pipe(shareReplay(1));
            this.cacheAnalisis.set(periodoMeses, req);
        }
        return this.cacheAnalisis.get(periodoMeses)!;
    }
}

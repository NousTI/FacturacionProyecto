import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Cliente, ClienteCreate, ClienteUpdate, ClienteStats } from '../../../../domain/models/cliente.model';

import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ClientesService extends BaseApiService {
    private readonly ENDPOINT = 'clientes';

    // Caching State
    private _clientes$ = new BehaviorSubject<Cliente[]>([]);
    private _stats$ = new BehaviorSubject<ClienteStats | null>(null);
    private _loaded = false;

    constructor(http: HttpClient) {
        super(http);
    }

    // Getters for the state
    get clientes$() { return this._clientes$.asObservable(); }
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
                    const current = this._clientes$.value;
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
                    const current = this._clientes$.value;
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
                const current = this._clientes$.value;
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
     * Forces a refresh from the server
     */
    refresh(): void {
        this._loaded = false;
        this.loadInitialData();
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Proveedor, ProveedorCreate, ProveedorUpdate } from '../../../../domain/models/proveedor.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ProveedoresService extends BaseApiService {
    private readonly ENDPOINT = 'proveedores';

    private _proveedores$ = new BehaviorSubject<Proveedor[] | null>(null);
    private _loaded = false;

    constructor(http: HttpClient) {
        super(http);
    }

    get proveedores$() {
        return this._proveedores$.pipe(
            filter(data => data !== null),
            map(data => data as Proveedor[])
        );
    }

    loadInitialData(): void {
        if (this._loaded) return;

        this.get<Proveedor[]>(this.ENDPOINT).subscribe(resp => {
            // La API devuelve directamente el array (response_model=List[ProveedorLectura])
            this._proveedores$.next(Array.isArray(resp) ? resp : []);
            this._loaded = true;
        });
    }

    getProveedores(): Observable<Proveedor[]> {
        if (!this._loaded) {
            this.loadInitialData();
        }
        return this.proveedores$;
    }

    getActivos(): Observable<Proveedor[]> {
        return this.getProveedores().pipe(
            map((list: Proveedor[]) => list.filter((p: Proveedor) => p.activo))
        );
    }

    createProveedor(proveedor: ProveedorCreate): Observable<Proveedor> {
        return this.post<Proveedor>(this.ENDPOINT, proveedor).pipe(
            tap(resp => {
                if (resp) {
                    const current = this._proveedores$.value || [];
                    this._proveedores$.next([resp, ...current]);
                }
            })
        );
    }

    updateProveedor(id: string, proveedor: ProveedorUpdate): Observable<Proveedor> {
        return this.patch<Proveedor>(`${this.ENDPOINT}/${id}`, proveedor).pipe(
            tap(resp => {
                if (resp) {
                    const current = this._proveedores$.value || [];
                    const index = current.findIndex(p => p.id === id);
                    if (index !== -1) {
                        current[index] = { ...current[index], ...resp };
                        this._proveedores$.next([...current]);
                    }
                }
            })
        );
    }

    deleteProveedor(id: string): Observable<any> {
        return this.delete<any>(`${this.ENDPOINT}/${id}`).pipe(
            tap(() => {
                const current = this._proveedores$.value || [];
                this._proveedores$.next(current.filter(p => p.id !== id));
            })
        );
    }

    toggleActivo(id: string): Observable<Proveedor> {
        return this.patch<Proveedor>(`${this.ENDPOINT}/${id}/toggle-activo`, {}).pipe(
            tap(updated => {
                if (updated) {
                    const current = this._proveedores$.value || [];
                    const index = current.findIndex(p => p.id === id);
                    if (index !== -1) {
                        current[index] = { ...current[index], ...updated };
                        this._proveedores$.next([...current]);
                    }
                }
            })
        );
    }

    refresh(): void {
        this._loaded = false;
        this._proveedores$.next(null);
        this.loadInitialData();
    }
}

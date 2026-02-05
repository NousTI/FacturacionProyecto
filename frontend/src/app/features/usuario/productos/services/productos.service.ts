import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Producto, ProductoStats } from '../../../../domain/models/producto.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ProductosService extends BaseApiService {
    private readonly ENDPOINT = 'productos';

    // Caching State
    private _productos$ = new BehaviorSubject<Producto[]>([]);
    private _stats$ = new BehaviorSubject<ProductoStats | null>(null);
    private _loaded = false;

    constructor(http: HttpClient) {
        super(http);
    }

    // Getters for the state
    get productos$() { return this._productos$.asObservable(); }
    get stats$() { return this._stats$.asObservable(); }

    /**
     * Loads data from API and updates local cache
     */
    loadInitialData(): void {
        if (this._loaded) return;

        this.get<ApiResponse<Producto[]>>(this.ENDPOINT).subscribe(resp => {
            if (resp && resp.detalles) {
                this._productos$.next(resp.detalles);
                this._loaded = true;
                this._calculateStatsLocally(resp.detalles);
            }
        });
    }

    private _calculateStatsLocally(productos: Producto[]) {
        const stats: ProductoStats = {
            total: productos.length,
            activos: productos.filter(p => p.activo).length,
            sin_stock: productos.filter(p => p.maneja_inventario && p.stock_actual <= 0).length,
            bajo_stock: productos.filter(p => p.maneja_inventario && p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
        };
        this._stats$.next(stats);
    }

    getProductos(): Observable<Producto[]> {
        if (!this._loaded) {
            this.loadInitialData();
        }
        return this.productos$;
    }

    createProducto(producto: Partial<Producto>): Observable<Producto> {
        return this.post<ApiResponse<Producto>>(this.ENDPOINT, producto).pipe(
            map(resp => resp.detalles),
            tap(newProd => {
                if (newProd) {
                    const current = this._productos$.value;
                    this._productos$.next([newProd, ...current]);
                    this._calculateStatsLocally(this._productos$.value);
                }
            })
        );
    }

    updateProducto(id: string, producto: Partial<Producto>): Observable<Producto> {
        return this.put<ApiResponse<Producto>>(`${this.ENDPOINT}/${id}`, producto).pipe(
            map(resp => resp.detalles),
            tap(updatedProd => {
                if (updatedProd) {
                    const current = this._productos$.value;
                    const index = current.findIndex(p => p.id === id);
                    if (index !== -1) {
                        current[index] = { ...current[index], ...updatedProd };
                        this._productos$.next([...current]);
                        this._calculateStatsLocally(current);
                    }
                }
            })
        );
    }

    deleteProducto(id: string): Observable<ApiResponse<null>> {
        return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
            tap(() => {
                const current = this._productos$.value;
                this._productos$.next(current.filter(p => p.id !== id));
                this._calculateStatsLocally(this._productos$.value);
            })
        );
    }

    refresh(): void {
        this._loaded = false;
        this.loadInitialData();
    }
}

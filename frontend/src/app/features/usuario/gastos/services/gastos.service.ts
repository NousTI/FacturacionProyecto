import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter, forkJoin } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Gasto, GastoCreate, GastoUpdate, GastoStats } from '../../../../domain/models/gasto.model';
import { CategoriaGasto, CategoriaGastoCreate, CategoriaGastoUpdate } from '../../../../domain/models/categoria-gasto.model';
import { PagoGasto, PagoGastoCreate, PagoGastoUpdate } from '../../../../domain/models/pago-gasto.model';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class GastosService extends BaseApiService {
  private readonly ENDPOINT = 'gastos';
  private readonly CATEGORIAS_ENDPOINT = 'gastos/categorias';
  private readonly PAGOS_ENDPOINT = 'gastos/pagos';
  private readonly PROVEEDORES_ENDPOINT = 'proveedores';

  private _gastos$ = new BehaviorSubject<Gasto[]>([]);
  private _categorias$ = new BehaviorSubject<CategoriaGasto[]>([]);
  private _pagos$ = new BehaviorSubject<PagoGasto[]>([]);
  private _proveedores$ = new BehaviorSubject<Proveedor[]>([]);
  private _stats$ = new BehaviorSubject<GastoStats | null>(null);
  
  private _loaded = false;
  private _categoriasLoaded = false;
  private _pagosLoaded = false;
  private _proveedoresLoaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  // --- Getters ---
  get gastos$() {
    return this._gastos$.asObservable();
  }
  get categorias$() {
    return this._categorias$.asObservable();
  }
  get pagos$() {
    return this._pagos$.asObservable();
  }
  get proveedores$() {
    return this._proveedores$.asObservable();
  }
  get stats$() {
    return this._stats$.asObservable();
  }

  // --- Initial Loading ---
  loadInitialData(force = false): void {
    if (!this._loaded || force) {
      this.get<ApiResponse<Gasto[]>>(this.ENDPOINT).subscribe(resp => {
        if (resp && resp.detalles) {
          this._gastos$.next(resp.detalles);
          this._loaded = true;
          this._calculateStatsLocally(resp.detalles);
        }
      });
    }

    if (!this._categoriasLoaded) {
      this.get<ApiResponse<CategoriaGasto[]>>(this.CATEGORIAS_ENDPOINT).subscribe(resp => {
        if (resp && resp.detalles) {
          this._categorias$.next(resp.detalles);
          this._categoriasLoaded = true;
        }
      });
    }

    if (!this._proveedoresLoaded) {
      this.get<ApiResponse<Proveedor[]>>(this.PROVEEDORES_ENDPOINT).subscribe(resp => {
        if (resp && resp.detalles) {
          this._proveedores$.next(resp.detalles);
          this._proveedoresLoaded = true;
        }
      });
    }
  }

  loadPagos(force = false): void {
    if (!this._pagosLoaded || force) {
      this.get<ApiResponse<PagoGasto[]>>(this.PAGOS_ENDPOINT).subscribe(resp => {
        if (resp && resp.detalles) {
          this._pagos$.next(resp.detalles);
          this._pagosLoaded = true;
        }
      });
    }
  }

  private _calculateStatsLocally(gastos: Gasto[]) {
    const stats: GastoStats = {
      total: gastos.length,
      pendientes: gastos.filter(g => g.estado_pago === 'pendiente').length,
      pagados: gastos.filter(g => g.estado_pago === 'pagado').length,
      total_monto: gastos.reduce((sum, g) => sum + Number(g.total || 0), 0)
    };
    this._stats$.next(stats);
  }

  // --- Gastos Crud ---
  createGasto(gasto: GastoCreate): Observable<Gasto> {
    return this.post<ApiResponse<Gasto>>(this.ENDPOINT, gasto).pipe(
      map(resp => resp.detalles),
      tap(newGasto => {
        if (newGasto) {
          const current = this._gastos$.value || [];
          this._gastos$.next([newGasto, ...current]);
          this._calculateStatsLocally(this._gastos$.value || []);
        }
      })
    );
  }

  updateGasto(id: string, gasto: GastoUpdate): Observable<Gasto> {
    return this.put<ApiResponse<Gasto>>(`${this.ENDPOINT}/${id}`, gasto).pipe(
      map(resp => resp.detalles),
      tap(updated => {
        if (updated) {
          const current = this._gastos$.value || [];
          const idx = current.findIndex(g => g.id === id);
          if (idx !== -1) {
            current[idx] = updated;
            this._gastos$.next([...current]);
            this._calculateStatsLocally(current);
          }
        }
      })
    );
  }

  deleteGasto(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        // Eliminar gasto de la lista
        const currentGastos = this._gastos$.value || [];
        this._gastos$.next(currentGastos.filter(g => g.id !== id));
        this._calculateStatsLocally(this._gastos$.value || []);

        // Eliminar pagos asociados al gasto de la lista de pagos
        const currentPagos = this._pagos$.value || [];
        this._pagos$.next(currentPagos.filter(p => p.gasto_id !== id));
      })
    );
  }

  // --- Categorias Crud ---
  createCategoria(categoria: CategoriaGastoCreate): Observable<CategoriaGasto> {
    return this.post<ApiResponse<CategoriaGasto>>(this.CATEGORIAS_ENDPOINT, categoria).pipe(
      map(resp => resp.detalles),
      tap(newCat => {
        if (newCat) {
          const current = this._categorias$.value || [];
          this._categorias$.next([newCat, ...current]);
        }
      })
    );
  }

  updateCategoria(id: string, categoria: CategoriaGastoUpdate): Observable<CategoriaGasto> {
    return this.put<ApiResponse<CategoriaGasto>>(`${this.CATEGORIAS_ENDPOINT}/${id}`, categoria).pipe(
      map(resp => resp.detalles),
      tap(updated => {
        if (updated) {
          const current = this._categorias$.value || [];
          const idx = current.findIndex(c => c.id === id);
          if (idx !== -1) {
            current[idx] = updated;
            this._categorias$.next([...current]);
          }
        }
      })
    );
  }

  deleteCategoria(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.CATEGORIAS_ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._categorias$.value || [];
        this._categorias$.next(current.filter(c => c.id !== id));
      })
    );
  }

  // --- Pagos Crud ---
  createPago(pago: PagoGastoCreate): Observable<PagoGasto> {
    return this.post<ApiResponse<PagoGasto>>(this.PAGOS_ENDPOINT, pago).pipe(
      map(resp => resp.detalles),
      tap(newPago => {
        if (newPago) {
          const current = this._pagos$.value || [];
          this._pagos$.next([newPago, ...current]);
          // Re-load gastos stats because a payment might have changed an expense status
          this.refresh();
        }
      })
    );
  }

  updatePago(id: string, pago: PagoGastoUpdate): Observable<PagoGasto> {
    return this.put<ApiResponse<PagoGasto>>(`${this.PAGOS_ENDPOINT}/${id}`, pago).pipe(
      map(resp => resp.detalles),
      tap(updated => {
        if (updated) {
          const current = this._pagos$.value || [];
          const idx = current.findIndex(p => p.id === id);
          if (idx !== -1) {
            current[idx] = updated;
            this._pagos$.next([...current]);
            this.refresh();
          }
        }
      })
    );
  }

  deletePago(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.PAGOS_ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._pagos$.value || [];
        this._pagos$.next(current.filter(p => p.id !== id));
        this.refresh();
      })
    );
  }

  refresh(): void {
    // Perform background fetches without clearing subjects to avoid UI flicker
    this.loadInitialData(true);
    this.loadPagos(true);
  }
}

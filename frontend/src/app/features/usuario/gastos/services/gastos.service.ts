import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter, forkJoin } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Gasto, GastoCreate, GastoUpdate, GastoStats } from '../../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class GastosService extends BaseApiService {
  private readonly ENDPOINT = 'gastos';
  private readonly CATEGORIAS_ENDPOINT = 'categoria-gasto';
  private readonly PROVEEDORES_ENDPOINT = 'proveedores';

  private _gastos$ = new BehaviorSubject<Gasto[] | null>(null);
  private _categorias$ = new BehaviorSubject<CategoriaGasto[] | null>(null);
  private _proveedores$ = new BehaviorSubject<Proveedor[] | null>(null);
  private _stats$ = new BehaviorSubject<GastoStats | null>(null);
  private _loaded = false;
  private _relatedLoaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get gastos$() {
    return this._gastos$.pipe(
      filter(data => data !== null),
      map(data => data as Gasto[])
    );
  }

  get categorias$() {
    return this._categorias$.pipe(
      filter(data => data !== null),
      map(data => data as CategoriaGasto[])
    );
  }

  get proveedores$() {
    return this._proveedores$.pipe(
      filter(data => data !== null),
      map(data => data as Proveedor[])
    );
  }

  get stats$() {
    return this._stats$.asObservable();
  }

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<Gasto[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._gastos$.next(resp.detalles);
        this._loaded = true;
        this._calculateStatsLocally(resp.detalles);
      }
    });

    if (!this._relatedLoaded) {
      this._loadRelatedData();
    }
  }

  private _loadRelatedData(): void {
    forkJoin([
      this.get<ApiResponse<CategoriaGasto[]>>(this.CATEGORIAS_ENDPOINT),
      this.get<ApiResponse<Proveedor[]>>(this.PROVEEDORES_ENDPOINT)
    ]).subscribe({
      next: (responses) => {
        if (responses[0] && responses[0].detalles) {
          this._categorias$.next(responses[0].detalles);
        }
        if (responses[1] && responses[1].detalles) {
          this._proveedores$.next(responses[1].detalles);
        }
        this._relatedLoaded = true;
      },
      error: (err) => console.error('Error cargando datos relacionados:', err)
    });
  }

  private _calculateStatsLocally(gastos: Gasto[]) {
    const stats: GastoStats = {
      total: gastos.length,
      pendientes: gastos.filter(g => g.estado_pago === 'pendiente').length,
      pagados: gastos.filter(g => g.estado_pago === 'pagado').length,
      total_monto: gastos.reduce((sum, g) => sum + g.total, 0)
    };
    this._stats$.next(stats);
  }

  getGastos(): Observable<Gasto[]> {
    if (!this._loaded) {
      this.loadInitialData();
    }
    return this.gastos$;
  }

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
      tap(updatedGasto => {
        if (updatedGasto) {
          const current = this._gastos$.value || [];
          const index = current.findIndex(g => g.id === id);
          if (index !== -1) {
            current[index] = updatedGasto;
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
        const current = this._gastos$.value || [];
        this._gastos$.next(current.filter(g => g.id !== id));
        this._calculateStatsLocally(this._gastos$.value || []);
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}

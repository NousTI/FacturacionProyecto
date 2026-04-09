import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { MovimientoInventario } from '../../../../domain/models/inventario.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class InventariosService extends BaseApiService {
  private readonly ENDPOINT = 'inventarios';

  private _movimientos$ = new BehaviorSubject<MovimientoInventario[] | null>(null);
  private _stats$ = new BehaviorSubject<any>(null);
  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get movimientos$() {
    return this._movimientos$.pipe(
      filter(data => data !== null),
      map(data => data as MovimientoInventario[])
    );
  }

  get stats$() {
    return this._stats$.asObservable();
  }

  loadInitialData(filtros: any = {}): void {
    const params = this.buildQueryParams(filtros);
    this.get<ApiResponse<MovimientoInventario[]>>(`${this.ENDPOINT}${params}`).subscribe(resp => {
      if (resp && resp.detalles) {
        this._movimientos$.next(resp.detalles);
        this._loaded = true;
      }
    });

    this.getStats().subscribe();
  }

  getStats(): Observable<any> {
    return this.get<ApiResponse<any>>(`${this.ENDPOINT}/stats`).pipe(
      map(resp => resp.detalles),
      tap(stats => this._stats$.next(stats))
    );
  }

  private buildQueryParams(filtros: any): string {
    const keys = Object.keys(filtros).filter(k => filtros[k] !== null && filtros[k] !== '');
    if (keys.length === 0) return '';
    const query = keys.map(k => `${k}=${filtros[k]}`).join('&');
    return `?${query}`;
  }

  getMovimientos(filtros: any = {}): Observable<MovimientoInventario[]> {
    this.loadInitialData(filtros);
    return this.movimientos$;
  }

  createMovimiento(mov: any): Observable<MovimientoInventario> {
    return this.post<ApiResponse<MovimientoInventario>>(this.ENDPOINT, mov).pipe(
      map(resp => resp.detalles),
      tap(newMov => {
        if (newMov) {
          const current = this._movimientos$.value || [];
          this._movimientos$.next([newMov, ...current]);
        }
      })
    );
  }

  deleteMovimiento(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._movimientos$.value || [];
        this._movimientos$.next(current.filter(m => m.id !== id));
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}

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

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<MovimientoInventario[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._movimientos$.next(resp.detalles);
        this._loaded = true;
      }
    });
  }

  getMovimientos(): Observable<MovimientoInventario[]> {
    if (!this._loaded) {
      this.loadInitialData();
    }
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

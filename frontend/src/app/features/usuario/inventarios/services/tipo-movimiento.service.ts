import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { TipoMovimiento } from '../../../../domain/models/inventario.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

export interface TipoMovimientoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface TipoMovimientoUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TipoMovimientoService extends BaseApiService {
  private readonly ENDPOINT = 'tipo-movimiento';

  private _tipos$ = new BehaviorSubject<TipoMovimiento[] | null>(null);
  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get tipos$() {
    return this._tipos$.pipe(
      filter(data => data !== null),
      map(data => data as TipoMovimiento[])
    );
  }

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<TipoMovimiento[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._tipos$.next(resp.detalles);
        this._loaded = true;
      }
    });
  }

  createTipo(tipo: TipoMovimientoCreate): Observable<TipoMovimiento> {
    return this.post<ApiResponse<TipoMovimiento>>(this.ENDPOINT, tipo).pipe(
      map(resp => resp.detalles),
      tap(newTipo => {
        if (newTipo) {
          const current = this._tipos$.value || [];
          this._tipos$.next([newTipo, ...current]);
        }
      })
    );
  }

  updateTipo(id: string, tipo: TipoMovimientoUpdate): Observable<TipoMovimiento> {
    return this.put<ApiResponse<TipoMovimiento>>(`${this.ENDPOINT}/${id}`, tipo).pipe(
      map(resp => resp.detalles),
      tap(updatedTipo => {
        if (updatedTipo) {
          const current = this._tipos$.value || [];
          const index = current.findIndex(t => t.id === id);
          if (index !== -1) {
            current[index] = updatedTipo;
            this._tipos$.next([...current]);
          }
        }
      })
    );
  }

  deleteTipo(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._tipos$.value || [];
        this._tipos$.next(current.filter(t => t.id !== id));
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}

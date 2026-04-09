import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { UnidadMedida } from '../../../../domain/models/inventario.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

export interface UnidadMedidaCreate {
  codigo: string;
  nombre: string;
  abreviatura?: string;
  activo?: boolean;
}

export interface UnidadMedidaUpdate {
  codigo?: string;
  nombre?: string;
  abreviatura?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService extends BaseApiService {
  private readonly ENDPOINT = 'unidad-medida';

  private _unidades$ = new BehaviorSubject<UnidadMedida[] | null>(null);
  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get unidades$() {
    return this._unidades$.pipe(
      filter(data => data !== null),
      map(data => data as UnidadMedida[])
    );
  }

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<UnidadMedida[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._unidades$.next(resp.detalles);
        this._loaded = true;
      }
    });
  }

  createUnidad(unidad: UnidadMedidaCreate): Observable<UnidadMedida> {
    return this.post<ApiResponse<UnidadMedida>>(this.ENDPOINT, unidad).pipe(
      map(resp => resp.detalles),
      tap(newUnidad => {
        if (newUnidad) {
          const current = this._unidades$.value || [];
          this._unidades$.next([newUnidad, ...current]);
        }
      })
    );
  }

  updateUnidad(id: string, unidad: UnidadMedidaUpdate): Observable<UnidadMedida> {
    return this.put<ApiResponse<UnidadMedida>>(`${this.ENDPOINT}/${id}`, unidad).pipe(
      map(resp => resp.detalles),
      tap(updatedUnidad => {
        if (updatedUnidad) {
          const current = this._unidades$.value || [];
          const index = current.findIndex(u => u.id === id);
          if (index !== -1) {
            current[index] = updatedUnidad;
            this._unidades$.next([...current]);
          }
        }
      })
    );
  }

  deleteUnidad(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._unidades$.value || [];
        this._unidades$.next(current.filter(u => u.id !== id));
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}

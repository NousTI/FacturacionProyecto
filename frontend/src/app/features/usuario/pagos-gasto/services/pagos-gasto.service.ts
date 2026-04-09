import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { PagoGasto, PagoGastoCreate, PagoGastoUpdate } from '../../../../domain/models/pago-gasto.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PagosGastoService extends BaseApiService {
  private readonly ENDPOINT = 'pagos-gasto';

  private _pagos$ = new BehaviorSubject<PagoGasto[] | null>(null);
  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get pagos$() {
    return this._pagos$.pipe(
      filter(data => data !== null),
      map(data => data as PagoGasto[])
    );
  }

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<PagoGasto[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._pagos$.next(resp.detalles);
        this._loaded = true;
      }
    });
  }

  getPagos(): Observable<PagoGasto[]> {
    if (!this._loaded) {
      this.loadInitialData();
    }
    return this.pagos$;
  }

  createPago(pago: PagoGastoCreate): Observable<PagoGasto> {
    return this.post<ApiResponse<PagoGasto>>(this.ENDPOINT, pago).pipe(
      map(resp => resp.detalles),
      tap(newPago => {
        if (newPago) {
          const current = this._pagos$.value || [];
          this._pagos$.next([newPago, ...current]);
        }
      })
    );
  }

  updatePago(id: string, pago: PagoGastoUpdate): Observable<PagoGasto> {
    return this.put<ApiResponse<PagoGasto>>(`${this.ENDPOINT}/${id}`, pago).pipe(
      map(resp => resp.detalles),
      tap(updatedPago => {
        if (updatedPago) {
          const current = this._pagos$.value || [];
          const index = current.findIndex(p => p.id === id);
          if (index !== -1) {
            current[index] = updatedPago;
            this._pagos$.next([...current]);
          }
        }
      })
    );
  }

  deletePago(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._pagos$.value || [];
        this._pagos$.next(current.filter(p => p.id !== id));
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}

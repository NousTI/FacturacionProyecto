import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { ApiResponse } from '../../../../core/api/api-response.model';
import { 
  FacturaProgramada, 
  FacturaProgramadaCreacion, 
  HistorialProgramacion 
} from '../../../../domain/models/facturacion-programada.model';

@Injectable({
  providedIn: 'root'
})
export class FacturacionProgramadaService extends BaseApiService {
  private readonly ENDPOINT = 'facturacion-programada';
  
  private _programaciones$ = new BehaviorSubject<FacturaProgramada[] | null>(null);
  private _loaded = false;

  constructor(http: HttpClient) { 
    super(http);
  }

  get programaciones$() {
    return this._programaciones$.asObservable();
  }

  /**
   * Carga inicial o desde cache
   */
  loadInitialData(): void {
    if (this._loaded) return;
    this.refresh();
  }

  /**
   * Fuerza la recarga desde el servidor
   */
  refresh(): void {
    this.get<FacturaProgramada[]>(`${this.ENDPOINT}/`).subscribe({
      next: (data) => {
        this._programaciones$.next(data);
        this._loaded = true;
      },
      error: (err) => {
        console.error('Error al cargar facturaciones programadas', err);
        this._programaciones$.next([]); // Evita spinner infinito en caso de error
      }
    });
  }

  listar(): Observable<FacturaProgramada[]> {
    if (!this._loaded) {
      this.refresh();
    }
    return this.programaciones$.pipe(
      map(data => data || [])
    );
  }

  crear(datos: FacturaProgramadaCreacion): Observable<FacturaProgramada> {
    return this.post<FacturaProgramada>(`${this.ENDPOINT}/`, datos).pipe(
      tap(newProg => {
        const current = this._programaciones$.value || [];
        this._programaciones$.next([newProg, ...current]);
      })
    );
  }

  actualizar(id: string, datos: Partial<FacturaProgramadaCreacion>): Observable<FacturaProgramada> {
    return this.put<FacturaProgramada>(`${this.ENDPOINT}/${id}`, datos).pipe(
      tap(updated => {
        const current = this._programaciones$.value || [];
        const index = current.findIndex(p => p.id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...updated };
          this._programaciones$.next([...current]);
        }
      })
    );
  }

  eliminar(id: string): Observable<any> {
    return this.delete(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._programaciones$.value || [];
        this._programaciones$.next(current.filter(p => p.id !== id));
      })
    );
  }

  obtenerHistorial(id: string, fechaDesde?: string, fechaHasta?: string): Observable<HistorialProgramacion[]> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);
    
    return this.get<HistorialProgramacion[]>(`${this.ENDPOINT}/${id}/historial`, params);
  }
}

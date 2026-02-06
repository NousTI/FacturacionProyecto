import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, shareReplay, switchMap } from 'rxjs/operators';
import { PuntosEmisionApiService } from '../../../../core/api/puntos-emision-api.service';
import { UiService } from '../../../../shared/services/ui.service';
import {
  PuntoEmision,
  PuntoEmisionCreate,
  PuntoEmisionResponse,
} from '../../../../domain/models/punto-emision.model';

interface PuntosEmisionStats {
  total: number;
  activos: number;
  con_facturacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class PuntosEmisionService {
  // Cache con datos
  private puntosEmisionCache$ = new BehaviorSubject<PuntoEmision[]>([]);
  private statsCache$ = new BehaviorSubject<PuntosEmisionStats | null>(null);
  
  // Trigger para refresh
  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

  constructor(
    private apiService: PuntosEmisionApiService,
    private uiService: UiService
  ) {
    // Configurar el observador que se auto-actualiza cuando se emite refreshTrigger$
    this.refreshTrigger$.pipe(
      switchMap(() => this.apiService.listar()),
      tap(data => {
        this.puntosEmisionCache$.next(data);
        // Actualizar stats cuando se cargan los datos
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error loading puntos emisión:', err);
        this.uiService.showToast('Error al cargar puntos emisión', 'danger', 'No se pudieron cargar los datos. Intenta nuevamente.');
        return of([]);
      })
    ).subscribe();

    // Cargar datos iniciales
    this.refreshTrigger$.next();
  }

  /**
   * Obtiene el listado completo de puntos emisión (desde caché)
   */
  getPuntosEmision(): Observable<PuntoEmision[]> {
    return this.puntosEmisionCache$.asObservable();
  }

  /**
   * Crea un nuevo punto de emisión
   */
  crear(datos: PuntoEmisionCreate): Observable<PuntoEmisionResponse> {
    return this.apiService.crear(datos).pipe(
      tap((response) => {
        this.uiService.showToast(`✅ Punto de Emisión creado`, 'success', `El punto de emisión "${datos.nombre}" ha sido registrado exitosamente.`);
        // Actualizar caché solo con el nuevo elemento
        const current = this.puntosEmisionCache$.value;
        this.puntosEmisionCache$.next([...current, response as any]);
        // Actualizar stats
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error creating punto emisión:', err);
        this.uiService.showToast('❌ Error al crear punto de emisión', 'danger', err.error?.message || 'Verifica que el código no exista o los datos sean correctos.');
        throw err;
      })
    );
  }

  /**
   * Actualiza un punto de emisión existente
   */
  actualizar(id: string, datos: Partial<PuntoEmisionCreate>): Observable<PuntoEmisionResponse> {
    return this.apiService.actualizar(id, datos).pipe(
      tap((response) => {
        this.uiService.showToast('✅ Cambios guardados', 'success', 'Los datos del punto de emisión se actualizaron correctamente.');
        // Actualizar el elemento en caché sin recargar todo
        const current = this.puntosEmisionCache$.value;
        const index = current.findIndex(pe => pe.id === id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = response as any;
          this.puntosEmisionCache$.next(updated);
        }
      }),
      catchError(err => {
        console.error('Error updating punto emisión:', err);
        this.uiService.showToast('❌ Error al actualizar', 'danger', err.error?.message || 'No se pudieron guardar los cambios. Intenta nuevamente.');
        throw err;
      })
    );
  }

  /**
   * Elimina un punto de emisión
   */
  eliminar(id: string, nombre: string): Observable<any> {
    return this.apiService.eliminar(id).pipe(
      tap(() => {
        this.uiService.showToast('✅ Eliminado correctamente', 'success', `El punto de emisión "${nombre}" ha sido removido del sistema.`);
        // Remover del caché sin recargar todo
        const current = this.puntosEmisionCache$.value;
        const filtered = current.filter(pe => pe.id !== id);
        this.puntosEmisionCache$.next(filtered);
        // Actualizar stats
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error deleting punto emisión:', err);
        this.uiService.showToast('❌ No se puede eliminar', 'danger', err.error?.message || 'Verifica que el punto de emisión no tenga facturas asociadas.');
        throw err;
      })
    );
  }

  /**
   * Obtiene estadísticas de puntos emisión
   */
  getEstadisticas(): Observable<PuntosEmisionStats | null> {
    return this.statsCache$.asObservable();
  }

  /**
   * Actualiza las estadísticas internamente
   */
  private actualizarStats(): void {
    const puntosEmision = this.puntosEmisionCache$.value;
    const stats: PuntosEmisionStats = {
      total: puntosEmision.length,
      activos: puntosEmision.filter(pe => pe.activo).length,
      con_facturacion: puntosEmision.filter(pe => (pe as any).facturacion_count > 0).length
    };
    this.statsCache$.next(stats);
  }

  /**
   * Fuerza la recarga completa de datos
   */
  refresh(): void {
    this.refreshTrigger$.next();
  }

  /**
   * Obtiene puntos emisión de un establecimiento específico
   */
  getPuntosEmisionPorEstablecimiento(establecimientoId: string): Observable<PuntoEmision[]> {
    return this.apiService.listar(100, 0, establecimientoId).pipe(
      catchError(err => {
        console.error('Error loading puntos emisión for establecimiento:', err);
        return of([]);
      })
    );
  }
}

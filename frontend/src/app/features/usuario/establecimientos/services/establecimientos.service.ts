import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, shareReplay, switchMap } from 'rxjs/operators';
import { EstablecimientosApiService } from '../../../../core/api/establecimientos-api.service';
import { UiService } from '../../../../shared/services/ui.service';
import {
  Establecimiento,
  EstablecimientoCreate,
  EstablecimientoResponse,
} from '../../../../domain/models/establecimiento.model';

interface EstablecimientoStats {
  total: number;
  activos: number;
  con_puntos_emision: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstablecimientosService {
  // Cache con datos
  private establecimientosCache$ = new BehaviorSubject<Establecimiento[]>([]);
  private statsCache$ = new BehaviorSubject<EstablecimientoStats | null>(null);
  
  // Trigger para refresh
  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

  constructor(
    private apiService: EstablecimientosApiService,
    private uiService: UiService
  ) {
    // Configurar el observador que se auto-actualiza cuando se emite refreshTrigger$
    this.refreshTrigger$.pipe(
      switchMap(() => this.apiService.listar()),
      tap(data => {
        this.establecimientosCache$.next(data);
        // Actualizar stats cuando se cargan los datos
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error loading establecimientos:', err);
        this.uiService.showToast('Error al cargar establecimientos', 'danger', 'No se pudieron cargar los datos. Intenta nuevamente.');
        return of([]);
      })
    ).subscribe();

    // Cargar datos iniciales
    this.refreshTrigger$.next();
  }

  /**
   * Obtiene el listado completo de establecimientos (desde caché)
   */
  getEstablecimientos(): Observable<Establecimiento[]> {
    return this.establecimientosCache$.asObservable();
  }

  /**
   * Crea un nuevo establecimiento
   */
  crear(datos: EstablecimientoCreate): Observable<EstablecimientoResponse> {
    return this.apiService.crear(datos).pipe(
      tap((response) => {
        this.uiService.showToast(`✅ Establecimiento creado`, 'success', `El establecimiento "${datos.nombre}" ha sido registrado exitosamente.`);
        // Actualizar caché solo con el nuevo elemento
        const current = this.establecimientosCache$.value;
        this.establecimientosCache$.next([...current, response as any]);
        // Actualizar stats
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error creating establecimiento:', err);
        this.uiService.showToast('❌ Error al crear establecimiento', 'danger', err.error?.message || 'Verifica que el código SRI no exista o los datos sean correctos.');
        throw err;
      })
    );
  }

  /**
   * Actualiza un establecimiento existente
   */
  actualizar(id: string, datos: Partial<EstablecimientoCreate>): Observable<EstablecimientoResponse> {
    return this.apiService.actualizar(id, datos).pipe(
      tap((response) => {
        this.uiService.showToast('✅ Cambios guardados', 'success', 'Los datos del establecimiento se actualizaron correctamente.');
        // Actualizar el elemento en caché sin recargar todo
        const current = this.establecimientosCache$.value;
        const index = current.findIndex(e => e.id === id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = response as any;
          this.establecimientosCache$.next(updated);
        }
      }),
      catchError(err => {
        console.error('Error updating establecimiento:', err);
        this.uiService.showToast('❌ Error al actualizar', 'danger', err.error?.message || 'No se pudieron guardar los cambios. Intenta nuevamente.');
        throw err;
      })
    );
  }

  /**
   * Elimina un establecimiento
   */
  eliminar(id: string, nombre: string): Observable<any> {
    return this.apiService.eliminar(id).pipe(
      tap(() => {
        this.uiService.showToast('✅ Eliminado correctamente', 'success', `El establecimiento "${nombre}" ha sido removido del sistema.`);
        // Remover del caché sin recargar todo
        const current = this.establecimientosCache$.value;
        const filtered = current.filter(e => e.id !== id);
        this.establecimientosCache$.next(filtered);
        // Actualizar stats
        this.actualizarStats();
      }),
      catchError(err => {
        console.error('Error deleting establecimiento:', err);
        this.uiService.showToast('❌ No se puede eliminar', 'danger', err.error?.message || 'Verifica que el establecimiento no tenga puntos de emisión asociados.');
        throw err;
      })
    );
  }

  /**
   * Obtiene estadísticas de establecimientos
   */
  getEstadisticas(): Observable<EstablecimientoStats | null> {
    return this.statsCache$.asObservable();
  }

  /**
   * Actualiza las estadísticas internamente
   */
  private actualizarStats(): void {
    const establecimientos = this.establecimientosCache$.value;
    const stats: EstablecimientoStats = {
      total: establecimientos.length,
      activos: establecimientos.filter(e => e.activo).length,
      con_puntos_emision: establecimientos.filter(e => (e as any).puntos_emision_count > 0).length
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
   * Obtiene establecimientos de una empresa específica
   */
  getEstablecimientosPorEmpresa(empresaId: string): Observable<Establecimiento[]> {
    return this.apiService.listar(100, 0, empresaId).pipe(
      catchError(err => {
        console.error('Error loading establecimientos for empresa:', err);
        return of([]);
      })
    );
  }
}

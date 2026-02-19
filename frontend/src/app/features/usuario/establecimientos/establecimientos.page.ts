import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, map, Observable } from 'rxjs';

import { EstablecimientoStatsComponent } from './components/establecimiento-stats/establecimiento-stats.component';
import { EstablecimientoActionsComponent } from './components/establecimiento-actions/establecimiento-actions.component';
import { EstablecimientoTableComponent } from './components/establecimiento-table/establecimiento-table.component';
import { CreateEstablecimientoModalComponent } from './components/create-establecimiento-modal/create-establecimiento-modal.component';
import { EstablecimientoDetailModalComponent } from './components/establecimiento-detail-modal/establecimiento-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { EstablecimientosService } from './services/establecimientos.service';
import { UiService } from '../../../shared/services/ui.service';
import { Establecimiento } from '../../../domain/models/establecimiento.model';

interface EstablecimientoStats {
  total: number;
  activos: number;
  con_puntos_emision: number;
}

@Component({
  selector: 'app-usuario-establecimientos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    EstablecimientoStatsComponent,
    EstablecimientoActionsComponent,
    EstablecimientoTableComponent,
    CreateEstablecimientoModalComponent,
    EstablecimientoDetailModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="establecimientos-page-container">

      <!-- ESTADÍSTICAS -->
      <app-establecimiento-stats
        [total]="(stats$ | async)?.total ?? 0"
        [active]="(stats$ | async)?.activos ?? 0"
        [con_puntos_emision]="(stats$ | async)?.con_puntos_emision ?? 0"
      ></app-establecimiento-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-establecimiento-actions
        [(searchQuery)]="searchQuery"
        (onFilterChange)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-establecimiento-actions>

      <!-- TABLA DE ESTABLECIMIENTOS -->
      <app-establecimiento-table
        [establecimientos]="filteredEstablecimientos"
        (onAction)="handleAction($event)"
      ></app-establecimiento-table>

      <!-- MODAL DE CREACIÓN/EDICIÓN -->
      <app-create-establecimiento-modal
        *ngIf="showCreateModal"
        [establecimiento]="selectedEstablecimiento"
        [loading]="isSaving"
        (onSave)="saveEstablecimiento($event)"
        (onClose)="showCreateModal = false"
      ></app-create-establecimiento-modal>

      <!-- MODAL DE DETALLES -->
      <app-establecimiento-detail-modal
        *ngIf="showDetailModal && selectedEstablecimiento"
        [establecimiento]="selectedEstablecimiento"
        (onClose)="showDetailModal = false"
      ></app-establecimiento-detail-modal>

      <!-- MODAL DE CONFIRMACIÓN PARA ELIMINAR -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        title="¿Eliminar Establecimiento?"
        [message]="'¿Estás seguro de que deseas eliminar ' + selectedEstablecimiento?.nombre + '? Esta acción no se puede deshacer.'"
        confirmText="Eliminar Establecimiento"
        type="danger"
        icon="bi-trash3-fill"
        [loading]="isDeleting"
        (onConfirm)="deleteEstablecimiento()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .establecimientos-page-container {
      min-height: 100vh;
      background: var(--bg-main);
      padding: 0;
    }
  `]
})
export class EstablecimientosPage implements OnInit, OnDestroy {
  // Observables
  establecimientos$: Observable<Establecimiento[]>;
  stats$: Observable<EstablecimientoStats | null>;

  // Local filtered list
  filteredEstablecimientos: Establecimiento[] = [];

  // UI State
  searchQuery: string = '';
  filters = { estado: 'ALL' };
  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  selectedEstablecimiento: Establecimiento | null = null;

  // Loading States
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

  // RxJS
  private destroy$ = new Subject<void>();

  constructor(
    private establecimientosService: EstablecimientosService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {
    this.establecimientos$ = this.establecimientosService.getEstablecimientos();
    this.stats$ = this.establecimientosService.getEstadisticas();
  }

  ngOnInit() {
    // Subscribe to establecimientos and apply filters
    this.establecimientos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.filteredEstablecimientos = this.applyFilters(data);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza el listado de establecimientos
   */
  refresh() {
    this.isLoading = true;
    this.establecimientosService.refresh();
    setTimeout(() => this.isLoading = false, 500);
  }

  /**
   * Maneja cambios de filtros
   */
  handleFilters(event: any) {
    this.filters.estado = event.estado;
    // Reaplicar filtros solo a los datos actuales
    this.applyFiltersToList();
  }

  /**
   * Aplica filtros al listado actual
   */
  applyFiltersToList() {
    // Solo procesa el filtering, sin recargar datos
    this.cdr.markForCheck();
  }

  /**
   * Aplica filtros de búsqueda y estado
   */
  applyFilters(data: Establecimiento[]): Establecimiento[] {
    return data.filter(est => {
      // Filtro por estado
      if (this.filters.estado !== 'ALL') {
        const estadoMatch = this.filters.estado === 'ACTIVO' ? est.activo : !est.activo;
        if (!estadoMatch) return false;
      }

      // Filtro por búsqueda
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return (
          est.codigo.toLowerCase().includes(query) ||
          est.nombre.toLowerCase().includes(query) ||
          est.direccion.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }

  /**
   * Maneja acciones de tabla (view, edit, delete)
   */
  handleAction(event: any) {
    this.selectedEstablecimiento = event.establecimiento;

    if (event.type === 'view') {
      this.showDetailModal = true;
    } else if (event.type === 'edit') {
      this.showCreateModal = true;
    } else if (event.type === 'delete') {
      this.showConfirmModal = true;
    }
  }

  /**
   * Abre modal de creación
   */
  openCreateModal() {
    this.selectedEstablecimiento = null;
    this.showCreateModal = true;
  }

  /**
   * Guarda or actualiza un establecimiento
   */
  saveEstablecimiento(datos: any) {
    this.isSaving = true;

    if (this.selectedEstablecimiento) {
      // UPDATE
      this.establecimientosService.actualizar(this.selectedEstablecimiento.id, datos)
        .pipe(finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.showCreateModal = false;
            this.selectedEstablecimiento = null;
          },
          error: (err) => {
            console.error('Error updating:', err);
          }
        });
    } else {
      // CREATE
      this.establecimientosService.crear(datos)
        .pipe(finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.showCreateModal = false;
            this.selectedEstablecimiento = null;
          },
          error: (err) => {
            console.error('Error creating:', err);
          }
        });
    }
  }

  /**
   * Elimina un establecimiento
   */
  deleteEstablecimiento() {
    if (!this.selectedEstablecimiento) return;

    this.isDeleting = true;
    const nombreEstablecimiento = this.selectedEstablecimiento.nombre;

    this.establecimientosService.eliminar(
      this.selectedEstablecimiento.id,
      nombreEstablecimiento
    )
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showConfirmModal = false;
          this.selectedEstablecimiento = null;
        },
        error: (err) => {
          console.error('Error deleting:', err);
        }
      });
  }
}

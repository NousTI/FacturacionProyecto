import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, map, Observable } from 'rxjs';

import { PuntosEmisionStatsComponent } from './components/puntos-emision-stats/puntos-emision-stats.component';
import { PuntosEmisionActionsComponent } from './components/puntos-emision-actions/puntos-emision-actions.component';
import { PuntosEmisionTableComponent } from './components/puntos-emision-table/puntos-emision-table.component';
import { CreatePuntosEmisionModalComponent } from './components/create-puntos-emision-modal/create-puntos-emision-modal.component';
import { PuntosEmisionDetailModalComponent } from './components/puntos-emision-detail-modal/puntos-emision-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { PuntosEmisionService } from './services/puntos-emision.service';
import { UiService } from '../../../shared/services/ui.service';
import { PuntoEmision } from '../../../domain/models/punto-emision.model';

interface PuntosEmisionStats {
  total: number;
  activos: number;
  con_facturacion: number;
}

@Component({
  selector: 'app-usuario-puntos-emision',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PuntosEmisionStatsComponent,
    PuntosEmisionActionsComponent,
    PuntosEmisionTableComponent,
    CreatePuntosEmisionModalComponent,
    PuntosEmisionDetailModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="puntos-emision-page-container">

      <!-- ESTADÍSTICAS -->
      <app-puntos-emision-stats
        [total]="(stats$ | async)?.total ?? 0"
        [active]="(stats$ | async)?.activos ?? 0"
        [con_facturacion]="(stats$ | async)?.con_facturacion ?? 0"
      ></app-puntos-emision-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-puntos-emision-actions
        [(searchQuery)]="searchQuery"
        (onFilterChange)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-puntos-emision-actions>

      <!-- TABLA DE PUNTOS EMISIÓN -->
      <app-puntos-emision-table
        [puntosEmision]="filteredPuntosEmision"
        (onAction)="handleAction($event)"
      ></app-puntos-emision-table>

      <!-- MODAL DE CREACIÓN/EDICIÓN -->
      <app-create-puntos-emision-modal
        *ngIf="showCreateModal"
        [puntoEmision]="selectedPuntoEmision"
        [loading]="isSaving"
        (onSave)="savePuntoEmision($event)"
        (onClose)="showCreateModal = false"
      ></app-create-puntos-emision-modal>

      <!-- MODAL DE DETALLES -->
      <app-puntos-emision-detail-modal
        *ngIf="showDetailModal && selectedPuntoEmision"
        [puntoEmision]="selectedPuntoEmision"
        (onClose)="showDetailModal = false"
      ></app-puntos-emision-detail-modal>

      <!-- MODAL DE CONFIRMACIÓN PARA ELIMINAR -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        title="¿Eliminar Punto de Emisión?"
        [message]="'¿Estás seguro de que deseas eliminar el punto de emisión ' + selectedPuntoEmision?.nombre + '? Esta acción no se puede deshacer.'"
        confirmText="Eliminar Punto de Emisión"
        type="danger"
        icon="bi-trash3-fill"
        [loading]="isDeleting"
        (onConfirm)="deletePuntoEmision()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .puntos-emision-page-container {
      min-height: 100vh;
      background: #f8fafc;
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: #161d35;
      margin-bottom: 0.25rem;
      letter-spacing: -0.01em;
    }

    .page-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0;
    }

    .btn-refresh-premium {
      background: white;
      border: 1px solid #e2e8f0;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .btn-refresh-premium:hover {
      background: #f8fafc;
      color: #161d35;
      border-color: #cbd5e1;
      transform: translateY(-2px);
    }

    .btn-refresh-premium.spinning i {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .puntos-emision-page-container {
        background: #f8fafc;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .page-subtitle {
        font-size: 0.85rem;
      }
    }
  `]
})
export class PuntosEmisionPage implements OnInit, OnDestroy {
  // Observables
  puntosEmision$: Observable<PuntoEmision[]>;
  stats$: Observable<PuntosEmisionStats | null>;

  // Local filtered list
  filteredPuntosEmision: PuntoEmision[] = [];

  // UI State
  searchQuery: string = '';
  filters = { estado: 'ALL' };
  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  selectedPuntoEmision: PuntoEmision | null = null;

  // Loading States
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

  // RxJS
  private destroy$ = new Subject<void>();

  constructor(
    private puntosEmisionService: PuntosEmisionService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {
    this.puntosEmision$ = this.puntosEmisionService.getPuntosEmision();
    this.stats$ = this.puntosEmisionService.getEstadisticas();
  }

  ngOnInit() {
    // Subscribe to puntosEmision and apply filters
    this.puntosEmision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.filteredPuntosEmision = this.applyFilters(data);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza el listado de puntos emisión
   */
  refresh() {
    this.isLoading = true;
    this.puntosEmisionService.refresh();
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
  applyFilters(data: PuntoEmision[]): PuntoEmision[] {
    return data.filter(pe => {
      // Filtro por estado
      if (this.filters.estado !== 'ALL') {
        const estadoMatch = this.filters.estado === 'ACTIVO' ? pe.activo : !pe.activo;
        if (!estadoMatch) return false;
      }

      // Filtro por búsqueda
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return (
          pe.codigo.toLowerCase().includes(query) ||
          pe.nombre.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }

  /**
   * Maneja acciones de tabla (view, edit, delete)
   */
  handleAction(event: any) {
    this.selectedPuntoEmision = event.puntoEmision;

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
    this.selectedPuntoEmision = null;
    this.showCreateModal = true;
  }

  /**
   * Guarda o actualiza un punto de emisión
   */
  savePuntoEmision(datos: any) {
    this.isSaving = true;

    if (this.selectedPuntoEmision) {
      // UPDATE
      this.puntosEmisionService.actualizar(this.selectedPuntoEmision.id, datos)
        .pipe(finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.showCreateModal = false;
            this.selectedPuntoEmision = null;
          },
          error: (err) => {
            console.error('Error updating:', err);
          }
        });
    } else {
      // CREATE
      this.puntosEmisionService.crear(datos)
        .pipe(finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.showCreateModal = false;
            this.selectedPuntoEmision = null;
          },
          error: (err) => {
            console.error('Error creating:', err);
          }
        });
    }
  }

  /**
   * Elimina un punto de emisión
   */
  deletePuntoEmision() {
    if (!this.selectedPuntoEmision) return;

    this.isDeleting = true;
    const nombrePuntoEmision = this.selectedPuntoEmision.nombre;

    this.puntosEmisionService.eliminar(
      this.selectedPuntoEmision.id,
      nombrePuntoEmision
    )
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showConfirmModal = false;
          this.selectedPuntoEmision = null;
        },
        error: (err) => {
          console.error('Error deleting:', err);
        }
      });
  }
}

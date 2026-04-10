import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
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
import { PermissionsService } from '../../../core/auth/permissions.service';
import { ESTABLECIMIENTOS_PERMISSIONS } from '../../../constants/permission-codes';

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
      <ng-container *ngIf="canView; else noPermission">
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
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center h-100 text-center p-5 animate-fade-in">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 max-w-400">
            No tienes permisos suficientes para gestionar los establecimientos de esta empresa. 
            Si crees que esto es un error, contacta a su administrador.
          </p>
          <button class="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm" (click)="refresh()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .establecimientos-page-container {
      min-height: 100vh;
      background: var(--bg-main);
      padding: 0;
    }

    .no-permission-container { min-height: 70vh; }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .max-w-400 { max-width: 400px; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EstablecimientosPage implements OnInit, OnDestroy {
  get canView(): boolean {
    return this.permissionsService.hasPermission(ESTABLECIMIENTOS_PERMISSIONS.VER);
  }

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

  private permissionsService = inject(PermissionsService);

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

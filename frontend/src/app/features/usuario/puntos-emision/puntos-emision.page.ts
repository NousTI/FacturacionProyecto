import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, map, Observable, BehaviorSubject } from 'rxjs';

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
import { PermissionsService } from '../../../core/auth/permissions.service';
import { PUNTOS_EMISION_PERMISSIONS } from '../../../constants/permission-codes';
import { PaginationState } from '../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

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
      <ng-container *ngIf="canView; else noPermission">
        <!-- ESTADÍSTICAS -->
        <app-puntos-emision-stats
          [total]="(stats$ | async)?.total ?? 0"
          [active]="(stats$ | async)?.activos ?? 0"
          [con_facturacion]="(stats$ | async)?.con_facturacion ?? 0"
        ></app-puntos-emision-stats>

        <!-- ACCIONES Y FILTROS -->
        <app-puntos-emision-actions
          [(searchQuery)]="searchQuery"
          (searchQueryChange)="onSearchQueryChange()"
          (onFilterChange)="handleFilters($event)"
          (onCreate)="openCreateModal()"
        ></app-puntos-emision-actions>

        <!-- TABLA DE PUNTOS EMISIÓN -->
        <div class="table-flex-grow">
          <app-puntos-emision-table
            [puntosEmision]="filteredPuntosEmision"
            [pagination]="pagination"
            (onAction)="handleAction($event)"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-puntos-emision-table>
        </div>

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
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center h-100 text-center p-5 animate-fade-in">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 max-w-400">
            No tienes permisos suficientes para gestionar los puntos de emisión de esta empresa. 
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .puntos-emision-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
    }

    .table-flex-grow {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
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
export class PuntosEmisionPage implements OnInit, OnDestroy {
  get canView(): boolean {
    return this.permissionsService.hasPermission(PUNTOS_EMISION_PERMISSIONS.GESTIONAR);
  }

  // Observables
  puntosEmision$: Observable<PuntoEmision[]>;
  stats$: Observable<PuntosEmisionStats | null>;

  // Local filtered list
  filteredPuntosEmision: PuntoEmision[] = [];

  // UI State
  searchQuery: string = '';
  filters = { estado: 'ALL' };
  pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };
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
  private filterTrigger$ = new BehaviorSubject<void>(void 0);

  private permissionsService = inject(PermissionsService);

  constructor(
    private puntosEmisionService: PuntosEmisionService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {
    this.puntosEmision$ = this.puntosEmisionService.getPuntosEmision();
    this.stats$ = this.puntosEmisionService.getEstadisticas();
  }

  ngOnInit() {
    // Escuchar cambios en los datos y en los filtros reactivamente
    import('rxjs').then(({ combineLatest }) => {
      combineLatest([
        this.puntosEmision$,
        this.filterTrigger$
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data]) => {
        this.filteredPuntosEmision = this.applyFilters(data);
        this.cdr.markForCheck();
      });
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
    this.pagination.currentPage = 1;
    this.filterTrigger$.next();
  }

  /**
   * Maneja cambios en el input de búsqueda
   */
  onSearchQueryChange() {
    this.pagination.currentPage = 1;
    this.filterTrigger$.next();
  }

  /**
   * Aplica filtros de búsqueda y estado
   */
  applyFilters(data: PuntoEmision[]): PuntoEmision[] {
    const filtered = data.filter(pe => {
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

    this.pagination.totalItems = filtered.length;
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return filtered.slice(startIndex, startIndex + this.pagination.pageSize);
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.filterTrigger$.next();
  }

  onPageSizeChange(size: number) {
    this.pagination.pageSize = size;
    this.pagination.currentPage = 1;
    this.filterTrigger$.next();
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

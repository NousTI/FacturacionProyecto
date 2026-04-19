import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, BehaviorSubject, combineLatest } from 'rxjs';

import { PuntosEmisionStatsComponent } from '../../../puntos-emision/components/puntos-emision-stats/puntos-emision-stats.component';
import { PuntosEmisionActionsComponent } from '../../../puntos-emision/components/puntos-emision-actions/puntos-emision-actions.component';
import { PuntosEmisionTableComponent } from '../../../puntos-emision/components/puntos-emision-table/puntos-emision-table.component';
import { CreatePuntosEmisionModalComponent } from '../../../puntos-emision/components/create-puntos-emision-modal/create-puntos-emision-modal.component';
import { PuntosEmisionDetailModalComponent } from '../../../puntos-emision/components/puntos-emision-detail-modal/puntos-emision-detail-modal.component';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../../../shared/components/toast/toast.component';

import { PuntosEmisionService } from '../../../puntos-emision/services/puntos-emision.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';
import { PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-config-puntos-emision',
  standalone: true,
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
    <div class="config-puntos-emision-wrapper animate__animated animate__fadeIn">
      
      <!-- ESTADÍSTICAS -->
      <app-puntos-emision-stats
        [total]="stats.total"
        [active]="stats.activos"
        [con_facturacion]="stats.con_facturacion"
      ></app-puntos-emision-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-puntos-emision-actions
        [(searchQuery)]="searchQuery"
        (searchQueryChange)="onSearchQueryChange()"
        (onFilterChange)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-puntos-emision-actions>

      <!-- TABLA DE PUNTOS EMISIÓN -->
      <div class="table-container-lux">
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

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .config-puntos-emision-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; width: 100%; padding: 4px; }
    .table-container-lux { flex: 1; display: flex; flex-direction: column; min-height: 0; margin-top: 1rem; }
  `]
})
export class ConfigPuntosEmisionComponent implements OnInit, OnDestroy {
  // Data State
  filteredPuntosEmision: PuntoEmision[] = [];
  stats = { total: 0, activos: 0, con_facturacion: 0 };
  pagination: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0
  };

  // UI State
  searchQuery: string = '';
  filters = { estado: 'ALL' };
  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  selectedPuntoEmision: PuntoEmision | null = null;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;

  private destroy$ = new Subject<void>();
  private filterTrigger$ = new BehaviorSubject<void>(void 0);

  private service = inject(PuntosEmisionService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    combineLatest([
      this.service.getPuntosEmision(),
      this.service.getEstadisticas(),
      this.filterTrigger$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([data, statsData]) => {
      this.stats = statsData || { total: 0, activos: 0, con_facturacion: 0 };
      this.filteredPuntosEmision = this.applyFilters(data);
      this.pagination = {
        ...this.pagination,
        totalItems: this.filteredPuntosEmision.length
      };
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchQueryChange() { this.filterTrigger$.next(); }
  handleFilters(event: any) { this.filters.estado = event.estado; this.pagination = { ...this.pagination, currentPage: 1 }; this.filterTrigger$.next(); }

  onPageChange(page: number) {
    this.pagination = { ...this.pagination, currentPage: page };
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number) {
    this.pagination = { ...this.pagination, pageSize: size, currentPage: 1 };
    this.cdr.markForCheck();
  }

  applyFilters(data: PuntoEmision[]): PuntoEmision[] {
    return data.filter(pe => {
      if (this.filters.estado !== 'ALL') {
        const estadoMatch = this.filters.estado === 'ACTIVO' ? pe.activo : !pe.activo;
        if (!estadoMatch) return false;
      }
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return pe.codigo.toLowerCase().includes(query) || pe.nombre.toLowerCase().includes(query);
      }
      return true;
    });
  }

  handleAction(event: any) {
    this.selectedPuntoEmision = event.puntoEmision;
    if (event.type === 'view') this.showDetailModal = true;
    else if (event.type === 'edit') this.showCreateModal = true;
    else if (event.type === 'delete') this.showConfirmModal = true;
  }

  openCreateModal() { this.selectedPuntoEmision = null; this.showCreateModal = true; }

  savePuntoEmision(datos: any) {
    this.isSaving = true;
    const request = this.selectedPuntoEmision 
      ? this.service.actualizar(this.selectedPuntoEmision.id, datos)
      : this.service.crear(datos);

    request.pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showCreateModal = false; this.selectedPuntoEmision = null; },
        error: (err) => console.error('Error saving:', err)
      });
  }

  deletePuntoEmision() {
    if (!this.selectedPuntoEmision) return;
    this.isDeleting = true;
    this.service.eliminar(this.selectedPuntoEmision.id, this.selectedPuntoEmision.nombre)
      .pipe(finalize(() => { this.isDeleting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showConfirmModal = false; this.selectedPuntoEmision = null; },
        error: (err) => console.error('Error deleting:', err)
      });
  }
}

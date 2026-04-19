import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, BehaviorSubject, combineLatest } from 'rxjs';

import { EstablecimientoStatsComponent } from '../../../establecimientos/components/establecimiento-stats/establecimiento-stats.component';
import { EstablecimientoActionsComponent } from '../../../establecimientos/components/establecimiento-actions/establecimiento-actions.component';
import { EstablecimientoTableComponent } from '../../../establecimientos/components/establecimiento-table/establecimiento-table.component';
import { CreateEstablecimientoModalComponent } from '../../../establecimientos/components/create-establecimiento-modal/create-establecimiento-modal.component';
import { EstablecimientoDetailModalComponent } from '../../../establecimientos/components/establecimiento-detail-modal/establecimiento-detail-modal.component';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../../../shared/components/toast/toast.component';

import { EstablecimientosService } from '../../../establecimientos/services/establecimientos.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';
import { PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-config-establecimientos',
  standalone: true,
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
    <div class="config-establecimientos-wrapper animate__animated animate__fadeIn">
      
      <!-- ESTADÍSTICAS -->
      <app-establecimiento-stats
        [total]="stats.total"
        [active]="stats.activos"
        [con_puntos_emision]="stats.con_puntos_emision"
      ></app-establecimiento-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-establecimiento-actions
        [(searchQuery)]="searchQuery"
        (searchQueryChange)="onSearchQueryChange()"
        (onFilterChange)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-establecimiento-actions>

      <!-- TABLA DE ESTABLECIMIENTOS -->
      <div class="table-container-lux">
        <app-establecimiento-table
          [establecimientos]="filteredEstablecimientos"
          [pagination]="pagination"
          (onAction)="handleAction($event)"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-establecimiento-table>
      </div>

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
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .config-establecimientos-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; width: 100%; padding: 4px; }
    .table-container-lux { flex: 1; display: flex; flex-direction: column; min-height: 0; margin-top: 1rem; }
  `]
})
export class ConfigEstablecimientosComponent implements OnInit, OnDestroy {
  // Data State
  filteredEstablecimientos: Establecimiento[] = [];
  stats = { total: 0, activos: 0, con_puntos_emision: 0 };
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
  selectedEstablecimiento: Establecimiento | null = null;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;

  private destroy$ = new Subject<void>();
  private filterTrigger$ = new BehaviorSubject<void>(void 0);

  private service = inject(EstablecimientosService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    combineLatest([
      this.service.getEstablecimientos(),
      this.service.getEstadisticas(),
      this.filterTrigger$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([data, statsData]) => {
      this.stats = statsData || { total: 0, activos: 0, con_puntos_emision: 0 };
      this.filteredEstablecimientos = this.applyFilters(data);
      this.pagination = {
        ...this.pagination,
        totalItems: this.filteredEstablecimientos.length
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

  applyFilters(data: Establecimiento[]): Establecimiento[] {
    return data.filter(est => {
      if (this.filters.estado !== 'ALL') {
        const estadoMatch = this.filters.estado === 'ACTIVO' ? est.activo : !est.activo;
        if (!estadoMatch) return false;
      }
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return est.codigo.toLowerCase().includes(query) || est.nombre.toLowerCase().includes(query) || est.direccion.toLowerCase().includes(query);
      }
      return true;
    });
  }

  handleAction(event: any) {
    this.selectedEstablecimiento = event.establecimiento;
    if (event.type === 'view') this.showDetailModal = true;
    else if (event.type === 'edit') this.showCreateModal = true;
    else if (event.type === 'delete') this.showConfirmModal = true;
  }

  openCreateModal() { this.selectedEstablecimiento = null; this.showCreateModal = true; }

  saveEstablecimiento(datos: any) {
    this.isSaving = true;
    const request = this.selectedEstablecimiento 
      ? this.service.actualizar(this.selectedEstablecimiento.id, datos)
      : this.service.crear(datos);

    request.pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showCreateModal = false; this.selectedEstablecimiento = null; },
        error: (err) => console.error('Error saving:', err)
      });
  }

  deleteEstablecimiento() {
    if (!this.selectedEstablecimiento) return;
    this.isDeleting = true;
    this.service.eliminar(this.selectedEstablecimiento.id, this.selectedEstablecimiento.nombre)
      .pipe(finalize(() => { this.isDeleting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showConfirmModal = false; this.selectedEstablecimiento = null; },
        error: (err) => console.error('Error deleting:', err)
      });
  }
}

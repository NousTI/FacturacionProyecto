import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, map, Observable } from 'rxjs';

import { ClienteStatsComponent } from './components/cliente-stats/cliente-stats.component';
import { ClienteActionsComponent } from './components/cliente-actions/cliente-actions.component';
import { ClienteTableComponent } from './components/cliente-table/cliente-table.component';
import { CreateClienteModalComponent } from './components/create-cliente-modal/create-cliente-modal.component';
import { ClienteDetailModalComponent } from './components/cliente-detail-modal/cliente-detail-modal.component';
import { ExportClientesModalComponent } from './components/export-clientes-modal/export-clientes-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { ClientesService } from './services/clientes.service';
import { UiService } from '../../../shared/services/ui.service';
import { Cliente, ClienteStats } from '../../../domain/models/cliente.model';
import { ClienteAnaliticaComponent } from './components/cliente-analitica/cliente-analitica.component';

@Component({
  selector: 'app-usuario-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClienteStatsComponent,
    ClienteActionsComponent,
    ClienteTableComponent,
    CreateClienteModalComponent,
    ClienteDetailModalComponent,
    ExportClientesModalComponent,
    ConfirmModalComponent,
    ToastComponent,
    ClienteAnaliticaComponent
  ],
  template: `
    <div class="clientes-page-container">
      <!-- TABS PRINCIPALES NAV -->
      <div class="main-tabs-wrapper">
        <div class="main-tabs">
          <button class="main-tab-btn" 
                  [class.active]="activeTab === 'directorio'" 
                  (click)="activeTab = 'directorio'">
            <i class="bi bi-people-fill"></i> Directorio de Clientes
          </button>
          <button class="main-tab-btn" 
                  [class.active]="activeTab === 'analitica'" 
                  (click)="activeTab = 'analitica'">
            <i class="bi bi-bar-chart-fill"></i> Analítica
          </button>
        </div>
      </div>

      <!-- TAB: DIRECTORIO -->
      <div class="view-section" *ngIf="activeTab === 'directorio'">
        <!-- ESTADÍSTICAS -->
        <app-cliente-stats
          *ngIf="stats$ | async as st"
          [total]="st.total"
          [active]="st.activos"
          [credit]="st.con_credito"
        ></app-cliente-stats>

        <!-- ACCIONES Y FILTROS -->
        <app-cliente-actions
          [(searchQuery)]="searchQuery"
          (onFilterChangeEmit)="handleFilters($event)"
          (onCreate)="openCreateModal()"
          (onExport)="showExportModal = true"
        ></app-cliente-actions>

        <!-- TABLA DE CLIENTES -->
        <app-cliente-table
          [clientes]="filteredClientes"
          (onAction)="handleAction($event)"
        ></app-cliente-table>
      </div>

      <!-- TAB: ANALÍTICA -->
      <div class="view-section" *ngIf="activeTab === 'analitica'">
        <div class="analitica-section">
          <app-cliente-analitica></app-cliente-analitica>
        </div>
      </div>

      <!-- MODAL DE CREACIÓN/EDICIÓN -->
      <app-create-cliente-modal
        *ngIf="showCreateModal"
        [cliente]="selectedCliente"
        [loading]="isSaving"
        (onSave)="saveCliente($event)"
        (onClose)="showCreateModal = false"
      ></app-create-cliente-modal>

      <!-- MODAL DE DETALLES -->
      <app-cliente-detail-modal
        *ngIf="showDetailModal && selectedCliente"
        [cliente]="selectedCliente"
        (onClose)="showDetailModal = false"
      ></app-cliente-detail-modal>

      <!-- MODAL DE EXPORTACIÓN -->
      <app-export-clientes-modal
        *ngIf="showExportModal"
        [loading]="isExporting"
        (onExport)="handleExport($event)"
        (onClose)="showExportModal = false"
      ></app-export-clientes-modal>

      <!-- MODAL DE CONFIRMACIÓN PARA ELIMINAR -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        title="¿Eliminar Cliente?"
        [message]="'¿Estás seguro de que deseas eliminar a ' + selectedCliente?.razon_social + '? Esta acción no se puede deshacer.'"
        confirmText="Eliminar Cliente"
        type="danger"
        icon="bi-trash3-fill"
        [loading]="isDeleting"
        (onConfirm)="deleteCliente()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .clientes-page-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* TABS STYLES */
    .main-tabs-wrapper {
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .main-tabs {
      display: flex;
      gap: 1.5rem;
    }
    .main-tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 0.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .main-tab-btn i { font-size: 1.1rem; }
    .main-tab-btn:hover { color: #1e293b; }
    .main-tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .view-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .analitica-section { display: flex; flex-direction: column; gap: 0; }

    .lux-page-header {
      padding-bottom: 2rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .lux-title-gradient {
      font-size: 2.25rem;
      font-weight: 900;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
      margin-bottom: 0.5rem;
    }

    .lux-description {
      font-size: 1rem;
      color: #94a3b8;
      font-weight: 500;
      margin: 0;
    }

    .fw-800 { font-weight: 800; }
  `]
})
export class ClientesPage implements OnInit, OnDestroy {
  // Navigation State
  activeTab: 'directorio' | 'analitica' = 'directorio';

  // Observables for reactive UI
  clientes$: Observable<Cliente[]>;
  stats$: Observable<ClienteStats | null>;

  // Local filtered list
  filteredClientes: Cliente[] = [];

  // UI State
  searchQuery: string = '';
  filters = { estado: 'ALL' };
  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  showExportModal: boolean = false;
  selectedCliente: Cliente | null = null;

  // Loading States
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isExporting: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private clientesService: ClientesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.clientes$ = this.clientesService.clientes$;
    this.stats$ = this.clientesService.stats$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gestión de Clientes', 'Administra la base de datos de tus clientes y sus créditos');
    // Initial data load (handles caching)
    this.clientesService.loadInitialData();

    // Subscribe to clients to apply filters reactively
    this.clientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(clientes => {
        this.clientes = clientes;
        this.applyFilters();
      });
  }

  private _allClientes: Cliente[] = [];
  set clientes(val: Cliente[]) {
    this._allClientes = val;
    this.applyFilters();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    this.filteredClientes = this._allClientes.filter(c => {
      const query = this.searchQuery.toLowerCase();
      const matchSearch = !query ||
        c.razon_social.toLowerCase().includes(query) ||
        c.identificacion.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query));

      const matchEstado = this.filters.estado === 'ALL' ||
        (this.filters.estado === 'ACTIVO' && c.activo) ||
        (this.filters.estado === 'INACTIVO' && !c.activo);

      return matchSearch && matchEstado;
    });
    this.cd.detectChanges();
  }

  handleFilters(filters: any) {
    this.filters = filters;
    this.applyFilters();
  }

  openCreateModal() {
    this.selectedCliente = null;
    this.showCreateModal = true;
  }

  handleAction(event: { type: string, cliente: Cliente }) {
    this.selectedCliente = event.cliente;
    if (event.type === 'edit') {
      this.showCreateModal = true;
    } else if (event.type === 'delete') {
      this.showConfirmModal = true;
    } else if (event.type === 'view') {
      this.showDetailModal = true;
    }
  }

  saveCliente(data: any) {
    this.isSaving = true;
    const operation = this.selectedCliente
      ? this.clientesService.updateCliente(this.selectedCliente.id, data)
      : this.clientesService.createCliente(data);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedCliente ? 'Cliente actualizado' : 'Cliente creado exitosamente',
            'success'
          );
          this.showCreateModal = false;
          // Note: NO need to call loadData() here, service updates the BehaviorSubject!
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al guardar cliente');
        }
      });
  }

  handleExport(dates: { startDate?: string, endDate?: string }) {
    this.isExporting = true;
    this.clientesService.exportClientes(dates.startDate, dates.endDate)
      .pipe(finalize(() => {
        this.isExporting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `clientes_${new Date().getTime()}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showExportModal = false;
          this.uiService.showToast('Reporte generado correctamente', 'success');
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al exportar clientes');
        }
      });
  }

  deleteCliente() {
    if (!this.selectedCliente) return;

    this.isDeleting = true;
    this.clientesService.deleteCliente(this.selectedCliente.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Cliente eliminado correctamente', 'success');
          this.showConfirmModal = false;
          // Service takes care of removing from local list
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al eliminar');
        }
      });
  }

  refreshData() {
    this.isLoading = true;
    this.clientesService.refresh();
    // The BehaviorSubject subscription in ngOnInit will handle the UI update
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 800);
  }
}

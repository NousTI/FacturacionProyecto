import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

// Components
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClientesActionsComponent } from './components/clientes-actions.component';
import { ClientesTableComponent } from './components/clientes-table.component';
import { ClienteFormModalComponent } from './components/modals/cliente-form-modal.component';
import { ClienteDetailModalComponent } from './components/modals/cliente-detail-modal.component';
import { ExportClientesModalComponent } from './components/modals/export-clientes-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ClienteAnaliticaComponent } from './components/cliente-analitica/cliente-analitica.component';

// Services & Models
import { ClientesService } from './services/clientes.service';
import { UiService } from '../../../shared/services/ui.service';
import { Cliente, ClienteStats } from '../../../domain/models/cliente.model';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { CLIENTES_PERMISSIONS } from '../../../constants/permission-codes';

@Component({
  selector: 'app-usuario-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClientesStatsComponent,
    ClientesActionsComponent,
    ClientesTableComponent,
    ClienteFormModalComponent,
    ClienteDetailModalComponent,
    ExportClientesModalComponent,
    ConfirmModalComponent,
    ToastComponent,
    ClienteAnaliticaComponent
  ],
  template: `
    <div class="clientes-page-container">
      
      <ng-container *ngIf="canView; else noPermission">
        
        <!-- Tabs Navigation -->
        <div class="tabs-minimal">
          <button class="tab-btn" [class.active]="activeTab === 'directorio'" (click)="activeTab = 'directorio'">
            <i class="bi bi-people-fill"></i> 
            <span>Directorio de Clientes</span>
          </button>
          <button class="tab-btn" 
                  *ngIf="canViewAnalitica"
                  [class.active]="activeTab === 'analitica'" 
                  (click)="activeTab = 'analitica'">
            <i class="bi bi-bar-chart-fill"></i> 
            <span>Analítica de Datos</span>
          </button>
        </div>

        <!-- TAB: DIRECTORIO -->
        <ng-container *ngIf="activeTab === 'directorio'">
          
          <!-- 1. Stats -->
          <app-clientes-stats
            *ngIf="stats$ | async as st"
            [total]="st.total"
            [active]="st.activos"
            [credit]="st.con_credito"
          ></app-clientes-stats>

          <!-- 2. Actions -->
          <app-clientes-actions
            [(searchQuery)]="searchQuery"
            (onFilterChangeEmit)="handleFilters($event)"
            (onCreate)="openCreateModal()"
            (onExport)="showExportModal = true"
          ></app-clientes-actions>

          <!-- 3. Table -->
          <app-clientes-table
            [clientes]="filteredClientes"
            (onAction)="handleAction($event)"
          ></app-clientes-table>

        </ng-container>

        <!-- TAB: ANALÍTICA -->
        <div class="view-section" *ngIf="activeTab === 'analitica' && canViewAnalitica">
          <app-cliente-analitica></app-cliente-analitica>
        </div>

        <!-- MODALES -->
        <app-cliente-form-modal
          *ngIf="showCreateModal"
          [cliente]="selectedCliente"
          [loading]="isSaving"
          (onSave)="saveCliente($event)"
          (onClose)="showCreateModal = false"
        ></app-cliente-form-modal>

        <app-cliente-detail-modal
          *ngIf="showDetailModal && selectedCliente"
          [cliente]="selectedCliente"
          (onClose)="showDetailModal = false"
        ></app-cliente-detail-modal>

        <app-export-clientes-modal
          *ngIf="showExportModal"
          [loading]="isExporting"
          (onExport)="handleExport($event)"
          (onClose)="showExportModal = false"
        ></app-export-clientes-modal>

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

      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container">
          <div class="icon-lock-wrapper">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2>Acceso Restringido</h2>
          <p>
            No tienes permisos suficientes para gestionar el directorio de clientes. 
            Contacta al administrador si crees que esto es un error.
          </p>
          <button class="btn-retry" (click)="refreshData()">
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

    .clientes-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }

    /* Tabs Navigation */
    .tabs-minimal {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 1rem 0;
      background: white;
      border-bottom: 1px solid #f1f5f9;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.8rem 1.25rem;
      border: none;
      background: none;
      color: #94a3b8;
      font-weight: 700;
      font-size: 0.9rem;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      cursor: pointer;
    }
    .tab-btn:hover {
      color: #475569;
      background: #f8fafc;
    }
    .tab-btn.active {
      color: var(--secondary-color, #1e293b);
      border-bottom-color: var(--status-info);
    }
    .tab-btn i { font-size: 1.1rem; }

    /* View Sections */
    .view-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* No Permission */
    .no-permission-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem;
    }
    .icon-lock-wrapper {
      width: 100px;
      height: 100px;
      background: var(--status-danger-bg);
      color: var(--status-danger-text);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }
    .no-permission-container h2 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .no-permission-container p { color: #64748b; max-width: 400px; margin-bottom: 2rem; line-height: 1.6; }
    
    .btn-retry {
      background: #1e293b;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 100px;
      font-weight: 700;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-retry:hover { transform: scale(1.05); background: #0f172a; }
  `]
})
export class ClientesPage implements OnInit, OnDestroy {
  get canView(): boolean {
    return this.permissionsService.hasPermission(CLIENTES_PERMISSIONS.VER);
  }

  get canViewAnalitica(): boolean {
    return this.permissionsService.isAdminEmpresa;
  }

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

  private permissionsService = inject(PermissionsService);

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
    
    // Protección de estado
    if (this.activeTab === 'analitica' && !this.canViewAnalitica) {
      this.activeTab = 'directorio';
    }

    // Initial data load (handles caching)
    this.clientesService.loadInitialData();

    // Subscribe to clients to apply filters reactively
    this.clientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(clientes => {
        this._allClientes = clientes;
        this.applyFilters();
      });
  }

  private _allClientes: Cliente[] = [];

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

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, map, Observable } from 'rxjs';

import { ClienteStatsComponent } from './components/cliente-stats/cliente-stats.component';
import { ClienteActionsComponent } from './components/cliente-actions/cliente-actions.component';
import { ClienteTableComponent } from './components/cliente-table/cliente-table.component';
import { CreateClienteModalComponent } from './components/create-cliente-modal/create-cliente-modal.component';
import { ClienteDetailModalComponent } from './components/cliente-detail-modal/cliente-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { ClientesService } from './services/clientes.service';
import { UiService } from '../../../shared/services/ui.service';
import { Cliente, ClienteStats } from '../../../domain/models/cliente.model';

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
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="clientes-page-container">
      

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
      ></app-cliente-actions>

      <!-- TABLA DE CLIENTES -->
      <app-cliente-table
        [clientes]="filteredClientes"
        (onAction)="handleAction($event)"
      ></app-cliente-table>

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
      background: #f8fafc;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: #161d35;
      margin-bottom: 0.25rem;
    }
    .page-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 500;
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
      transition: all 0.2s;
    }
    .btn-refresh-premium:hover {
      background: #f8fafc;
      color: #161d35;
      border-color: #cbd5e1;
    }
    .spinning i {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ClientesPage implements OnInit, OnDestroy {
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
  selectedCliente: Cliente | null = null;

  // Loading States
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, ClienteUsuario, ClienteConTrazabilidad } from './services/clientes.service';
import { PaginationState } from './components/clientes-paginacion.component';
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClientesTableComponent } from './components/clientes-table.component';
import { ClientesActionsComponent } from './components/clientes-actions.component';
import { ClientesDetailsModalComponent } from './components/clientes-details-modal.component';
import { ClienteCreateModalComponent } from './components/cliente-create-modal.component';
import { ClienteReassignModalComponent } from './components/cliente-reassign-modal.component';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClientesStatsComponent,
    ClientesTableComponent,
    ClientesActionsComponent,
    ClientesDetailsModalComponent,
    ClienteCreateModalComponent,
    ClienteReassignModalComponent,
    ToastComponent
  ],
  template: `
    <div class="clientes-page-container">
      
      <!-- 1. MÓDULO DE ESTADÍSTICAS -->
      <app-clientes-stats [stats]="stats"></app-clientes-stats>

      <!-- 2. MÓDULO DE BÚSQUEDA Y ACCIONES -->
      <app-clientes-actions
        [(searchQuery)]="searchQuery"
        [empresas]="empresas"
        (onFilterChangeEmit)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-clientes-actions>

      <!-- 3. MÓDULO DE TABLA DE DATOS -->
      <app-clientes-table
        [usuarios]="paginatedUsuarios"
        [pagination]="pagination"
        (onAction)="handleAction($event)"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      ></app-clientes-table>

      <!-- 4. MODALS (Detalles) -->
      <app-clientes-details-modal
        *ngIf="showDetailsModal && selectedUsuarioDetalle"
        [usuario]="selectedUsuarioDetalle"
        (close)="closeDetailsModal()"
      ></app-clientes-details-modal>

      <!-- 5. MODALS (Creación) -->
      <app-cliente-create-modal
        *ngIf="showCreateModal"
        [empresas]="allEmpresas"
        [allRoles]="[]"
        (onClose)="showCreateModal = false"
        (onSave)="createCliente($event)"
      ></app-cliente-create-modal>

      <!-- 6. MODALS (Reasignación) -->
      <app-cliente-reassign-modal
        *ngIf="showReassignModal && selectedUsuario"
        [cliente]="selectedUsuario"
        [empresas]="allEmpresas"
        (onClose)="closeReassignModal()"
        (onReasignar)="executeReassign($event)"
      ></app-cliente-reassign-modal>

      <!-- 7. MODALS (Confirmación) -->
      <div class="modal-overlay" *ngIf="showConfirmModal" (click)="showConfirmModal = false">
        <div class="confirm-modal" (click)="$event.stopPropagation()">
          <div class="confirm-header">
            <i class="bi" [ngClass]="confirmAction === 'delete' ? 'bi-exclamation-triangle text-danger' : 'bi-question-circle text-warning'"></i>
            <h3>{{ getConfirmTitle() }}</h3>
          </div>
          <p class="confirm-message">{{ getConfirmMessage() }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="showConfirmModal = false">Cancelar</button>
            <button class="btn-confirm" [class.danger]="confirmAction === 'delete'" (click)="executeAction()">
              Confirmar
            </button>
          </div>
        </div>
      </div>

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

    /* Confirmation Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .confirm-modal {
      background: white; border-radius: 20px;
      padding: 2rem; max-width: 450px; width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .confirm-header {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1rem;
    }
    .confirm-header i { font-size: 2.5rem; }
    .confirm-header h3 { margin: 0; font-weight: 800; color: #1e293b; }
    .confirm-message {
      color: #64748b; margin-bottom: 1.5rem; line-height: 1.6;
    }
    .confirm-actions {
      display: flex; gap: 0.75rem; justify-content: flex-end;
    }
    .btn-cancel, .btn-confirm {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 700; border: none; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel {
      background: #f8fafc; color: #475569;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-confirm {
      background: #161d35; color: white;
    }
    .btn-confirm.danger {
      background: #dc2626;
    }
    .btn-confirm:hover { transform: translateY(-2px); }
  `]
})
export class ClientesPage implements OnInit {
  loading = false;
  stats: any = { total: 0, activos: 0, nuevos_mes: 0 };
  allUsuarios: ClienteUsuario[] = [];
  filteredUsuarios: ClienteUsuario[] = [];

  pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  empresas: string[] = [];
  allEmpresas: any[] = [];
  apiUrl = environment.apiUrl;

  searchQuery = '';
  activeFilters: any = {
    empresa: 'ALL',
    origen: 'ALL'
  };

  showDetailsModal = false;
  showCreateModal = false;
  showReassignModal = false;
  showConfirmModal = false;
  selectedUsuario: ClienteUsuario | null = null;
  selectedUsuarioDetalle: ClienteConTrazabilidad | null = null;
  confirmAction: 'toggle' | 'delete' | null = null;

  constructor(
    private clientesService: ClientesService,
    private uiService: UiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
    this.loadEmpresas();
  }

  loadData() {
    this.loading = true;
    this.clientesService.getStats().subscribe(s => {
      this.stats = s;
      this.cdr.detectChanges();
    });
    this.clientesService.getClientes().subscribe(users => {
      this.allUsuarios = users;
      this.empresas = Array.from(new Set(users.map(u => u.empresa_nombre).filter((name): name is string => !!name)));
      this.filterUsuarios();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadEmpresas() {
    this.http.get<any>(`${this.apiUrl}/empresas`).subscribe({
      next: (res) => {
        this.allEmpresas = res.detalles || [];
      },
      error: () => {
        this.allEmpresas = [];
      }
    });
  }

  handleFilters(filters: any) {
    this.activeFilters = { ...filters };
    this.filterUsuarios();
  }

  filterUsuarios() {
    let temp = [...this.allUsuarios];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(u =>
        (u.nombres?.toLowerCase().includes(q) || '') ||
        (u.apellidos?.toLowerCase().includes(q) || '') ||
        (u.email?.toLowerCase().includes(q) || '') ||
        (u.empresa_nombre?.toLowerCase().includes(q) || '')
      );
    }

    if (this.activeFilters.empresa !== 'ALL') {
      temp = temp.filter(u => u.empresa_nombre === this.activeFilters.empresa);
    }

    if (this.activeFilters.origen !== 'ALL') {
      const q = this.activeFilters.origen.toLowerCase();
      temp = temp.filter(u => (u.origen_creacion || 'sistema') === q);
    }

    this.filteredUsuarios = temp;
    this.pagination.totalItems = temp.length;
    this.pagination.currentPage = 1;
    this.cdr.detectChanges();
  }

  get paginatedUsuarios(): ClienteUsuario[] {
    const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return this.filteredUsuarios.slice(inicio, inicio + this.pagination.pageSize);
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.cdr.detectChanges();
  }

  onPageSizeChange(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.cdr.detectChanges();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  handleAction(event: { type: string, cliente: ClienteUsuario }) {
    this.selectedUsuario = event.cliente;

    switch (event.type) {
      case 'view':
        this.openDetails(event.cliente);
        break;
      case 'reassign':
        this.showReassignModal = true;
        break;
      case 'toggle':
        this.confirmAction = 'toggle';
        this.showConfirmModal = true;
        break;
      case 'delete':
        this.confirmAction = 'delete';
        this.showConfirmModal = true;
        break;
    }
    this.cdr.detectChanges();
  }

  openDetails(cliente: ClienteUsuario) {
    this.clientesService.getClienteDetalle(cliente.id).subscribe({
      next: (detalle) => {
        this.selectedUsuarioDetalle = detalle;
        this.showDetailsModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => this.uiService.showError(err, 'Error al cargar detalles')
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedUsuarioDetalle = null;
  }

  createCliente(datos: any) {
    this.clientesService.crearCliente(datos).subscribe({
      next: () => {
        this.uiService.showToast('Cliente creado exitosamente', 'success');
        this.showCreateModal = false;
        this.loadData();
      },
      error: (err) => this.uiService.showError(err, 'Error al crear cliente')
    });
  }

  closeReassignModal() {
    this.showReassignModal = false;
    this.selectedUsuario = null;
  }

  executeReassign(nuevaEmpresaId: string) {
    if (!this.selectedUsuario || !nuevaEmpresaId) return;

    this.clientesService.reasignarEmpresa(this.selectedUsuario.id, nuevaEmpresaId).subscribe({
      next: () => {
        this.uiService.showToast('Empresa reasignada exitosamente', 'success');
        this.closeReassignModal();
        this.loadData();
      },
      error: (err) => this.uiService.showError(err, 'Error al reasignar empresa')
    });
  }

  executeAction() {
    if (!this.selectedUsuario) return;

    if (this.confirmAction === 'toggle') {
      this.clientesService.toggleStatus(this.selectedUsuario.id).subscribe({
        next: () => {
          const estado = this.selectedUsuario!.activo ? 'desactivado' : 'activado';
          this.uiService.showToast(`Cliente ${estado} exitosamente`, 'success');
          this.showConfirmModal = false;
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error al cambiar estado')
      });
    } else if (this.confirmAction === 'delete') {
      this.clientesService.eliminarCliente(this.selectedUsuario.id).subscribe({
        next: () => {
          this.uiService.showToast('Cliente eliminado exitosamente', 'success');
          this.showConfirmModal = false;
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error al eliminar')
      });
    }
  }

  getConfirmTitle(): string {
    if (this.confirmAction === 'delete') return 'Eliminar Cliente';
    if (this.confirmAction === 'toggle') {
      return this.selectedUsuario?.activo ? 'Desactivar Cliente' : 'Activar Cliente';
    }
    return 'Confirmar Acción';
  }

  getConfirmMessage(): string {
    if (!this.selectedUsuario) return '';

    const nombre = `${this.selectedUsuario.nombres} ${this.selectedUsuario.apellidos}`;

    if (this.confirmAction === 'delete') {
      return `¿Está seguro que desea eliminar al cliente "${nombre}"? Esta acción no se puede deshacer.`;
    }
    if (this.confirmAction === 'toggle') {
      const accion = this.selectedUsuario.activo ? 'desactivar' : 'activar';
      return `¿Está seguro que desea ${accion} al cliente "${nombre}"?`;
    }
    return '';
  }
}

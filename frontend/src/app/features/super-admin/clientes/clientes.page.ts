import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, ClienteUsuario, ClienteConTrazabilidad } from './services/clientes.service';
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClientesTableComponent } from './components/clientes-table.component';
import { ClientesDetailsModalComponent } from './components/clientes-details-modal.component';
import { ClienteModalComponent } from './components/cliente-modal.component';
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
    ClientesDetailsModalComponent,
    ClienteModalComponent,
    ClienteReassignModalComponent,
    ToastComponent
  ],
  template: `
    <div class="clientes-page-container animate__animated animate__fadeIn">

      <!-- Stats Section -->
      <app-clientes-stats [stats]="stats"></app-clientes-stats>

      <!-- Search & Filters Section -->
      <div class="actions-container mb-4">
        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar por nombre, correo o empresa..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterUsuarios()"
          >
        </div>
        
        <div class="filters-group">
          <select class="form-select filter-select" [(ngModel)]="filterEmpresa" (change)="filterUsuarios()">
            <option value="ALL">Todas las Empresas</option>
            <option *ngFor="let emp of empresas" [value]="emp">{{ emp }}</option>
          </select>

          <select class="form-select filter-select" [(ngModel)]="filterCreador" (change)="filterUsuarios()">
            <option value="ALL">Todos los Orígenes</option>
            <option value="VENDEDOR">Creados por Vendedores</option>
            <option value="INTERNO">Creados Internamente</option>
          </select>

          <button class="btn-create-premium" (click)="showCreateModal = true">
            <i class="bi bi-plus-lg"></i>
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      <!-- Table Section -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted fw-bold">Cargando directorio...</p>
      </div>

      <app-clientes-table
        *ngIf="!loading"
        [usuarios]="filteredUsuarios"
        (onAction)="handleAction($event)"
      ></app-clientes-table>

      <!-- Details Modal -->
      <app-clientes-details-modal
        *ngIf="showDetailsModal && selectedUsuarioDetalle"
        [usuario]="selectedUsuarioDetalle"
        (close)="closeDetailsModal()"
      ></app-clientes-details-modal>

      <!-- Create Modal -->
      <app-cliente-modal
        *ngIf="showCreateModal"
        [empresas]="allEmpresas"
        [allRoles]="[]"
        (onClose)="showCreateModal = false"
        (onSave)="createCliente($event)"
      ></app-cliente-modal>

      <!-- Reassign Modal -->
      <app-cliente-reassign-modal
        *ngIf="showReassignModal && selectedUsuario"
        [cliente]="selectedUsuario"
        [empresas]="allEmpresas"
        (onClose)="closeReassignModal()"
        (onReasignar)="executeReassign($event)"
      ></app-cliente-reassign-modal>

      <!-- Confirmation Modal -->
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
    .clientes-page-container { padding: 1.5rem 2rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
    .page-subtitle { color: #64748b; font-size: 0.9rem; }
    
    .btn-primary-premium {
      background: #161d35; border: none; color: white;
      padding: 0.75rem 1.75rem; border-radius: 14px; font-weight: 700;
      transition: all 0.2s; box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15);
    }
    .btn-primary-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(22, 29, 53, 0.2); }
    
    .actions-container { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .search-box { position: relative; flex: 1; max-width: 400px; }
    .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input {
      padding-left: 45px; height: 48px; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 4px 10px rgba(0,0,0,0.02); font-size: 0.95rem;
    }
    
    .filters-group { display: flex; gap: 1rem; }
    .filter-select {
      height: 48px; border-radius: 14px; border: 1px solid #e2e8f0;
      background-color: white; color: #475569; font-weight: 600; font-size: 0.9rem;
      padding: 0 1.5rem; min-width: 200px;
    }

    .btn-create-premium {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0 1.5rem;
      height: 48px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
      cursor: pointer;
    }
    .btn-create-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
      background: #232d4d;
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
  empresas: string[] = [];
  allEmpresas: any[] = [];
  apiUrl = environment.apiUrl;

  searchQuery = '';
  filterEmpresa = 'ALL';
  filterCreador = 'ALL';

  showDetailsModal = false;
  showEditModal = false;
  showCreateModal = false;
  showReassignModal = false;
  showConfirmModal = false;
  selectedUsuario: ClienteUsuario | null = null;
  selectedUsuarioDetalle: ClienteConTrazabilidad | null = null;
  confirmAction: 'toggle' | 'delete' | null = null;
  selectedEmpresaId: string | null = null;

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
    this.clientesService.getStats().subscribe(s => this.stats = s);
    this.clientesService.getClientes().subscribe(users => {
      this.allUsuarios = users;
      this.filteredUsuarios = users;
      this.empresas = Array.from(new Set(users.map(u => u.empresa_nombre).filter((name): name is string => !!name)));
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadEmpresas() {
    // Import EmpresaService if needed
    this.http.get<any>(`${this.apiUrl}/empresas`).subscribe({
      next: (res) => {
        this.allEmpresas = res.detalles || [];
      },
      error: () => {
        this.allEmpresas = [];
      }
    });
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

    if (this.filterEmpresa !== 'ALL') {
      temp = temp.filter(u => u.empresa_nombre === this.filterEmpresa);
    }

    if (this.filterCreador !== 'ALL') {
      if (this.filterCreador === 'VENDEDOR') {
        temp = temp.filter(u => !!u.vendedor_id);
      } else {
        temp = temp.filter(u => !u.vendedor_id);
      }
    }

    this.filteredUsuarios = temp;
    this.cdr.detectChanges();
  }

  handleAction(event: { type: string, cliente: ClienteUsuario }) {
    this.selectedUsuario = event.cliente;

    switch (event.type) {
      case 'view':
        this.openDetails(event.cliente);
        break;
      case 'reassign':
        this.openReassignModal();
        break;
      case 'toggle':
        this.confirmToggleStatus();
        break;
      case 'delete':
        this.confirmDelete();
        break;
    }
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

  openEditModal() {
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUsuario = null;
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

  saveEdit(datos: any) {
    if (!this.selectedUsuario) return;

    this.clientesService.actualizarCliente(this.selectedUsuario.id, datos).subscribe({
      next: () => {
        this.uiService.showToast('Cliente actualizado exitosamente', 'success');
        this.closeEditModal();
        this.loadData();
      },
      error: (err) => this.uiService.showError(err, 'Error al actualizar cliente')
    });
  }

  openReassignModal() {
    this.showReassignModal = true;
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

  confirmToggleStatus() {
    this.confirmAction = 'toggle';
    this.showConfirmModal = true;
  }

  confirmDelete() {
    this.confirmAction = 'delete';
    this.showConfirmModal = true;
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

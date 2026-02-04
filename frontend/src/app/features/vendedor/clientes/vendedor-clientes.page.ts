import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ClientesService, ClienteUsuario } from '../../super-admin/clientes/services/clientes.service';
import { VendedorEmpresaService } from '../empresas/services/vendedor-empresa.service';
import { RolesService, Rol } from '../../../shared/services/roles.service';
import { ClienteModalComponent } from '../../super-admin/clientes/components/cliente-modal.component';
import { VendedorClientesTableComponent } from './components/vendedor-clientes-table.component';
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClienteDetailsModalComponent } from './components/cliente-details-modal.component';
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

interface ClienteStats {
  total: number;
  activos: number;
  inactivos: number;
}

@Component({
  selector: 'app-vendedor-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VendedorClientesTableComponent,
    ClienteModalComponent,
    ClientesStatsComponent,
    ClienteDetailsModalComponent,
    ToastComponent
  ],
  template: `
    <div class="clientes-page-container">
      <!-- STATS -->
      <app-clientes-stats
        [total]="stats.total"
        [activos]="stats.activos"
        [inactivos]="stats.inactivos"
      ></app-clientes-stats>

      <!-- SEARCH & ACTIONS BAR -->
      <section class="module-actions mb-4">
        <div class="actions-bar-container shadow-sm py-2 px-4 rounded-4">
            <div class="row align-items-center g-3">
            
            <!-- Búsqueda -->
            <div class="col-lg-5">
                <div class="search-box-premium">
                <i class="bi bi-search"></i>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Buscar por nombre, email..." 
                    class="form-control-premium-search"
                >
                </div>
            </div>

            <!-- Filtros -->
            <div class="col-lg-7">
                <select class="form-select-premium" [(ngModel)]="filterEstado">
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVO">Activos</option>
                    <option value="INACTIVO">Inactivos</option>
                </select>
            </div>
            
            </div>
        </div>
      </section>

      <!-- TABLE -->
      <app-vendedor-clientes-table
        [clientes]="filteredClientes"
        (onAction)="handleAction($event)"
      ></app-vendedor-clientes-table>

      <!-- MODAL DETAILS -->
      <app-cliente-details-modal
        *ngIf="showDetailsModal"
        [cliente]="selectedCliente"
        (onClose)="closeDetailsModal()"
      ></app-cliente-details-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .clientes-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    
    /* REUSED STYLES FROM EMPRESAS */
    .actions-bar-container {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .search-box-premium {
      position: relative;
      width: 100%;
    }
    .search-box-premium i {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .form-control-premium-search {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 0 1.25rem 0 3.25rem;
      height: 40px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }
    .form-select-premium {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 0 1rem;
      height: 40px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s;
    }
    .form-select-premium:focus {
      border-color: #161d35;
      outline: none;
    }

    .btn-premium-primary {
        background: #161d35;
        color: #ffffff;
        border: none;
        padding: 0 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }
    .btn-premium-primary:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
        background: #232d4d;
    }
  `]
})
export class VendedorClientesPage implements OnInit, OnDestroy {
  clientes: ClienteUsuario[] = [];
  empresas: any[] = [];
  roles: Rol[] = [];
  stats: ClienteStats = { total: 0, activos: 0, inactivos: 0 };

  searchQuery = '';
  filterEstado = 'ALL';
  showModal = false;
  showDetailsModal = false;
  selectedCliente: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private clientesService: ClientesService,
    private empresaService: VendedorEmpresaService,
    private rolesService: RolesService,
    private uiService: UiService,
    private authFacade: AuthFacade,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();

    this.clientesService.clientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.clientes = data;
        this.calculateStats(data);
        this.cd.detectChanges();
      });

    this.empresaService.getEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.empresas = data;
        this.loadRolesForEmpresas(data);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.clientesService.fetchClientes();
    this.empresaService.loadMyEmpresas();
  }

  loadRolesForEmpresas(empresas: any[]) {
    if (empresas.length === 0) return;

    const requests = empresas.map(e => this.rolesService.listarRoles(e.id));
    forkJoin(requests).subscribe(results => {
      this.roles = results.flat();
    });
  }

  calculateStats(data: ClienteUsuario[]) {
    this.stats = {
      total: data.length,
      activos: data.filter(c => c.activo).length,
      inactivos: data.filter(c => !c.activo).length
    };
  }

  get filteredClientes() {
    return this.clientes.filter(c => {
      const matchSearch = !this.searchQuery ||
        c.nombres.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.apellidos.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchEstado = this.filterEstado === 'ALL' ||
        (this.filterEstado === 'ACTIVO' && c.activo) ||
        (this.filterEstado === 'INACTIVO' && !c.activo);

      return matchSearch && matchEstado;
    });
  }

  crearCliente(datos: any) {
    this.clientesService.crearCliente(datos).subscribe({
      next: () => {
        this.showModal = false;
        this.uiService.showToast('Cliente creado exitosamente', 'success');
      },
      error: (err) => this.uiService.showError(err, 'Error al crear cliente')
    });
  }

  handleAction(event: { type: string, cliente: any }) {
    if (event.type === 'view_details') {
      this.clientesService.getClienteDetalle(event.cliente.id).subscribe({
        next: (full) => {
          this.selectedCliente = full;
          this.showDetailsModal = true;
          this.cd.detectChanges();
        },
        error: (err) => this.uiService.showError(err, 'Error al cargar detalles')
      });
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedCliente = null;
  }
}

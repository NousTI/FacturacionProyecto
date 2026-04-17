import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ClientesService, ClienteUsuario } from '../../super-admin/clientes/services/clientes.service';
import { VendedorEmpresaService } from '../empresas/services/vendedor-empresa.service';
import { RolesService, Rol } from '../../../shared/services/roles.service';
// Components
import { VendedorClientesTableComponent } from './components/vendedor-clientes-table.component';
import { VendedorClientesActionsComponent } from './components/vendedor-clientes-actions.component';
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClienteDetailsModalComponent } from './components/cliente-details-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ClienteCreateModalComponent } from '../../super-admin/clientes/components/cliente-create-modal.component';

// Services
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { PermissionsService } from '../../../core/auth/permissions.service';

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
    VendedorClientesActionsComponent,
    ClientesStatsComponent,
    ClienteDetailsModalComponent,
    ClienteCreateModalComponent,
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
      <app-vendedor-clientes-actions
        [(searchQuery)]="searchQuery"
        [(filterEstado)]="filterEstado"
        [(filterEmpresa)]="filterEmpresa"
        [empresas]="empresas"
        [canCreate]="canCreate"
        (onCreate)="openCreateModal()"
      ></app-vendedor-clientes-actions>

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

      <!-- MODAL CREATE -->
      <app-cliente-create-modal
        *ngIf="showModal"
        [empresas]="empresas"
        [allRoles]="roles"
        (onSave)="crearCliente($event)"
        (onClose)="showModal = false"
      ></app-cliente-create-modal>

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
      background: var(--bg-main);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 1.5rem;
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
  filterEmpresa = 'ALL';
  showModal = false;
  showDetailsModal = false;
  selectedCliente: any = null;

  canCreate = false;

  private destroy$ = new Subject<void>();

  constructor(
    private clientesService: ClientesService,
    private empresaService: VendedorEmpresaService,
    private rolesService: RolesService,
    private uiService: UiService,
    private authFacade: AuthFacade,
    private permissionsService: PermissionsService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.canCreate = this.permissionsService.hasPermission('crear_empresas');
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

      const matchEmpresa = this.filterEmpresa === 'ALL' || c.empresa_id === this.filterEmpresa;

      return matchSearch && matchEstado && matchEmpresa;
    });
  }

  openCreateModal() {
    if (!this.canCreate) return;
    this.showModal = true;
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

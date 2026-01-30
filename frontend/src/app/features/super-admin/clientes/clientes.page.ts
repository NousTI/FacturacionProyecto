import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, ClienteUsuario } from './services/clientes.service';
import { ClientesStatsComponent } from './components/clientes-stats.component';
import { ClientesTableComponent } from './components/clientes-table.component';
import { ClientesDetailsModalComponent } from './components/clientes-details-modal.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClientesStatsComponent,
    ClientesTableComponent,
    ClientesDetailsModalComponent
  ],
  template: `
    <div class="clientes-page-container animate__animated animate__fadeIn">
      
      <!-- Header Section -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="page-title">Directorio de Clientes</h1>
          <p class="page-subtitle">Listado de usuarios por empresa y trazabilidad de origen</p>
        </div>
        <button class="btn-primary-premium d-flex align-items-center gap-2">
          <i class="bi bi-download"></i>
          Exportar Lista
        </button>
      </div>

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
        (onViewDetails)="openDetails($event)"
      ></app-clientes-table>

      <!-- Details Modal -->
      <app-clientes-details-modal
        *ngIf="showDetailsModal && selectedUsuario"
        [usuario]="selectedUsuario"
        (close)="showDetailsModal = false"
      ></app-clientes-details-modal>

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
  `]
})
export class ClientesPage implements OnInit {
  loading = false;
  stats: any = { total: 0, activos: 0, nuevos_mes: 0 };
  allUsuarios: ClienteUsuario[] = [];
  filteredUsuarios: ClienteUsuario[] = [];
  empresas: string[] = [];

  searchQuery = '';
  filterEmpresa = 'ALL';
  filterCreador = 'ALL';

  showDetailsModal = false;
  selectedUsuario: ClienteUsuario | null = null;

  constructor(
    private clientesService: ClientesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.clientesService.getStats().subscribe(s => this.stats = s);
    this.clientesService.getClientes().subscribe(users => {
      this.allUsuarios = users;
      this.filteredUsuarios = users;
      this.empresas = Array.from(new Set(users.map(u => u.empresa_nombre)));
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  filterUsuarios() {
    let temp = [...this.allUsuarios];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(u =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.empresa_nombre.toLowerCase().includes(q)
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

  openDetails(usuario: ClienteUsuario) {
    this.selectedUsuario = usuario;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }
}

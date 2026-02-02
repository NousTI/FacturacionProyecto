import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Components
import { SuscripcionStatsComponent } from '../../super-admin/suscripciones/components/suscripcion-stats/suscripcion-stats.component';
import { HistorialPagosModalComponent } from '../../super-admin/suscripciones/components/historial-pagos-modal/historial-pagos-modal.component';
import { VendedorSuscripcionTableComponent } from './components/table/vendedor-suscripcion-table.component';
import { SeguimientoNotasModalComponent } from './components/notas-modal/seguimiento-notas-modal.component';
import { VendedorHistoryModalComponent } from './components/history-modal/vendedor-history-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

// Services
import { VendedorSuscripcionService, Suscripcion } from './services/vendedor-suscripcion.service';
import { SuscripcionService, PagoHistorico } from '../../super-admin/suscripciones/services/suscripcion.service'; // Reuse for history
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-vendedor-suscripciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SuscripcionStatsComponent,
    VendedorSuscripcionTableComponent,
    HistorialPagosModalComponent,
    SeguimientoNotasModalComponent,
    VendedorHistoryModalComponent, // Added
    ToastComponent
  ],
  template: `
    <div class="suscripciones-page-container animate__animated animate__fadeIn">
      <!-- 2. ESTADÍSTICAS -->
      <app-suscripcion-stats [stats]="stats"></app-suscripcion-stats>

      <!-- 3. FILTROS -->
      <div class="d-flex justify-content-between align-items-center mb-4 mt-4">
        <!-- Search -->
        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar empresa..."
            [(ngModel)]="searchQuery"
          >
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs d-flex gap-2">
           <button class="btn-tab" (click)="showGeneralHistoryModal = true">
             <i class="bi bi-clock-history me-1"></i> Historial
           </button>
           <div class="vr mx-1"></div>
           <button class="btn-tab" [class.active]="filterStatus === 'ALL'" (click)="setFilter('ALL')">Todos</button>
           <button class="btn-tab" [class.active]="filterStatus === 'ACTIVA'" (click)="setFilter('ACTIVA')">Activos</button>
           <button class="btn-tab" [class.active]="filterStatus === 'VENCIDA'" (click)="setFilter('VENCIDA')">Vencidas</button>
        </div>
      </div>

      <!-- 4. TABLA -->
      <app-vendedor-suscripcion-table
        [suscripciones]="filteredSuscripciones"
        (onVerHistorial)="openHistorial($event)"
        (onNotas)="openNotas($event)"
      ></app-vendedor-suscripcion-table>

      <!-- 5. MODALES -->
      
      <!-- Historial General (New) -->
      <app-vendedor-history-modal
        *ngIf="showGeneralHistoryModal"
        (onClose)="showGeneralHistoryModal = false"
      ></app-vendedor-history-modal>
      
      <!-- Historial Pagos (Individual - Read Only reused) -->
      <app-historial-pagos-modal
        *ngIf="showHistorialModal"
        [companyName]="selectedSuscripcion?.empresa_nombre || ''"
        [pagos]="historialPagos"
        (onClose)="showHistorialModal = false"
      ></app-historial-pagos-modal>

      <!-- Notas Seguimiento -->
      <app-seguimiento-notas-modal
        *ngIf="showNotasModal"
        [empresaName]="selectedSuscripcion?.empresa_nombre || ''"
        [empresaId]="selectedSuscripcion?.empresa_id || ''"
        (onClose)="showNotasModal = false"
      ></app-seguimiento-notas-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .suscripciones-page-container {
      position: relative;
      min-height: 100vh;
      background: #f8fafc;
    }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #161d35; margin-bottom: 0.25rem; }

    .search-box {
      position: relative;
      width: 300px;
    }
    .search-icon {
      position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 1rem;
    }
    .search-input {
      padding-left: 40px; border-radius: 12px; border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02); height: 46px; font-size: 0.95rem;
    }
    .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
    
    .btn-tab {
      background: white; border: 1px solid #e2e8f0; color: #64748b;
      padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
      transition: all 0.2s;
    }
    .btn-tab.active {
      background: #161d35; color: white; border-color: #161d35;
    }
    .btn-tab:hover:not(.active) { background: #f8fafc; }
  `]
})
export class VendedorSuscripcionesPage implements OnInit {
  suscripciones: Suscripcion[] = [];
  historialPagos: PagoHistorico[] = [];

  // UI State
  searchQuery = '';
  filterStatus = 'ALL';

  showHistorialModal = false;
  showGeneralHistoryModal = false;
  showNotasModal = false;
  selectedSuscripcion: Suscripcion | null = null;

  stats = {
    active: 0,
    overdue: 0,
    projectedCollection: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private subService: VendedorSuscripcionService,
    private adminSubService: SuscripcionService, // To fetch history
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.subService.getMySuscripciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.suscripciones = data;
          this.calculateStats();
          this.cd.detectChanges();
        },
        error: (err) => this.uiService.showError(err, 'Error cargando suscripciones')
      });
  }

  calculateStats() {
    let active = 0;
    let overdue = 0;

    this.suscripciones.forEach(s => {
      if (s.estado === 'ACTIVA') active++;
      if (s.estado === 'VENCIDA') overdue++;
    });

    this.stats = { active, overdue, projectedCollection: 0 };
  }

  get filteredSuscripciones() {
    let filtered = this.suscripciones;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.empresa_nombre || '').toLowerCase().includes(q) ||
        (s.plan_nombre || '').toLowerCase().includes(q)
      );
    }

    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(s => s.estado === this.filterStatus);
    }

    return filtered;
  }

  setFilter(status: string) {
    this.filterStatus = status;
  }

  openHistorial(sub: Suscripcion) {
    this.selectedSuscripcion = sub;
    this.showNotasModal = false;

    // Fetch history using Superadmin Service (reusing endpoint which hopefully allows vendor context or we need to update backend)
    // Backend: ServicioSuscripciones.obtener_historial usually checks permissions.
    // If "suscripciones" permission implies seeing history, it should work.
    // Assuming vendor has 'ver_reportes' or similar.
    this.adminSubService.getPagos(sub.empresa_id).subscribe({
      next: (pagos) => {
        this.historialPagos = pagos;
        this.showHistorialModal = true;
        this.cd.detectChanges();
      },
      error: (err) => this.uiService.showError(err, 'No se pudo cargar el historial')
    });
  }

  openNotas(sub: Suscripcion) {
    this.selectedSuscripcion = sub;
    this.showHistorialModal = false;
    this.showNotasModal = true;
  }

}

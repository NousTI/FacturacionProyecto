import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Components
import { VendedorSuscripcionStatsComponent } from './components/vendedor-suscripcion-stats.component';
import { VendedorSuscripcionActionsComponent } from './components/vendedor-suscripcion-actions.component';
import { VendedorSuscripcionTableComponent } from './components/table/vendedor-suscripcion-table.component';
import { SeguimientoNotasModalComponent } from './components/notas-modal/seguimiento-notas-modal.component';
import { VendedorHistoryModalComponent } from './components/history-modal/vendedor-history-modal.component';
import { HistorialPagosModalComponent } from '../../super-admin/suscripciones/components/historial-pagos-modal/historial-pagos-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

// Services
import { VendedorSuscripcionService, Suscripcion } from './services/vendedor-suscripcion.service';
import { SuscripcionService, PagoHistorico } from '../../super-admin/suscripciones/services/suscripcion.service'; 
import { VendedorEmpresaService } from '../empresas/services/vendedor-empresa.service';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-vendedor-suscripciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VendedorSuscripcionStatsComponent,
    VendedorSuscripcionActionsComponent,
    VendedorSuscripcionTableComponent,
    HistorialPagosModalComponent,
    SeguimientoNotasModalComponent,
    VendedorHistoryModalComponent,
    ToastComponent
  ],
  template: `
    <div class="suscripciones-page-container">
      <!-- STATS -->
      <app-vendedor-suscripcion-stats
        [stats]="stats"
      ></app-vendedor-suscripcion-stats>

      <!-- SEARCH & ACTIONS BAR -->
      <app-vendedor-suscripcion-actions
        [(searchQuery)]="searchQuery"
        [(filterStatus)]="filterStatus"
        [(filterPago)]="filterPago"
        [(filterPlan)]="filterPlan"
        [planes]="planes"
        (onOpenHistory)="showGeneralHistoryModal = true"
      ></app-vendedor-suscripcion-actions>

      <!-- TABLE -->
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .suscripciones-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
  `]
})
export class VendedorSuscripcionesPage implements OnInit {
  suscripciones: Suscripcion[] = [];
  historialPagos: PagoHistorico[] = [];
  selectedSuscripcion: Suscripcion | null = null;
  planes: any[] = [];

  // UI State
  searchQuery = '';
  filterStatus = 'ALL';
  filterPago = 'ALL';
  filterPlan = 'ALL';

  showHistorialModal = false;
  showGeneralHistoryModal = false;
  showNotasModal = false;

  stats = {
    active: 0,
    overdue: 0,
    projectedCollection: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private subService: VendedorSuscripcionService,
    private empService: VendedorEmpresaService,
    private adminSubService: SuscripcionService, 
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
    this.loadPlanes();
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

  loadPlanes() {
    this.empService.getPlanes().subscribe(data => {
      this.planes = data;
      this.cd.detectChanges();
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

    if (this.filterPago !== 'ALL') {
      filtered = filtered.filter(s => s.estado_pago === this.filterPago);
    }

    if (this.filterPlan !== 'ALL') {
      filtered = filtered.filter(s => s.plan_id?.toString() === this.filterPlan.toString());
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

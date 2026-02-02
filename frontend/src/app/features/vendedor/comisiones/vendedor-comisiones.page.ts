import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { VendedorComisionesService, Comision, ComisionStats } from './services/vendedor-comisiones.service';
import { VendedorComisionesStatsComponent } from './components/stats/vendedor-comisiones-stats.component';
import { VendedorComisionesActionsComponent } from './components/actions/vendedor-comisiones-actions.component';
import { VendedorComisionesTableComponent } from './components/table/vendedor-comisiones-table.component';
import { VendedorComisionesDetailsModalComponent } from './components/details/vendedor-comisiones-details-modal.component';
import { VendedorComisionesAuditModalComponent } from './components/audit/vendedor-comisiones-audit-modal.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-vendedor-comisiones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VendedorComisionesStatsComponent,
    VendedorComisionesActionsComponent,
    VendedorComisionesTableComponent,
    VendedorComisionesDetailsModalComponent,
    VendedorComisionesAuditModalComponent
  ],
  template: `
    <!-- Comisiones Page Container -->
    <div class="comisiones-page-container animate__animated animate__fadeIn">
      
      <!-- 1. STATS -->
      <app-vendedor-comisiones-stats
        [total]="stats.total"
        [pendientes]="stats.pendientes"
        [pagados]="stats.pagados"
      ></app-vendedor-comisiones-stats>

      <!-- 2. TABS NAV -->
      <div class="tabs-container mb-4">
        <ul class="nav nav-pills custom-pills">
          <li class="nav-item" *ngFor="let tab of tabs">
            <a 
              class="nav-link" 
              [class.active]="currentTab === tab.id"
              (click)="selectTab(tab.id)"
              href="javascript:void(0)"
            >
              {{ tab.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- 3. ACTIONS -->
      <app-vendedor-comisiones-actions
        [(searchQuery)]="searchQuery"
        (searchQueryChange)="filterComisiones()"
      ></app-vendedor-comisiones-actions>

      <!-- 4. CONTENT -->
      
      <!-- Main List View -->
      <ng-container *ngIf="isListView()">
        <app-vendedor-comisiones-table
          [comisiones]="filteredComisiones"
          (onAction)="handleAction($event)"
        ></app-vendedor-comisiones-table>
      </ng-container>

      <!-- Placeholders for other modules as per Superadmin clone -->
      <div *ngIf="currentTab === 'RULES'" class="placeholder-module">
        <div class="text-center py-5">
          <i class="bi bi-gear-wide-connected fs-1 text-muted mb-3 d-block"></i>
          <h5 class="text-dark fw-bold">Reglas de Comisión</h5>
          <p class="text-muted">Configuración de porcentajes y condiciones (Próximamente)</p>
        </div>
      </div>

      <!-- Audit Tab / List -->
      <div *ngIf="currentTab === 'AUDIT'">
         <app-vendedor-comisiones-table
          [comisiones]="filteredComisiones"
          [isAudit]="true"
          (onAction)="handleAction($event)"
        ></app-vendedor-comisiones-table>
      </div>

      <!-- DETAILS MODAL -->
      <app-vendedor-comisiones-details-modal
        *ngIf="showDetailsModal"
        [comision]="selectedComision"
        (onClose)="closeDetailsModal()"
      ></app-vendedor-comisiones-details-modal>

      <!-- AUDIT MODAL -->
      <app-vendedor-comisiones-audit-modal
        *ngIf="showAuditModal"
        [logs]="auditLogs"
        [loading]="loadingAudit"
        (onClose)="showAuditModal = false"
      ></app-vendedor-comisiones-audit-modal>

    </div>
  `,
  styles: [`
    .comisiones-page-container {
      background: #f8fafc;
      min-height: 100vh;
    }
    .tabs-container {
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .custom-pills {
      gap: 0.5rem;
      flex-wrap: nowrap;
    }
    .custom-pills .nav-link {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 0.9rem;
      border-radius: 12px;
      padding: 0.6rem 1.2rem;
      border: 1px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .custom-pills .nav-link:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .custom-pills .nav-link.active {
      background: #161d35;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15);
    }
    .placeholder-module {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
  `],
})
export class VendedorComisionesPage implements OnInit {
  stats: ComisionStats = { total: 0, pendientes: 0, pagados: 0, aprobadas: 0 };
  allComisiones: Comision[] = [];
  filteredComisiones: Comision[] = [];
  searchQuery: string = '';

  showDetailsModal = false;
  selectedComision: Comision | null = null;

  showAuditModal = false;
  auditLogs: any[] = [];
  loadingAudit = false;

  tabs = [
    { id: 'ALL', label: 'Todas Generadas' },
    { id: 'PENDING', label: 'Por Aprobar' },
    { id: 'APPROVED', label: 'Por Pagar' },
    { id: 'PAID', label: 'Historial Pagos' },
    { id: 'REJECTED', label: 'Rechazadas' },
    { id: 'RULES', label: 'Reglas de Comisión' },
    { id: 'AUDIT', label: 'Auditoría' }
  ];
  currentTab = 'ALL';

  constructor(
    private comisionesService: VendedorComisionesService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.comisionesService.loadData();
    this.loadData();
  }

  loadData() {
    this.comisionesService.getStats().subscribe(stats => {
      this.stats = stats;
      this.cdr.detectChanges();
    });
    this.comisionesService.getAllComisiones().subscribe(data => {
      this.allComisiones = data;
      this.filterComisiones();
      this.cdr.detectChanges();
    });
  }

  selectTab(tabId: string) {
    this.currentTab = tabId;
    this.filterComisiones();
  }

  isListView(): boolean {
    return !['RULES', 'AUDIT'].includes(this.currentTab);
  }

  filterComisiones() {
    let temp = [...this.allComisiones];

    if (this.currentTab !== 'ALL' && this.isListView()) {
      if (this.currentTab === 'PENDING') temp = temp.filter(c => c.estado === 'PENDIENTE');
      if (this.currentTab === 'APPROVED') temp = temp.filter(c => c.estado === 'APROBADA');
      if (this.currentTab === 'PAID') temp = temp.filter(c => c.estado === 'PAGADA');
      if (this.currentTab === 'REJECTED') temp = temp.filter(c => c.estado === 'RECHAZADA');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(c =>
        (c.concepto?.toLowerCase() || '').includes(q) ||
        (c.empresa_nombre?.toLowerCase() || '').includes(q)
      );
    }

    this.filteredComisiones = temp;
  }

  handleAction(event: { type: string, comision: Comision }) {
    if (event.type === 'view_logs') {
      this.openAuditModal(event.comision);
      return;
    }
    if (event.type === 'view_details') {
      this.selectedComision = event.comision;
      this.showDetailsModal = true;
    }
  }

  openAuditModal(comision: Comision) {
    this.selectedComision = comision;
    this.auditLogs = [];
    this.loadingAudit = true;
    this.showAuditModal = true;
    this.comisionesService.getHistory(comision.id).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.loadingAudit = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.uiService.showToast('Error al cargar historial', 'danger');
        this.loadingAudit = false;
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedComision = null;
  }
}

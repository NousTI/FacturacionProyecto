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
    <div class="comisiones-page-container">
      <!-- 1. STATS -->
      <app-vendedor-comisiones-stats
        [total]="stats.total"
        [pendientes]="stats.pendientes"
        [pagados]="stats.pagados"
      ></app-vendedor-comisiones-stats>

      <!-- 2. ACTIONS & FILTERS -->
      <app-vendedor-comisiones-actions
        [(searchQuery)]="searchQuery"
        (searchQueryChange)="filterComisiones()"
        [tabs]="tabs"
        [currentTab]="currentTab"
        (tabChange)="selectTab($event)"
        [empresas]="empresas"
        [selectedEmpresa]="selectedEmpresa"
        (empresaChange)="selectEmpresa($event)"
      ></app-vendedor-comisiones-actions>

      <!-- 3. CONTENT -->
      <div class="page-content-wrapper">
         <!-- Main List View -->
        <ng-container *ngIf="isListView()">
          <app-vendedor-comisiones-table
            [comisiones]="filteredComisiones"
            (onAction)="handleAction($event)"
          ></app-vendedor-comisiones-table>
        </ng-container>
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .comisiones-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
    .page-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `],
})
export class VendedorComisionesPage implements OnInit {
  stats: ComisionStats = { total: 0, pendientes: 0, pagados: 0, aprobadas: 0 };
  allComisiones: Comision[] = [];
  filteredComisiones: Comision[] = [];
  searchQuery: string = '';
  empresas: string[] = [];
  selectedEmpresa: string = 'ALL';

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
    { id: 'REJECTED', label: 'Rechazadas' }
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
      this.empresas = Array.from(new Set(data.map(c => c.empresa_nombre).filter((name): name is string => !!name))).sort();
      this.filterComisiones();
      this.cdr.detectChanges();
    });
  }

  selectTab(tabId: string) {
    this.currentTab = tabId;
    this.filterComisiones();
  }

  selectEmpresa(emp: string) {
    this.selectedEmpresa = emp;
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

    if (this.selectedEmpresa !== 'ALL') {
      temp = temp.filter(c => c.empresa_nombre === this.selectedEmpresa);
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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionesService, Comision, ComisionStats } from './services/comisiones.service';
import { ComisionesStatsComponent } from './components/comisiones-stats/comisiones-stats.component';
import { ComisionesActionsComponent } from './components/comisiones-actions/comisiones-actions.component';
import { ComisionesTableComponent } from './components/comisiones-table/comisiones-table.component';
import { ComisionesDetailsModalComponent } from './components/comisiones-details-modal/comisiones-details-modal.component';
import { ComisionesActionModalComponent, ActionType } from './components/comisiones-action-modal/comisiones-action-modal.component';
import { ComisionesAuditModalComponent } from './components/comisiones-audit-modal/comisiones-audit-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-comisiones',
  template: `
    <!-- Comisiones Page Container -->
    <div class="comisiones-page-container animate__animated animate__fadeIn">
      
      <!-- 1. STATS -->
      <app-comisiones-stats
        [total]="stats.total"
        [pendientes]="stats.pendientes"
        [pagados]="stats.pagados"
      ></app-comisiones-stats>

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
      <app-comisiones-actions
        [(searchQuery)]="searchQuery"
        (searchQueryChange)="filterComisiones()"
        (searchQueryChange)="filterComisiones()"
      ></app-comisiones-actions>

      <!-- 4. CONTENT -->
      
      <!-- Main List View (Generadas, Pendientes, Pagadas) -->
      <ng-container *ngIf="isListView()">
        <app-comisiones-table
          [comisiones]="filteredComisiones"
          (onAction)="handleTableAction($event)"
        ></app-comisiones-table>
      </ng-container>

      <!-- Placeholders for other modules -->
      <div *ngIf="currentTab === 'RULES'" class="placeholder-module">
        <div class="text-center py-5">
          <i class="bi bi-gear-wide-connected fs-1 text-muted mb-3 d-block"></i>
          <h5 class="text-dark fw-bold">Reglas de Comisión</h5>
          <p class="text-muted">Configuración de porcentajes y condiciones (Próximamente)</p>
        </div>
      </div>

      <!-- Audit Tab / List -->
      <div *ngIf="currentTab === 'AUDIT'">
         <app-comisiones-table
          [comisiones]="filteredComisiones"
          [isAudit]="true"
          (onAction)="handleTableAction($event)"
        ></app-comisiones-table>
      </div>

      <!-- DETAILS MODAL -->
      <app-comisiones-details-modal
        *ngIf="showDetailsModal"
        [comision]="selectedComision"
        (onClose)="showDetailsModal = false"
      ></app-comisiones-details-modal>

      <!-- ACTION MODAL -->
      <app-comisiones-action-modal
        *ngIf="showActionModal"
        [type]="actionType"
        [comision]="selectedComision"
        [loading]="loadingAction"
        (onClose)="showActionModal = false"
        (onConfirm)="handleActionConfirm($event)"
      ></app-comisiones-action-modal>

      <!-- AUDIT MODAL -->
      <app-comisiones-audit-modal
        *ngIf="showAuditModal"
        [logs]="auditLogs"
        [loading]="loadingAudit"
        (onClose)="showAuditModal = false"
      ></app-comisiones-audit-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .comisiones-page-container {
      padding: 1.5rem 2rem;
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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComisionesStatsComponent,
    ComisionesActionsComponent,
    ComisionesTableComponent,
    ComisionesDetailsModalComponent,
    ComisionesActionModalComponent,
    ComisionesAuditModalComponent,
    ToastComponent
  ]
})
export class ComisionesPage implements OnInit {
  stats: ComisionStats = { total: 0, pendientes: 0, pagados: 0 };
  allComisiones: Comision[] = [];
  filteredComisiones: Comision[] = [];
  searchQuery: string = '';

  showDetailsModal: boolean = false;
  selectedComision: Comision | null = null;

  showActionModal: boolean = false;
  actionType: ActionType = 'APPROVE';
  loadingAction: boolean = false;

  showAuditModal: boolean = false;
  auditLogs: any[] = [];
  loadingAudit: boolean = false;

  tabs = [
    { id: 'ALL', label: 'Todas Generadas' },
    { id: 'PENDING', label: 'Por Aprobar' },
    { id: 'APPROVED', label: 'Por Pagar' },
    { id: 'PAID', label: 'Historial Pagos' },
    { id: 'REJECTED', label: 'Rechazadas' },
    { id: 'RULES', label: 'Reglas de Comisión' },
    { id: 'AUDIT', label: 'Auditoría' }
  ];
  currentTab: string = 'ALL';

  constructor(
    private comisionesService: ComisionesService,
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

    if (this.currentTab === 'AUDIT') {
      // Show all or maybe filter by recently changed? 
      // For now show all, user asked to see cards and click for log.
      // We reuse temp which has all.
    } else if (this.currentTab !== 'ALL' && this.isListView()) {
      if (this.currentTab === 'PENDING') temp = temp.filter(c => c.estado === 'PENDIENTE');
      if (this.currentTab === 'APPROVED') temp = temp.filter(c => c.estado === 'APROBADA');
      if (this.currentTab === 'PAID') temp = temp.filter(c => c.estado === 'PAGADA');
      if (this.currentTab === 'REJECTED') temp = temp.filter(c => c.estado === 'RECHAZADA');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(c =>
        (c.vendedor_nombre?.toLowerCase() || '').includes(q) ||
        (c.concepto?.toLowerCase() || '').includes(q)
      );
    }

    this.filteredComisiones = temp;
  }

  handleTableAction(event: any) {
    const { type, comision } = event;
    console.log('Action:', type, comision);

    if (type === 'view_logs') {
      this.openAuditModal(comision);
      return;
    }

    if (type === 'approve') {
      this.selectedComision = comision;
      this.actionType = 'APPROVE';
      this.showActionModal = true;
    } else if (type === 'register_payment') {
      this.selectedComision = comision;
      this.actionType = 'PAY';
      this.showActionModal = true;
    } else if (type === 'reject') {
      this.selectedComision = comision;
      this.actionType = 'REJECT';
      this.showActionModal = true;
    } else if (type === 'view_details') {
      this.selectedComision = comision;
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

  handleActionConfirm(data: any) {
    if (!this.selectedComision) return;
    const { observaciones, metodoPago } = data;

    this.loadingAction = true;

    if (this.actionType === 'APPROVE') {
      this.comisionesService.approveComision(this.selectedComision.id, observaciones).subscribe({
        next: () => {
          this.uiService.showToast('Comisión aprobada correctamente', 'success');
          this.showActionModal = false;
          this.loadingAction = false;
        },
        error: () => this.loadingAction = false
      });
    } else if (this.actionType === 'PAY') {
      this.comisionesService.registerPayment([this.selectedComision.id], {
        observaciones,
        metodo_pago: metodoPago
      }).subscribe({
        next: () => {
          this.uiService.showToast('Pago registrado exitosamente', 'success');
          this.showActionModal = false;
          this.loadingAction = false;
        },
        error: () => this.loadingAction = false
      });
    } else if (this.actionType === 'REJECT') {
      this.comisionesService.rejectComision(this.selectedComision.id, observaciones).subscribe({
        next: () => {
          this.uiService.showToast('Comisión rechazada', 'success');
          this.showActionModal = false;
          this.loadingAction = false;
        },
        error: () => this.loadingAction = false
      });
    }
  }

  handleRegisterPayment() {
    this.uiService.showToast('Funcionalidad de Pago Masivo (Demo)', 'info');
  }
}

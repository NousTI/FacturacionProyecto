import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateEmpresaModalComponent } from './components/create-empresa-modal/create-empresa-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { EmpresaStatsComponent } from './components/empresa-stats/empresa-stats.component';
import { EmpresaActionsComponent } from './components/empresa-actions/empresa-actions.component';
import { EmpresaTableComponent } from './components/empresa-table/empresa-table.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ChangePlanModalComponent } from './components/change-plan-modal/change-plan-modal.component';
import { AssignVendedorModalComponent } from './components/assign-vendedor-modal/assign-vendedor-modal.component';
import { EmpresaDetailsModalComponent } from './components/empresa-details-modal/empresa-details-modal.component';
import { UiService } from '../../../shared/services/ui.service';
import { EmpresaService, EmpresaStats } from './services/empresa.service';
import { OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-empresas',
  template: `
    <div class="empresas-page-container">
      
      <!-- 1. MÓDULO DE ESTADÍSTICAS -->
      <app-empresa-stats
        [total]="stats.total"
        [active]="stats.activas"
        [inactive]="stats.inactivas"
      ></app-empresa-stats>

      <!-- 2. MÓDULO DE BÚSQUEDA Y ACCIONES -->
      <app-empresa-actions
        [(searchQuery)]="searchQuery"
        [planes]="availablePlanes"
        [vendedores]="availableVendedores"
        (onFilterChangeEmit)="handleFilters($event)"
        (onCreate)="openModal()"
      ></app-empresa-actions>

      <!-- 3. MÓDULO DE TABLA DE DATOS -->
      <app-empresa-table
        [empresas]="filteredEmpresas"
        (onAction)="handleAction($event)"
      ></app-empresa-table>
      
      <!-- 4. MODALS (Creación) -->
      <app-create-empresa-modal 
        *ngIf="showCreateModal" 
        [empresa]="selectedEmpresa"
        (onSave)="saveEmpresa($event)" 
        (onClose)="showCreateModal = false"
      ></app-create-empresa-modal>

      <!-- 5. MODALS (Acciones Table) -->
      
      <!-- Modal de Detalles -->
      <app-empresa-details-modal
        *ngIf="showDetailsModal"
        [empresa]="selectedEmpresa"
        (onClose)="showDetailsModal = false"
      ></app-empresa-details-modal>

      <!-- Modal de Confirmación (Status / Soporte) -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        [title]="confirmData.title"
        [message]="confirmData.message"
        [confirmText]="confirmData.confirmText"
        [type]="confirmData.type"
        [icon]="confirmData.icon"
        [empresaName]="selectedEmpresa?.razonSocial || ''"
        (onConfirm)="executeConfirmedAction()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <!-- Modal Cambio de Plan -->
      <app-change-plan-modal
        *ngIf="showPlanModal"
        [empresaName]="selectedEmpresa?.razonSocial || ''"
        [selectedPlanId]="selectedEmpresa?.currentPlanId || null"
        (onSave)="updatePlan($event)"
        (onClose)="showPlanModal = false"
      ></app-change-plan-modal>

      <!-- Modal Asignar Vendedor -->
      <app-assign-vendedor-modal
        *ngIf="showVendedorModal"
        [empresaName]="selectedEmpresa?.razonSocial || ''"
        [currentVendedorId]="selectedEmpresa?.vendedorId || null"
        [loading]="isAssigning"
        (onSave)="updateVendedor($event)"
        (onClose)="showVendedorModal = false"
      ></app-assign-vendedor-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .empresas-page-container {
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: #f8fafc;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreateEmpresaModalComponent,
    ToastComponent,
    EmpresaStatsComponent,
    EmpresaActionsComponent,
    EmpresaTableComponent,
    ConfirmModalComponent,
    ChangePlanModalComponent,
    AssignVendedorModalComponent,
    EmpresaDetailsModalComponent
  ]
})
export class EmpresasPage implements OnInit, OnDestroy {
  // Data
  empresas: any[] = [];
  availablePlanes: any[] = [];
  availableVendedores: any[] = [];

  // Stats
  stats: EmpresaStats = { total: 0, activas: 0, inactivas: 0 };

  // Filtering
  searchQuery: string = '';
  activeFilters: any = {
    estado: 'ALL',
    plan: 'ALL',
    vendedor: 'ALL'
  };

  // UI Control
  showCreateModal: boolean = false;
  showDetailsModal: boolean = false;
  showConfirmModal: boolean = false;
  showPlanModal: boolean = false;
  showVendedorModal: boolean = false;

  // Loading States
  isAssigning: boolean = false;

  selectedEmpresa: any = null;
  confirmData: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UiService,
    private empresaService: EmpresaService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initSubscriptions();
    this.empresaService.loadData();
    this.loadSupportData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSubscriptions() {
    this.empresaService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        this.cd.detectChanges();
      });

    this.empresaService.getEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(empresas => {
        this.empresas = empresas;
        this.cd.detectChanges();
      });
  }

  loadSupportData() {
    this.empresaService.getPlanes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(planes => {
        this.availablePlanes = planes.map((p: any) => ({ id: p.id, nombre: p.nombre }));
        this.cd.detectChanges();
      });

    this.empresaService.getVendedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(vends => {
        this.availableVendedores = vends.map((v: any) => ({ id: v.id, nombre: `${v.nombres} ${v.apellidos}` }));
        this.cd.detectChanges();
      });
  }

  get totalEmpresas() { return this.stats.total; }
  get activasCount() { return this.stats.activas; }
  get inactivasCount() { return this.stats.inactivas; }

  get filteredEmpresas() {
    return this.empresas.filter(e => {
      const matchSearch = !this.searchQuery ||
        e.razonSocial.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.ruc.includes(this.searchQuery) ||
        (e.email && e.email.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchEstado = this.activeFilters.estado === 'ALL' || e.estado === this.activeFilters.estado;
      const matchPlan = this.activeFilters.plan === 'ALL' || e.plan_id === this.activeFilters.plan || e.plan === this.activeFilters.plan;

      let matchVendedor = true;
      if (this.activeFilters.vendedor === 'NONE') {
        matchVendedor = !e.vendedor_id;
      } else if (this.activeFilters.vendedor !== 'ALL') {
        matchVendedor = e.vendedor_id === this.activeFilters.vendedor;
      }

      return matchSearch && matchEstado && matchPlan && matchVendedor;
    });
  }

  handleFilters(filters: any) {
    this.activeFilters = { ...filters };
    this.cd.detectChanges();
  }

  openModal() {
    this.selectedEmpresa = null;
    this.showCreateModal = true;
  }

  handleAction(event: { type: string, empresa: any }) {
    this.selectedEmpresa = event.empresa;

    switch (event.type) {
      case 'view_details':
        this.showDetailsModal = true;
        break;

      case 'edit_admin':
        this.showCreateModal = true;
        break;

      case 'toggle_status':
        this.confirmData = {
          title: event.empresa.activo ? '¿Desactivar Empresa?' : '¿Activar Empresa?',
          message: event.empresa.activo
            ? 'La empresa y sus usuarios perderán acceso inmediato al sistema.'
            : 'Se restaurará el acceso completo para la empresa y sus empleados.',
          confirmText: event.empresa.activo ? 'Desactivar Ahora' : 'Activar Ahora',
          type: event.empresa.activo ? 'danger' : 'success',
          icon: event.empresa.activo ? 'bi-toggle-off' : 'bi-toggle-on',
          action: 'STATUS'
        };
        this.showConfirmModal = true;
        break;

      case 'support_access':
        this.confirmData = {
          title: 'Acceso de Soporte',
          message: 'Estás a punto de ingresar al panel administrativo de esta empresa. Se registrará tu actividad por seguridad.',
          confirmText: 'Ingresar como Empresa',
          type: 'primary',
          icon: 'bi-rocket-takeoff',
          action: 'SUPPORT'
        };
        this.showConfirmModal = true;
        break;

      case 'change_plan':
        this.showPlanModal = true;
        break;

      case 'assign_vendedor':
        this.showVendedorModal = true;
        break;
    }
  }

  executeConfirmedAction() {
    if (this.confirmData.action === 'STATUS') {
      this.empresaService.toggleActive(this.selectedEmpresa.id).subscribe({
        next: (updated: any) => {
          this.uiService.showToast(
            `Empresa ${updated.activo ? 'activada' : 'desactivada'} correctamente`,
            'success'
          );
          this.showConfirmModal = false;
        },
        error: (err: any) => this.uiService.showError(err, 'Error de Estado')
      });
    } else if (this.confirmData.action === 'SUPPORT') {
      this.uiService.showToast('Accediendo al panel de la empresa...', 'info');
      this.showConfirmModal = false;
    }
  }

  updatePlan(event: any) {
    this.empresaService.changePlan(this.selectedEmpresa.id, event.planId, event.monto, event.observaciones).subscribe({
      next: () => {
        this.uiService.showToast('Plan de suscripción actualizado', 'success');
        this.showPlanModal = false;
      },
      error: (err: any) => this.uiService.showError(err, 'Error de Plan')
    });
  }

  updateVendedor(vendedorId: any) {
    this.isAssigning = true;
    this.empresaService.assignVendor(this.selectedEmpresa.id, vendedorId)
      .pipe(finalize(() => this.isAssigning = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Vendedor asignado correctamente', 'success');
          this.showVendedorModal = false;
        },
        error: (err: any) => this.uiService.showError(err, 'Error de Asignación')
      });
  }

  saveEmpresa(data: any) {
    if (this.selectedEmpresa?.id || data.id) {
      const id = this.selectedEmpresa?.id || data.id;
      this.empresaService.updateEmpresa(id.toString(), data).subscribe({
        next: () => {
          this.showCreateModal = false;
          this.uiService.showToast('Empresa actualizada exitosamente', 'success');
        },
        error: (err: any) => this.uiService.showError(err, 'Error de Actualización')
      });
    } else {
      this.empresaService.createEmpresa(data).subscribe({
        next: () => {
          this.showCreateModal = false;
          this.uiService.showToast('¡Empresa registrada exitosamente!', 'success');
        },
        error: (err: any) => this.uiService.showError(err, 'Error de Registro')
      });
    }
  }
}


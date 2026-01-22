import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateEmpresaModalComponent } from './components/create-empresa-modal/create-empresa-modal.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { EmpresaStatsComponent } from './components/empresa-stats/empresa-stats.component';
import { EmpresaActionsComponent } from './components/empresa-actions/empresa-actions.component';
import { EmpresaTableComponent } from './components/empresa-table/empresa-table.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ChangePlanModalComponent } from './components/change-plan-modal/change-plan-modal.component';
import { AssignVendedorModalComponent } from './components/assign-vendedor-modal/assign-vendedor-modal.component';
import { EmpresaDetailsModalComponent } from './components/empresa-details-modal/empresa-details-modal.component';
import { UiService } from '../../../../shared/services/ui.service';
import { EmpresaService, EmpresaStats } from './services/empresa.service';
import { OnInit, ChangeDetectorRef } from '@angular/core';

export interface Empresa {
  id: number;
  razonSocial: string;
  nombreComercial?: string;
  ruc: string;
  estado: string;
  plan: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  fechaVencimiento: Date;
  fechaRegistro?: Date;
  fechaActivacion?: Date | null;
  vendedorId?: number | null;
  vendedorName?: string;
  tipoContribuyente?: string;
}

@Component({
  selector: 'app-empresas',
  template: `
    <div class="empresas-page-container animate__animated animate__fadeIn">
      
      <!-- 1. MÓDULO DE ESTADÍSTICAS -->
      <app-empresa-stats
        [total]="totalEmpresas"
        [active]="activasCount"
        [inactive]="inactivasCount"
      ></app-empresa-stats>

      <!-- 2. MÓDULO DE BÚSQUEDA Y ACCIONES -->
      <app-empresa-actions
        [(searchQuery)]="searchQuery"
        (onCreate)="openModal()"
      ></app-empresa-actions>

      <!-- 3. MÓDULO DE TABLA DE DATOS -->
      <app-empresa-table
        [empresas]="mockedEmpresas"
        (onAction)="handleAction($event)"
      ></app-empresa-table>

      <!-- 4. MODALS (Creación) -->
      <app-create-empresa-modal 
        *ngIf="showCreateModal" 
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
        [selectedPlan]="selectedEmpresa?.plan || ''"
        (onSave)="updatePlan($event)"
        (onClose)="showPlanModal = false"
      ></app-change-plan-modal>

      <!-- Modal Asignar Vendedor -->
      <app-assign-vendedor-modal
        *ngIf="showVendedorModal"
        [empresaName]="selectedEmpresa?.razonSocial || ''"
        [selectedVendedorId]="selectedEmpresa?.vendedorId || null"
        (onSave)="updateVendedor($event)"
        (onClose)="showVendedorModal = false"
      ></app-assign-vendedor-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .empresas-page-container {
      padding: 1.5rem 2rem;
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
export class EmpresasPage implements OnInit {
  searchQuery: string = '';
  showCreateModal: boolean = false;

  // Estadísticas reales
  stats: EmpresaStats = { total: 0, activas: 0, inactivas: 0 };
  empresas: any[] = [];

  // Acciones y Estados de Modales
  showDetailsModal: boolean = false;
  showConfirmModal: boolean = false;
  showPlanModal: boolean = false;
  showVendedorModal: boolean = false;

  selectedEmpresa: any = null;
  confirmData: any = {};

  mockedEmpresas: Empresa[] = []; // Renombrado internamente para menor impacto, pero cargará datos reales

  constructor(
    private uiService: UiService,
    private empresaService: EmpresaService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    console.log('EmpresasPage initialized');
    this.loadData();
  }

  loadData() {
    this.loadStats();
    this.loadEmpresas();
  }

  loadStats() {
    console.log('Loading stats...');
    this.empresaService.getStats().subscribe({
      next: (data) => {
        console.log('Stats loaded:', data);
        this.stats = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  loadEmpresas() {
    console.log('Loading empresas...');
    this.empresaService.getEmpresas().subscribe({
      next: (data) => {
        console.log('Empresas loaded:', data);
        // Mapear campos si es necesario para compatibilidad con la interfaz
        this.mockedEmpresas = data.map(e => ({
          ...e,
          razonSocial: e.razon_social,
          estado: e.activo ? 'ACTIVO' : 'INACTIVO',
          fechaVencimiento: e.fecha_vencimiento ? new Date(e.fecha_vencimiento) : null
        }));
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error loading empresas', err)
    });
  }

  get totalEmpresas() { return this.stats.total; }
  get activasCount() { return this.stats.activas; }
  get inactivasCount() { return this.stats.inactivas; }

  openModal() {
    this.showCreateModal = true;
  }

  handleAction(event: { type: string, empresa: any }) {
    this.selectedEmpresa = event.empresa;

    switch (event.type) {
      case 'view_details':
        this.showDetailsModal = true;
        break;

      case 'toggle_status':
        this.confirmData = {
          title: event.empresa.estado === 'ACTIVO' ? '¿Desactivar Empresa?' : '¿Activar Empresa?',
          message: event.empresa.estado === 'ACTIVO'
            ? 'La empresa y sus usuarios perderán acceso inmediato al sistema.'
            : 'Se restaurará el acceso completo para la empresa y sus empleados.',
          confirmText: event.empresa.estado === 'ACTIVO' ? 'Desactivar Ahora' : 'Activar Ahora',
          type: event.empresa.estado === 'ACTIVO' ? 'danger' : 'success',
          icon: event.empresa.estado === 'ACTIVO' ? 'bi-toggle-off' : 'bi-toggle-on',
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
          icon: 'bi-box-arrow-in-right',
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
        next: (updated) => {
          this.selectedEmpresa.estado = updated.activo ? 'ACTIVO' : 'INACTIVO';
          this.selectedEmpresa.activo = updated.activo;
          this.uiService.showToast(
            `Empresa ${updated.activo ? 'activada' : 'desactivada'} correctamente`,
            'success'
          );
          this.loadStats(); // Refrescar stats
        },
        error: (err) => this.uiService.showToast('Error al cambiar estado', 'danger')
      });
    } else if (this.confirmData.action === 'SUPPORT') {
      this.uiService.showToast('Accediendo al panel de la empresa...', 'info');
    }
    this.showConfirmModal = false;
  }

  updatePlan(event: { planId: string, monto: number, observaciones: string }) {
    this.empresaService.changePlan(this.selectedEmpresa.id, event.planId, event.monto, event.observaciones).subscribe({
      next: () => {
        this.selectedEmpresa.plan = event.planId; // Ideally map to name, but ID is updated
        this.uiService.showToast('Plan de suscripción actualizado', 'success');
        this.loadData();
        this.showPlanModal = false;
      },
      error: (err) => {
        console.error('Error changing plan', err);
        this.uiService.showToast('Error al actualizar el plan', 'danger');
      }
    });
  }

  updateVendedor(vendedorId: number | null) {
    const empresaIdStr = this.selectedEmpresa.id.toString();
    const vendedorIdStr = vendedorId !== null ? vendedorId.toString() : null;

    this.empresaService.assignVendor(empresaIdStr, vendedorIdStr).subscribe({
      next: () => {
        this.uiService.showToast('Vendedor asignado correctamente', 'success');
        this.loadEmpresas(); // Recargar lista para actualizar nombre del vendedor
        this.showVendedorModal = false;
      },
      error: (err) => {
        console.error('Error assigning vendor', err);
        this.uiService.showToast('Error al asignar vendedor', 'danger');
      }
    });
  }

  saveEmpresa(data: any) {
    this.empresaService.createEmpresa(data).subscribe({
      next: (empresa) => {
        this.loadData();
        this.showCreateModal = false;
        this.uiService.showToast('¡Empresa registrada exitosamente!', 'success');
      },
      error: (err) => {
        console.error('Error creating empresa', err);
        let errorTitle = 'Error al registrar empresa';
        let errorDescription = 'Ocurrió un error inesperado al procesar la solicitud.';

        if (err.error) {
          if (typeof err.error.detail === 'string') {
            errorDescription = err.error.detail;
          } else if (Array.isArray(err.error.detail)) {
            errorTitle = 'Error de Validación';
            // Handle validation errors (array of objects)
            const firstError = err.error.detail[0];
            if (firstError && firstError.msg) {
              errorDescription = firstError.msg;
              // If it's a value error (checking specifically for "Value error,")
              if (errorDescription.includes('Value error,')) {
                errorDescription = errorDescription.split('Value error,')[1].trim();
              }
            } else {
              errorDescription = JSON.stringify(err.error.detail);
            }
          }
        }

        this.uiService.showToast(errorTitle, 'danger', errorDescription);
      }
    });



  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService, Plan } from './services/plan.service';
import { PlanStatsComponent } from './components/plan-stats/plan-stats.component';
import { PlanActionsComponent } from './components/plan-actions/plan-actions.component';
import { PlanTableComponent } from './components/plan-table/plan-table.component';
import { PlanModalComponent } from './components/plan-modal/plan-modal.component';
import { PlanCompaniesModalComponent } from './components/plan-companies-modal/plan-companies-modal.component';
// import { PlanHistoryModalComponent } from './components/plan-history-modal/plan-history-modal.component';
import { PlanDetailsModalComponent } from './components/plan-details-modal/plan-details-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { UiService } from '../../../shared/services/ui.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-planes',
  template: `
    <div class="planes-page-container animate__animated animate__fadeIn">
      
      <!-- 1. ESTADÍSTICAS DE PLANES -->
      <app-plan-stats
        [stats]="stats"
      ></app-plan-stats>

      <!-- 2. ACCIONES Y BÚSQUEDA -->
      <app-plan-actions
        [(searchQuery)]="searchQuery"
        (onCreate)="openCreateModal()"
      ></app-plan-actions>

      <!-- 3. TABLA DE PLANES -->
      <app-plan-table
        [planes]="filteredPlanes"
        (onEdit)="editPlan($event)"
        (onViewCompanies)="viewCompanies($event)"
        (onViewDetails)="viewDetails($event)"
        (onToggleStatus)="handleToggleStatus($event)"
        (onToggleVisibility)="handleToggleVisibility($event)"
      ></app-plan-table>

      <!-- 4. MODALES -->
      
      <!-- Ver Detalles del Plan -->
      <app-plan-details-modal
        *ngIf="showDetailsModal && selectedPlan"
        [plan]="selectedPlan"
        (onClose)="showDetailsModal = false"
      ></app-plan-details-modal>
      
      <!-- Crear / Editar Plan -->
      <app-plan-modal
        *ngIf="showPlanModal"
        [plan]="selectedPlan"
        [saving]="saving"
        (onSave)="savePlan($event)"
        (onClose)="showPlanModal = false"
      ></app-plan-modal>

      <!-- Ver Empresas por Plan -->
      <app-plan-companies-modal
        *ngIf="showCompaniesModal"
        [planName]="selectedPlanName"
        [companies]="selectedPlanCompanies"
        (onClose)="showCompaniesModal = false"
      ></app-plan-companies-modal>

      <!-- Historial de Cambios moved to Suscripciones -->

      <!-- Modal de Confirmación Genérico -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        [loading]="isProcessingConfirm"
        [title]="confirmTitle"
        [message]="confirmMessage"
        [confirmText]="confirmBtnText"
        [type]="confirmType"
        [icon]="confirmIcon"
        (onConfirm)="executeConfirmedAction()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>



      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .planes-page-container {
      padding: 1.5rem 2rem;
      position: relative;
      min-height: 400px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    PlanStatsComponent,
    PlanActionsComponent,
    PlanTableComponent,
    PlanModalComponent,
    PlanCompaniesModalComponent,
    PlanDetailsModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ]
})
export class PlanesPage implements OnInit {
  planes: Plan[] = [];
  searchQuery: string = '';
  stats: any = {};

  // UI Control
  showPlanModal: boolean = false;
  showCompaniesModal: boolean = false;
  showDetailsModal: boolean = false;
  showConfirmModal: boolean = false;

  // Loading States
  globalLoading: boolean = false;
  saving: boolean = false;
  isProcessingConfirm: boolean = false;

  selectedPlan: Plan | null = null;
  selectedPlanName: string = '';
  selectedPlanId: string = '';

  // Confirm Modal Config
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmBtnText: string = '';
  confirmType: 'primary' | 'danger' | 'success' = 'primary';
  confirmIcon: string = '';
  pendingAction: () => void = () => { };

  // Cache for companies to ensure instant access
  companiesCache: Map<string, any[]> = new Map();
  loadingMessage: string = 'Cargando configuración de planes...';

  constructor(
    private planService: PlanService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.globalLoading = true;
    this.loadingMessage = 'Cargando configuración de planes...';

    // Subscribe to planes stream
    this.planService.getPlanes().subscribe({
      next: (planes) => {
        this.planes = planes; // This updates automatically when service cache updates
        this.globalLoading = false;
        this.preloadAllCompanies();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
        this.globalLoading = false;
        this.uiService.showToast('Error al cargar planes', 'danger');
        this.cdr.markForCheck();
      }
    });

    // Subscribe to stats separately or reload them on demand
    this.loadStats();

    // Trigger initial data load
    this.planService.loadData(true);
  }

  loadStats() {
    this.planService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  preloadAllCompanies() {
    // We don't block the UI for this, we just fill the cache
    if (this.planes.length === 0) return;

    const requests = this.planes.map(plan =>
      this.planService.getCompanies(plan.id).pipe(
        map(companies => ({ planId: plan.id, companies }))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        results.forEach(result => {
          this.companiesCache.set(result.planId, result.companies);
        });
        console.log('✅ Empresas precargadas para todos los planes');
      },
      error: (err) => console.error('Error en precarga de empresas', err)
    });
  }

  get filteredPlanes() {
    if (!this.searchQuery) return this.planes;
    return this.planes.filter(p =>
      p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openCreateModal() {
    this.selectedPlan = null;
    this.showPlanModal = true;
  }

  editPlan(plan: Plan) {
    this.selectedPlan = plan;
    this.showPlanModal = true;
  }

  selectedPlanCompanies: any[] = [];

  viewCompanies(plan: Plan) {
    this.selectedPlanName = plan.name;
    this.selectedPlanId = plan.id;

    // Check cache first
    if (this.companiesCache.has(plan.id)) {
      this.selectedPlanCompanies = this.companiesCache.get(plan.id) || [];
      this.showCompaniesModal = true;
    } else {
      // Fallback if not ready (user clicked too fast)
      this.loadingMessage = 'Cargando empresas...';
      this.globalLoading = true;

      this.planService.getCompanies(plan.id).subscribe({
        next: (data) => {
          this.companiesCache.set(plan.id, data); // Update cache
          this.selectedPlanCompanies = data;
          this.showCompaniesModal = true;
          this.globalLoading = false;
        },
        error: (err) => {
          console.error('Error fetching companies', err);
          this.uiService.showToast('Error al cargar empresas del plan', 'danger');
          this.globalLoading = false;
        }
      });
    }
  }

  viewDetails(plan: Plan) {
    this.selectedPlan = plan;
    this.showDetailsModal = true;
  }

  savePlan(data: any) {
    this.saving = true;
    const planData = this.selectedPlan ? { ...data, id: this.selectedPlan.id } : data;

    this.planService.savePlan(planData).subscribe({
      next: () => {
        this.uiService.showToast(`Plan ${this.selectedPlan ? 'actualizado' : 'creado'} exitosamente`, 'success');
        this.showPlanModal = false;
        this.saving = false;
        // No manual this.planes update needed, service stream handles it

        // Refresh stats independently as they are invalidated
        this.loadStats();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.uiService.showError(err, 'Error al guardar plan');
        this.cdr.markForCheck();
      }
    });
  }

  handleToggleStatus(plan: Plan) {
    this.selectedPlan = plan;
    const activating = plan.status !== 'ACTIVO';

    this.confirmTitle = activating ? 'Activar Plan' : 'Desactivar Plan';
    this.confirmMessage = activating
      ? `¿Deseas activar el plan "${plan.name}"? Estará disponible para nuevas suscripciones.`
      : `¿Estás seguro de desactivar el plan "${plan.name}"? Las empresas actuales mantendrán su servicio, pero no se podrán realizar nuevas suscripciones a este plan.`;
    this.confirmBtnText = activating ? 'Activar Ahora' : 'Confirmar Desactivación';
    this.confirmType = activating ? 'success' : 'danger';
    this.confirmIcon = activating ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    this.pendingAction = () => {
      this.isProcessingConfirm = true;
      this.planService.savePlan({ ...plan, activo: activating }).subscribe({
        next: () => {
          this.uiService.showToast(`Plan ${activating ? 'activado' : 'desactivado'} correctamente`, 'success');
          this.showConfirmModal = false;
          this.isProcessingConfirm = false;
          // Stats might change on status change
          this.loadStats();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isProcessingConfirm = false;
          this.uiService.showError(err, 'Error al cambiar estado');
          this.cdr.markForCheck();
        }
      });
    };
    this.showConfirmModal = true;
  }

  handleToggleVisibility(plan: Plan) {
    this.selectedPlan = plan;
    const newVisible = !plan.visible_publico;

    this.confirmTitle = newVisible ? 'Mostrar en Web' : 'Ocultar de Web';
    this.confirmMessage = newVisible
      ? `¿Deseas que el plan "${plan.name}"? sea visible en la página pública?`
      : `¿Deseas ocultar el plan "${plan.name}"? de la página pública? Seguirá activo para gestión interna.`;
    this.confirmBtnText = 'Confirmar';
    this.confirmType = 'primary';
    this.confirmIcon = 'bi-eye-fill';

    this.pendingAction = () => {
      this.isProcessingConfirm = true;
      this.planService.savePlan({ ...plan, visible_publico: newVisible }).subscribe({
        next: () => {
          this.uiService.showToast(`Visibilidad actualizada correctamente`, 'success');
          this.showConfirmModal = false;
          this.isProcessingConfirm = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isProcessingConfirm = false;
          this.uiService.showError(err, 'Error al cambiar visibilidad');
          this.cdr.markForCheck();
        }
      });
    };
    this.showConfirmModal = true;
  }

  executeConfirmedAction() {
    this.pendingAction();
  }
}

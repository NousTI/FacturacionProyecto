import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';

// Components
import { SuscripcionStatsComponent } from './components/suscripcion-stats/suscripcion-stats.component';
import { SuscripcionTableComponent } from './components/suscripcion-table/suscripcion-table.component';
import { RegistroPagoModalComponent } from './components/registro-pago-modal/registro-pago-modal.component';
import { HistorialPagosModalComponent } from './components/historial-pagos-modal/historial-pagos-modal.component';
import { SuscripcionHistoryModalComponent } from './components/history-modal/history-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

// Services
import { SuscripcionService, Suscripcion, PagoHistorico } from './services/suscripcion.service';
import { UiService } from '../../../shared/services/ui.service';

@Component({
    selector: 'app-suscripciones',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SuscripcionStatsComponent,
        SuscripcionTableComponent,
        RegistroPagoModalComponent,
        HistorialPagosModalComponent,
        SuscripcionHistoryModalComponent,
        ConfirmModalComponent,
        ToastComponent
    ],
    template: `
    <div class="suscripciones-page-container animate__animated animate__fadeIn">
      
      <!-- 1. ESTADÍSTICAS -->
      <app-suscripcion-stats [stats]="stats"></app-suscripcion-stats>

      <!-- 2. CONTROL Y FILTROS -->
      <div class="d-flex justify-content-between align-items-center mb-4">
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
           <button class="btn-tab" (click)="showHistorySectionModal = true">
             <i class="bi bi-clock-history me-1"></i> Historial
           </button>
           <div class="vr mx-1"></div>
           <button class="btn-tab" [class.active]="filterStatus === 'ALL'" (click)="setFilter('ALL')">Todos</button>
           <button class="btn-tab" [class.active]="filterStatus === 'ACTIVA'" (click)="setFilter('ACTIVA')">Activas</button>
           <button class="btn-tab" [class.active]="filterStatus === 'VENCIDA'" (click)="setFilter('VENCIDA')">Vencidas</button>
        </div>
      </div>

      <!-- 3. TABLA -->
      <app-suscripcion-table
        [suscripciones]="filteredSuscripciones"
        (onRegistrarPago)="openRegistroPago($event)"
        (onVerHistorial)="openHistorial($event)"
        (onActivar)="confirmarAccion($event, 'ACTIVAR')"
        (onCancelar)="confirmarAccion($event, 'CANCELAR')"
      ></app-suscripcion-table>

      <!-- 4. MODALES -->
      
      <!-- Registrar Pago -->
      <app-registro-pago-modal
        *ngIf="showRegistroPagoModal"
        [suscripcion]="selectedSuscripcion"
        [saving]="saving"
        (onSave)="handleRegistroPago($event)"
        (onClose)="showRegistroPagoModal = false"
      ></app-registro-pago-modal>

      <!-- Historial -->
      <app-historial-pagos-modal
        *ngIf="showHistorialModal"
        [companyName]="selectedSuscripcion?.empresa_nombre || ''"
        [pagos]="historialPagos"
        (onClose)="showHistorialModal = false"
      ></app-historial-pagos-modal>

      <!-- Historial General Sección -->
      <app-suscripcion-history-modal
        *ngIf="showHistorySectionModal"
        (onClose)="showHistorySectionModal = false"
      ></app-suscripcion-history-modal>

      <!-- Confirmación -->
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
      
      <!-- Loading Overlay -->
      <div *ngIf="globalLoading" class="loading-overlay">
         <div class="spinner-border text-primary" role="status"></div>
         <span class="ms-3 fw-bold text-white fs-5">Cargando suscripciones...</span>
      </div>
    </div>
  `,
    styles: [`
    .suscripciones-page-container {
      padding: 1.5rem 2rem;
      position: relative;
      min-height: 400px;
    }
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

    .loading-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.8); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      z-index: 50; border-radius: 20px;
    }
  `]
})
export class SuscripcionesPage implements OnInit {
    suscripciones: Suscripcion[] = [];
    historialPagos: PagoHistorico[] = [];

    stats = {
        active: 0,
        overdue: 0,
        projectedCollection: 0
    };

    searchQuery = '';
    filterStatus = 'ALL';

    // UI State
    globalLoading = false;
    saving = false;
    showRegistroPagoModal = false;
    showHistorialModal = false;
    showHistorySectionModal = false; // New modal for general history

    selectedSuscripcion: Suscripcion | null = null;

    // Confirm Modal
    showConfirmModal = false;
    isProcessingConfirm = false;
    confirmTitle = '';
    confirmMessage = '';
    confirmBtnText = '';
    confirmType: 'primary' | 'danger' | 'success' = 'primary';
    confirmIcon = '';
    pendingAction: () => void = () => { };

    constructor(
        private susService: SuscripcionService,
        private uiService: UiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.globalLoading = true;
        this.susService.clearCache();

        // Workflow: Get Planes -> Get Companies per Plan -> Aggregate
        this.susService.getPlanes().pipe(
            map(planes => {
                // Prepare requests for companies
                const requests = planes.map(plan =>
                    this.susService.getEmpresasPorPlan(plan.id).pipe(
                        map(companies => companies.map(c => ({
                            ...c,
                            plan_nombre: plan.nombre || plan.name, // Handle backend naming inconsistency if any 
                            plan_id: plan.id,
                            precio_plan: plan.precio_mensual || plan.price
                        })))
                    )
                );
                return { planes, requests };
            })
        ).subscribe({
            next: ({ requests }) => {
                if (requests.length === 0) {
                    this.suscripciones = [];
                    this.globalLoading = false;
                    this.cdr.markForCheck();
                    return;
                }

                forkJoin(requests).subscribe({
                    next: (results) => {
                        // Flatten results
                        const allCompanies = results.flat();

                        // Map to Suscripcion interface
                        this.suscripciones = allCompanies.map(c => this.mapCompanyToSuscripcion(c));

                        this.calculateStats();
                        this.globalLoading = false;
                        this.cdr.markForCheck();
                    },
                    error: (err) => {
                        console.error(err);
                        this.uiService.showToast('Error cargando empresas', 'danger');
                        this.globalLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error(err);
                this.uiService.showToast('Error cargando planes', 'danger');
                this.globalLoading = false;
            }
        });
    }

    mapCompanyToSuscripcion(c: any): Suscripcion {
        // Inference logic
        const isOverdue = c.fecha_vencimiento ? new Date(c.fecha_vencimiento) < new Date() : false;
        let estado: any = c.activo ? 'ACTIVA' : 'SUSPENDIDA';

        // If active but overdue, mark as VENCIDA
        if (c.activo && isOverdue) {
            estado = 'VENCIDA';
        }

        return {
            id: c.suscripcion_id || c.id, // Ensure we have a subscription ID or use comp ID as fallback
            empresa_id: c.id,
            empresa_nombre: c.razon_social || c.nombre_comercial,
            plan_id: c.plan_id,
            plan_nombre: c.plan_nombre,
            precio_plan: c.precio_plan,
            fecha_inicio: c.fecha_inicio || c.created_at,
            fecha_fin: c.fecha_vencimiento,
            estado: estado,
            created_at: c.created_at || '',
            updated_at: ''
        };
    }

    calculateStats() {
        let active = 0;
        let overdue = 0;
        let projected = 0;

        this.suscripciones.forEach(s => {
            if (s.estado === 'ACTIVA') {
                active++;
                projected += Number(s.precio_plan || 0);
            } else if (s.estado === 'VENCIDA') {
                overdue++;
                // Maybe add to projected if we expect them to pay? Let's say yes.
                projected += Number(s.precio_plan || 0);
            }
        });

        this.stats = { active, overdue, projectedCollection: projected };
    }

    get filteredSuscripciones() {
        let filtered = this.suscripciones;

        // Search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                (s.empresa_nombre || '').toLowerCase().includes(q) ||
                (s.plan_nombre || '').toLowerCase().includes(q)
            );
        }

        // Status Filter
        if (this.filterStatus !== 'ALL') {
            filtered = filtered.filter(s => s.estado === this.filterStatus);
        }

        return filtered;
    }

    setFilter(status: string) {
        this.filterStatus = status;
    }

    // --- Actions ---

    openRegistroPago(sub: Suscripcion) {
        this.selectedSuscripcion = sub;
        this.showHistorialModal = false; // Close other modals
        this.showConfirmModal = false;
        this.showRegistroPagoModal = true;
        this.cdr.detectChanges();
    }

    handleRegistroPago(data: any) {
        this.saving = true;
        this.susService.registrarPago(data).subscribe({
            next: () => {
                this.uiService.showToast('Pago registrado exitosamente', 'success');
                this.showRegistroPagoModal = false;
                this.saving = false;
                this.loadData(); // Reload to update dates/status if changed
            },
            error: (err) => {
                this.saving = false;
                this.uiService.showError(err, 'Error al registrar pago');
            }
        });
    }

    openHistorial(sub: Suscripcion) {
        this.selectedSuscripcion = sub;
        this.showRegistroPagoModal = false; // Close other modals
        this.showConfirmModal = false;

        this.susService.getPagos(sub.empresa_id).subscribe({
            next: (pagos) => {
                this.historialPagos = pagos;
                this.showHistorialModal = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.uiService.showError(err, 'Error al cargar historial');
                this.cdr.detectChanges();
            }
        });
    }

    confirmarAccion(sub: Suscripcion, accion: 'ACTIVAR' | 'CANCELAR') {
        this.selectedSuscripcion = sub;

        if (accion === 'CANCELAR') {
            this.confirmTitle = 'Cancelar Suscripción';
            this.confirmMessage = `¿Estás seguro de cancelar la suscripción de "${sub.empresa_nombre}"? El servicio se detendrá.`;
            this.confirmBtnText = 'Cancelar Suscripción';
            this.confirmType = 'danger';
            this.confirmIcon = 'bi-x-circle-fill';
            this.pendingAction = () => {
                this.callSuscripcionAction(sub.empresa_id, 'cancelar');
            };
        } else {
            this.confirmTitle = 'Activar Suscripción';
            this.confirmMessage = `¿Reactivar el servicio para "${sub.empresa_nombre}"?`;
            this.confirmBtnText = 'Reactivar';
            this.confirmType = 'success';
            this.confirmIcon = 'bi-check-circle-fill';
            this.pendingAction = () => {
                // Activar usually requires data, but let's see if we can just reactivate.
                // Schema allows activating via `activar_suscripcion` which takes data.
                // For simplicity, we might not implementation full re-activation logic here if it needs a plan selection.
                // I'll assume endpoint /activar works or I should use 'suspender' toggle?
                // The backend has /activar, /cancelar, /suspender.
                // I'll assume manual activation needs plan info. But if it's just reactivating a cancelled one...
                // Let's try activating with currrent plan data if possible.
                // Actually, `activar` endpoint takes `SuscripcionCreacion`.
                // I will implement Suspender/Levantar Suspensión logic instead if 'Activar' refers to that.
                // But user asked for "Activa/Vencida/En gracia".
                // I'll leave ACTIVAR pending or redirect to "Edit Subscription"?
                // For now, I'll allow canceling. 
                // If user wants to re-activate, maybe that's "Nuevo Plan" or "Registrar Pago" (if expired).
                this.uiService.showToast('Funcionalidad de reactivación directa pendiente de validación.', 'warning');
                this.showConfirmModal = false;
                return;
            };
        }

        this.showRegistroPagoModal = false; // Close other modals
        this.showHistorialModal = false;
        this.showConfirmModal = true;
        this.cdr.detectChanges();
    }

    callSuscripcionAction(id: string, action: 'cancelar' | 'suspender') {
        this.isProcessingConfirm = true;
        const obs = 'Acción administrativa desde dashboard';

        const request = action === 'cancelar'
            ? this.susService.cancelarSuscripcion(id, obs)
            : this.susService.suspenderSuscripcion(id, obs);

        request.subscribe({
            next: () => {
                this.uiService.showToast(`Suscripción ${action === 'cancelar' ? 'cancelada' : 'suspendida'}`, 'success');
                this.isProcessingConfirm = false;
                this.showConfirmModal = false;
                this.loadData();
            },
            error: (err) => {
                this.isProcessingConfirm = false;
                this.uiService.showError(err, 'Error al procesar acción');
            }
        });
    }

    executeConfirmedAction() {
        this.pendingAction();
    }
}

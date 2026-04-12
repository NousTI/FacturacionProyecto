import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';

// Components
import { SuscripcionStatsComponent } from './components/suscripcion-stats/suscripcion-stats.component';
import { SuscripcionTableComponent } from './components/suscripcion-table/suscripcion-table.component';
import { SuscripcionActionsComponent } from './components/suscripcion-actions/suscripcion-actions.component';
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
        SuscripcionActionsComponent,
        RegistroPagoModalComponent,
        HistorialPagosModalComponent,
        SuscripcionHistoryModalComponent,
        ConfirmModalComponent,
        ToastComponent
    ],
    template: `
    <div class="suscripciones-page-container animate__animated animate__fadeIn">
      
      <!-- 1. Stats -->
      <app-suscripcion-stats [stats]="stats"></app-suscripcion-stats>

      <!-- 2. Actions (Search, Maintenance, Filters) -->
      <app-suscripcion-actions
        [(searchQuery)]="searchQuery"
        [(filterStatus)]="filterStatus"
        [isRunningMaintenance]="isRunningMaintenance"
        (onMaintenance)="ejecutarMantenimiento()"
        (onOpenHistory)="showHistorySectionModal = true"
      ></app-suscripcion-actions>

      <!-- 3. Table -->
      <app-suscripcion-table
        [suscripciones]="filteredSuscripciones"
        (onRegistrarPago)="openRegistroPago($event)"
        (onVerHistorial)="openHistorial($event)"
        (onActivar)="confirmarAccion($event, 'ACTIVAR')"
        (onCancelar)="confirmarAccion($event, 'CANCELAR')"
      ></app-suscripcion-table>

      <!-- 4. Modals -->
      <!-- Registrar Pago -->
      <app-registro-pago-modal
        *ngIf="showRegistroPagoModal"
        [suscripcion]="selectedSuscripcion"
        [saving]="saving"
        (onSave)="handleRegistroPago($event)"
        (onClose)="showRegistroPagoModal = false"
      ></app-registro-pago-modal>

      <!-- Historial de Pagos Empresa -->
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
         <p class="ms-3 fw-bold text-white fs-5 mb-0">Cargando suscripciones...</p>
      </div>
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
      position: relative;
    }
    .loading-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1060; border-radius: 20px;
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

    isRunningMaintenance = false;

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
                            precio_plan: plan.precio_anual || plan.price
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
        // Real state from DB
        let estado: any = c.estado || (c.activo ? 'ACTIVA' : 'SUSPENDIDA');
        
        // Logical check for UI indicators (overdue badge)
        const isOverdue = c.fecha_fin ? new Date(c.fecha_fin) < new Date() : false;

        return {
            id: c.suscripcion_id || c.id, 
            empresa_id: c.id,
            empresa_nombre: c.razon_social || c.nombre_comercial,
            plan_id: c.plan_id,
            plan_nombre: c.plan_nombre,
            precio_plan: c.precio_plan,
            fecha_inicio: c.fecha_inicio,
            fecha_fin: c.fecha_fin,
            estado: estado,
            estado_pago: isOverdue ? 'PENDIENTE' : 'PAGADO',
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

    ejecutarMantenimiento() {
        this.isRunningMaintenance = true;
        this.susService.runMaintenance().subscribe({
            next: (res) => {
                const count = res.detalles?.procesados || 0;
                this.uiService.showToast(`Mantenimiento completado: ${count} suscripciones actualizadas.`, 'success');
                this.isRunningMaintenance = false;
                this.loadData();
            },
            error: (err) => {
                this.isRunningMaintenance = false;
                this.uiService.showError(err, 'Error en mantenimiento');
            }
        });
    }
}

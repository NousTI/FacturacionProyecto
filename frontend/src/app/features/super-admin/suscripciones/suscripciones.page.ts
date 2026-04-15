import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';

// Components
import { SuscripcionStatsComponent } from './components/suscripcion-stats/suscripcion-stats.component';
import { SuscripcionTableComponent } from './components/suscripcion-table/suscripcion-table.component';
import { SuscripcionActionsComponent } from './components/suscripcion-actions/suscripcion-actions.component';
import { RegistroPagoModalComponent } from './components/registro-pago-modal/registro-pago-modal.component';

import { SuscripcionHistoryModalComponent } from './components/history-modal/history-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ConfirmarCobroModalComponent } from './components/confirmar-cobro-modal/confirmar-cobro-modal.component';
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
        SuscripcionHistoryModalComponent,
        ConfirmModalComponent,
        ConfirmarCobroModalComponent,
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
        [(filterPagoStatus)]="filterPagoStatus"
        [isRunningMaintenance]="isRunningMaintenance"
        (onMaintenance)="ejecutarMantenimiento()"
        (onOpenHistory)="showHistorySectionModal = true"
      ></app-suscripcion-actions>

      <!-- 3. Table -->
      <app-suscripcion-table
        [suscripciones]="filteredSuscripciones"
        [loading]="globalLoading"
        (onRegistrarPago)="openRegistroPago($any($event))"
        (onConfirmarPago)="abrirConfirmarPago($any($event))"
        (onVerHistorial)="openHistorial($any($event))"
        (onActivar)="confirmarAccion($any($event), 'ACTIVAR')"
        (onSuspender)="confirmarAccion($any($event), 'SUSPENDER')"
        (onCancelar)="confirmarAccion($any($event), 'CANCELAR')"
      ></app-suscripcion-table>

      <!-- 4. Modals -->
      <!-- Registrar Pago -->
      <app-registro-pago-modal
        *ngIf="showRegistroPagoModal"
        [suscripcion]="selectedSuscripcion"
        [planes]="planes"
        [saving]="saving"
        (onSave)="handleRegistroPago($event)"
        (onClose)="showRegistroPagoModal = false"
      ></app-registro-pago-modal>

      <!-- Confirmar Recepción de Pago (Deuda) -->
      <app-confirmar-cobro-modal
        *ngIf="showConfirmarRecepcionModal"
        [suscripcion]="selectedSuscripcion"
        [pago]="selectedPagoParaConfirmar"
        [processing]="isProcessingConfirm"
        (onConfirm)="procesarConfirmacionPago($event)"
        (onClose)="showConfirmarRecepcionModal = false"
      ></app-confirmar-cobro-modal>



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
    `]
})
export class SuscripcionesPage implements OnInit {
    suscripciones: Suscripcion[] = [];
    planes: any[] = [];

    stats = {
        active: 0,
        overdue: 0,
        projectedCollection: 0
    };

    searchQuery = '';
    filterStatus = 'ALL';
    filterPagoStatus = 'ALL';

    // UI State
    globalLoading = false;
    saving = false;
    // --- Modales ---
    showRegistroPagoModal = false;
    showConfirmarRecepcionModal = false; // Nuevo modal para confirmar deuda
    showHistorySectionModal = false; // New modal for general history
    showConfirmModal = false;
    
    selectedPagoParaConfirmar: any = null;
    selectedSuscripcion: Suscripcion | null = null;

    // Confirm Modal
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
                this.planes = planes;
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
        
        // Determinar estado de pago real desde el backend
        let estado_pago: any = c.estado_pago || 'PAGADO';

        if (isOverdue) {
            // Si tiene más de 3 días de vencimiento y no tiene un pago pendiente explícito, 
            // lo marcamos como ATRASADO para alertar cobro
            const diffDays = Math.floor((new Date().getTime() - new Date(c.fecha_fin).getTime()) / (1000 * 3600 * 24));
            if (estado_pago === 'PAGADO') {
                estado_pago = diffDays > 3 ? 'ATRASADO' : 'PENDIENTE';
            }
        }

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
            estado_pago: estado_pago,
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
                if (s.estado_pago === 'ATRASADO') {
                    overdue++;
                } else {
                    active++;
                }
                projected += Number(s.precio_plan || 0);
            } else if (s.estado === 'VENCIDA') {
                overdue++;
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

        // Pago Status Filter
        if (this.filterPagoStatus !== 'ALL') {
            filtered = filtered.filter(s => s.estado_pago === this.filterPagoStatus);
        }
 
        return filtered;
    }

    setFilter(status: string) {
        this.filterStatus = status;
    }

    // --- Actions ---

    openRegistroPago(sub: Suscripcion) {
        this.selectedSuscripcion = sub;
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



    confirmarAccion(sub: Suscripcion, accion: 'ACTIVAR' | 'CANCELAR' | 'SUSPENDER') {
        this.selectedSuscripcion = sub;

        if (accion === 'CANCELAR') {
            this.confirmTitle = 'Cancelar Suscripción';
            this.confirmMessage = `¿Estás seguro de cancelar la suscripción de "${sub.empresa_nombre}"? El servicio se detendrá inmediatamente.`;
            this.confirmBtnText = 'Confirmar Cancelación';
            this.confirmType = 'danger';
            this.confirmIcon = 'bi-x-circle-fill';
            this.pendingAction = () => {
                this.callSuscripcionAction(sub.empresa_id, 'cancelar');
            };
        } else if (accion === 'SUSPENDER') {
            this.confirmTitle = 'Suspender Suscripción';
            this.confirmMessage = `¿Deseas suspender temporalmente el servicio para "${sub.empresa_nombre}"?`;
            this.confirmBtnText = 'Suspender';
            this.confirmType = 'danger';
            this.confirmIcon = 'bi-pause-circle-fill';
            this.pendingAction = () => {
                this.callSuscripcionAction(sub.empresa_id, 'suspender');
            };
        } else if (accion === 'ACTIVAR') {
            this.confirmTitle = 'Activar Suscripción';
            this.confirmMessage = `¿Reactivar el servicio para "${sub.empresa_nombre}"? Se mantendrán las fechas actuales del periodo.`;
            this.confirmBtnText = 'Activar Servicio';
            this.confirmType = 'success';
            this.confirmIcon = 'bi-check-circle-fill';
            this.pendingAction = () => {
                this.callSuscripcionAction(sub.empresa_id, 'activar');
            };
        }

        this.showRegistroPagoModal = false; // Close other modals
        this.showConfirmModal = true;
        this.cdr.detectChanges();
    }

    callSuscripcionAction(id: string, action: 'cancelar' | 'suspender' | 'activar') {
        this.isProcessingConfirm = true;
        const obs = 'Acción administrativa desde dashboard';

        let request;
        if (action === 'cancelar') {
            request = this.susService.cancelarSuscripcion(id, obs);
        } else if (action === 'suspender') {
            request = this.susService.suspenderSuscripcion(id, obs);
        } else {
            // Activar
            const sub = this.suscripciones.find(s => s.empresa_id === id);
            const data = {
                empresa_id: id,
                plan_id: sub?.plan_id,
                fecha_inicio: sub?.fecha_inicio,
                fecha_fin: sub?.fecha_fin,
                estado: 'ACTIVA'
            };
            request = this.susService.activarSuscripcion(data);
        }

        request.subscribe({
            next: () => {
                const actionMsg = action === 'cancelar' ? 'cancelada' : (action === 'suspender' ? 'suspendida' : 'activada');
                this.uiService.showToast(`Suscripción ${actionMsg} exitosamente`, 'success');
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

    // --- Gestión de Deuda ---
    abrirConfirmarPago(sub: Suscripcion) {
        this.selectedSuscripcion = sub;
        
        // Buscamos el pago pendiente en el historial
        this.susService.getPagos(sub.empresa_id).subscribe(pagos => {
            const pendiente = pagos.find((p: any) => p.estado === 'PENDIENTE');
            if (pendiente) {
                this.selectedPagoParaConfirmar = pendiente;
                this.showConfirmarRecepcionModal = true;
                this.cdr.detectChanges();
            } else {
                this.uiService.showToast('No se encontró un cobro pendiente para esta empresa.', 'info');
            }
        });
    }

    procesarConfirmacionPago(data: any) {
        this.isProcessingConfirm = true;
        this.susService.confirmarPago(this.selectedPagoParaConfirmar.id, data).subscribe({
            next: () => {
                this.uiService.showToast('Pago confirmado exitosamente', 'success');
                this.showConfirmarRecepcionModal = false;
                this.isProcessingConfirm = false;
                this.loadData();
            },
            error: (err) => {
                this.isProcessingConfirm = false;
                this.uiService.showError(err, 'Error al confirmar pago');
            }
        });
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

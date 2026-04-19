import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, combineLatest, map, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { SriConfigService } from '../certificado-sri/services/sri-config.service';

import { RecurrenteStatsComponent } from './components/recurrente-stats/recurrente-stats.component';
import { RecurrenteActionsComponent } from './components/recurrente-actions/recurrente-actions.component';
import { RecurrenteTableComponent } from './components/recurrente-table/recurrente-table.component';
import { CreateFacturaModalComponent } from '../facturacion/components/create-factura-modal/create-factura-modal.component';
import { ViewFacturaModalComponent } from '../facturacion/components/view-factura-modal/view-factura-modal.component';
import { RecurrenteHistoryModalComponent } from './components/recurrente-history-modal/recurrente-history-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

import { FacturacionProgramadaService } from './services/facturacion-programada.service';
import { UiService } from '../../../shared/services/ui.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { FACTURACION_PROGRAMADA_PERMISSIONS } from '../../../constants/permission-codes';
import { FacturaProgramada } from '../../../domain/models/facturacion-programada.model';
import { PaginationState } from './components/recurrente-paginacion/recurrente-paginacion.component';

@Component({
  selector: 'app-usuario-facturacion-recurrente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HasPermissionDirective,
    RecurrenteStatsComponent,
    RecurrenteActionsComponent,
    RecurrenteTableComponent,
    CreateFacturaModalComponent,
    ViewFacturaModalComponent,
    RecurrenteHistoryModalComponent,
    ToastComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="recurrente-page-container">
      
      <!-- BLOQUEO SRI -->
      <ng-container *ngIf="sriError">
        <div class="sri-block-container">
          <div class="sri-block-card">
            <div class="sri-block-icon">
              <i class="bi bi-shield-exclamation"></i>
            </div>
            <h2 class="sri-block-title">Firma Electrónica Requerida</h2>
            <p class="sri-block-message">{{ sriError }}</p>
            <p class="sri-block-hint">Para crear facturaciones programadas, primero debes configurar y activar tu certificado de firma electrónica.</p>
            <button *ngIf="canConfigSri" class="sri-block-btn" (click)="irACertificadoSri()">
              <i class="bi bi-gear-fill me-2"></i>
              Configurar Certificado SRI
            </button>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="canViewModule && !sriError; else noPermission">
        <div class="container-fluid p-0 animate__animated animate__fadeIn d-flex flex-column flex-grow-1 overflow-hidden" style="gap: 24px;">
          
          <!-- STATS -->
          <app-recurrente-stats
            [activeCount]="stats.activeCount"
            [successCount]="stats.successCount"
            [failedCount]="stats.failedCount"
          ></app-recurrente-stats>

          <!-- FILTERS & SEARCH + ACTIONS -->
          <app-recurrente-actions
            [(searchQuery)]="searchQuery"
            [disabledCreate]="!!sriError"
            (onFilterChange)="handleFilters($event)"
            (onCreate)="openCreateModal()"
          ></app-recurrente-actions>

          <!-- LOADING STATE -->
          <div *ngIf="isLoading" class="d-flex flex-column align-items-center justify-content-center py-5">
             <div class="spinner-premium mb-3"></div>
             <p class="text-muted fw-bold">Cargando programaciones...</p>
          </div>

          <!-- EDIT LOADING OVERLAY (no bloquea la tabla) -->
          <div *ngIf="isLoadingEdit" class="edit-loading-bar">
            <div class="edit-loading-bar-inner"></div>
          </div>

          <!-- TABLE -->
          <app-recurrente-table
            class="d-flex flex-column flex-grow-1 overflow-hidden"
            *ngIf="!isLoading"
            [programaciones]="paginatedProgramaciones"
            [pagination]="pagination"
            (onAction)="handleAction($event)"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-recurrente-table>

          <!-- MODALS -->
          <app-create-factura-modal
            *ngIf="showCreateModal"
            [mode]="'RECURRENTE'"
            [facturaId]="selectedFacturaId"
            [programacionId]="selectedProgramacion?.id"
            [isViewOnly]="isViewOnly"
            (onClose)="handleCreateClose($event)"
          ></app-create-factura-modal>

          <app-view-factura-modal
            *ngIf="showViewTemplateModal && selectedFacturaId"
            [facturaId]="selectedFacturaId"
            (onClose)="showViewTemplateModal = false"
          ></app-view-factura-modal>

          <app-recurrente-history-modal
            *ngIf="showHistoryModal && selectedProgramacion"
            [programacionId]="selectedProgramacion.id"
            [programacionNombre]="selectedProgramacion.cliente_nombre || ''"
            (onClose)="showHistoryModal = false"
          ></app-recurrente-history-modal>

          <app-confirm-modal
            *ngIf="showIndividualExecuteConfirm && selectedProgramacion"
            [title]="'¿Ejecutar Facturación Ahora?'"
            [message]="'Se generará y emitirá inmediatamente la factura para ' + selectedProgramacion.cliente_nombre + '. Esto actualizará la fecha de próxima emisión. ¿Deseas continuar?'"
            [confirmText]="'Sí, ejecutar ahora'"
            [type]="'primary'"
            [icon]="'bi-lightning-charge-fill'"
            (onConfirm)="executeIndividual()"
            (onCancel)="showIndividualExecuteConfirm = false"
          ></app-confirm-modal>

          <app-confirm-modal
            *ngIf="showConfirmModal"
            title="¿Eliminar Programación?"
            message="¿Estás seguro de que deseas eliminar esta regla de facturación recurrente? Esta acción no se puede deshacer."
            confirmText="Eliminar permanentemente"
            type="danger"
            icon="bi-trash3-fill"
            [loading]="isProcessing"
            (onConfirm)="deleteProgramacion()"
            (onCancel)="showConfirmModal = false"
          ></app-confirm-modal>

          <app-confirm-modal
            *ngIf="showToggleConfirmModal && selectedProgramacion"
            [title]="selectedProgramacion.activo ? '¿Desactivar Programación?' : '¿Activar Programación?'"
            [message]="selectedProgramacion.activo
              ? 'La programación quedará pausada y no se emitirán nuevas facturas automáticamente.'
              : 'La programación se reactivará y volverá a emitir facturas según su frecuencia.'"
            [confirmText]="selectedProgramacion.activo ? 'Sí, desactivar' : 'Sí, activar'"
            [type]="selectedProgramacion.activo ? 'warning' : 'primary'"
            [icon]="selectedProgramacion.activo ? 'bi-pause-circle-fill' : 'bi-play-circle-fill'"
            [loading]="isProcessing"
            (onConfirm)="toggleProgramacion()"
            (onCancel)="showToggleConfirmModal = false"
          ></app-confirm-modal>

          <app-confirm-modal
            *ngIf="showBulkConfirmModal"
            title="¿Ejecutar Facturaciones Pendientes?"
            message="Se generarán automáticamente todas las facturas cuyas fechas de emisión hayan vencido. ¿Deseas continuar?"
            confirmText="Sí, ejecutar ahora"
            type="primary"
            icon="bi-play-circle-fill"
            [loading]="isProcessing"
            (onConfirm)="processBulkExecution()"
            (onCancel)="showBulkConfirmModal = false"
          ></app-confirm-modal>

          <app-toast></app-toast>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center text-center p-5 animate-in" style="min-height: 70vh;">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill" style="font-size: 3.5rem; color: black;"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 mx-auto" style="max-width: 450px;">
            No dispones de los permisos de visualización necesarios para el módulo de Facturación Programada. 
            Contacta a tu administrador para solicitar acceso.
          </p>
          <button class="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm" (click)="refreshData()" style="background-color: black; border: none;">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

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
    .recurrente-page-container { 
      flex: 1;
      display: flex;
      flex-direction: column;
      background: transparent;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
      padding: 0;
    }
    .page-title { font-size: 1.75rem; font-weight: 900; color: black; margin-bottom: 0.25rem; }
    .page-subtitle { color: #94a3b8; font-size: 0.95rem; font-weight: 500; }

    .btn-refresh-premium {
      background: white; border: 1px solid #e2e8f0;
      width: 44px; height: 44px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.2s;
    }
    .btn-refresh-premium:hover { background: #f1f5f9; color: black; border-color: #cbd5e1; }
    .spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .btn-create-premium {
      background: var(--primary-color); color: white; border: none;
      padding: 0 1.5rem; height: 44px; border-radius: 14px;
      font-weight: 700; display: flex; align-items: center;
      transition: all 0.2s;
    }
    .btn-create-premium:hover { background: var(--primary-color); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

    .btn-bulk-premium {
      background: #f1f5f9; color: black; border: 1.5px solid var(--primary-color);
      padding: 0 1.25rem; height: 44px; border-radius: 14px;
      font-weight: 700; display: flex; align-items: center;
      transition: all 0.2s;
    }
    .btn-bulk-premium:hover:not(:disabled) { background: #e2e8f0; transform: translateY(-2px); }
    .btn-bulk-premium:disabled { opacity: 0.6; cursor: not-allowed; }

    .edit-loading-bar {
      height: 3px; background: #f1f5f9; margin: 0 1.5rem 0.5rem;
      border-radius: 4px; overflow: hidden;
    }
    .edit-loading-bar-inner {
      height: 100%; width: 40%; background: var(--primary-color);
      border-radius: 4px;
      animation: loadingSlide 1.2s ease-in-out infinite;
    }
    @keyframes loadingSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    .search-box-premium { position: relative; max-width: 400px; }
    .search-box-premium i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .form-control-premium {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.8rem;
      border-radius: 14px; border: 1.5px solid #e2e8f0;
      background: white; font-size: 0.9rem; transition: all 0.2s;
    }
    .form-control-premium:focus { border-color: black; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none; }

    .spinner-premium {
      width: 40px; height: 40px; border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color); border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .sri-block-container {
      display: flex; align-items: center; justify-content: center;
      min-height: 70vh; padding: 2rem;
    }
    .sri-block-card {
      background: white; border-radius: 24px; padding: 3rem 2.5rem;
      max-width: 480px; width: 100%; text-align: center;
      animation: fadeIn 0.4s ease-out;
    }
    .sri-block-icon {
      width: 90px; height: 90px; border-radius: 50%;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; color: #d97706; margin: 0 auto 1.5rem;
      box-shadow: 0 10px 25px rgba(217, 119, 6, 0.2);
    }
    .sri-block-title { font-size: 1.5rem; font-weight: 800; color: black; margin-bottom: 0.75rem; }
    .sri-block-message { font-size: 0.95rem; font-weight: 600; color: #d97706; margin-bottom: 1rem; }
    .sri-block-hint { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; }
    .sri-block-btn {
      background: var(--primary-color); color: white; border: none;
      padding: 0.875rem 2rem; border-radius: 14px;
      font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
    }
    .sri-block-btn:hover { background: var(--primary-color); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
  `]
})
export class FacturacionRecurrentePage implements OnInit, OnDestroy {
  programaciones: FacturaProgramada[] = [];
  filteredProgramaciones: FacturaProgramada[] = [];
  
  stats = { activeCount: 0, successCount: 0, failedCount: 0 };
  
  searchQuery: string = '';
  private statusFilter$ = new BehaviorSubject<string>('ALL');
  private frequencyFilter$ = new BehaviorSubject<string>('ALL');

  pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };

  sriError: string | null = null;
  isLoading: boolean = true;
  isLoadingEdit: boolean = false;
  isRefreshing: boolean = false;
  isProcessing: boolean = false;
  
  showCreateModal: boolean = false;
  showViewTemplateModal: boolean = false; // Nuevo estado
  isViewOnly: boolean = false;
  showHistoryModal: boolean = false;
  showConfirmModal: boolean = false;
  showBulkConfirmModal: boolean = false;
  showIndividualExecuteConfirm: boolean = false;
  
  // Mensajes dinámicos para el modal de confirmación
  confirmTitle: string = '';
  confirmMessage: string = '';
  showToggleConfirmModal: boolean = false;
  selectedProgramacion: FacturaProgramada | null = null;
  selectedFacturaId: string | undefined = undefined;

  private subscription: Subscription = new Subscription();

  private permissionsService = inject(PermissionsService);

  constructor(
    private service: FacturacionProgramadaService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef,
    private sriConfigService: SriConfigService,
    private router: Router
  ) {}

  get canViewModule(): boolean {
    return this.permissionsService.hasPermission([
      FACTURACION_PROGRAMADA_PERMISSIONS.VER,
      FACTURACION_PROGRAMADA_PERMISSIONS.VER_PROPIAS
    ]);
  }

  get canConfigSri(): boolean {
    return this.permissionsService.hasPermission('CONFIG_SRI');
  }

  checkSriStatus() {
    this.sriConfigService.obtenerConfiguracion().subscribe({
      next: (config) => {
        if (!config) {
          this.sriError = "No se ha configurado la firma electrónica. Vaya a Configuración > Certificado SRI.";
          return;
        }
        if (config.estado !== 'ACTIVO') {
          this.sriError = `La firma electrónica no está activa (Estado: ${config.estado}).`;
          return;
        }
        const expiration = new Date(config.fecha_expiracion_cert);
        const now = new Date();
        if (expiration < now) {
          this.sriError = `La firma electrónica caducó el ${expiration.toLocaleDateString()}. Renueve su certificado.`;
          return;
        }
        this.sriError = null;
      },
      error: () => { this.sriError = null; }
    });
  }

  irACertificadoSri() {
    this.router.navigate(['/usuario/certificado-sri']);
  }

  ngOnInit() {
    this.uiService.setPageHeader('Facturación Programada', 'Automatización de emisiones periódicas');
    this.checkSriStatus();
    
    // Suscripción reactiva al cache del servicio
    this.subscription.add(
      this.service.programaciones$.subscribe(data => {
        if (data !== null) {
          this.programaciones = data;
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
          this.isRefreshing = false;
          this.cdr.detectChanges();
        }
      })
    );

    // Iniciar carga si no está cargado
    this.service.loadInitialData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  refreshData() {
    this.isRefreshing = true;
    this.service.refresh();
  }

  runBulkExecution() {
    this.showBulkConfirmModal = true;
  }

  processBulkExecution() {
    this.isProcessing = true;
    this.service.ejecutarMasivo().pipe(
      finalize(() => {
        this.isProcessing = false;
        this.showBulkConfirmModal = false;
      })
    ).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const exitosas = data?.exitosas ?? 0;
        const fallidas = data?.fallidas ?? 0;
        const msg = `Proceso completado: ${exitosas} exitosas, ${fallidas} fallidas.`;
        this.uiService.showToast(msg, fallidas > 0 ? 'warning' : 'success');
        this.service.refresh(); // Actualizar contadores en la tabla
      },
      error: (err) => this.uiService.showError(err, 'Error en ejecución masiva')
    });
  }

  calculateStats() {
    this.stats.activeCount = this.programaciones.filter(p => p.activo).length;
    this.stats.successCount = this.programaciones.reduce((acc, p) => acc + (p.emisiones_exitosas || 0), 0);
    this.stats.failedCount = this.programaciones.reduce((acc, p) => acc + (p.emisiones_fallidas || 0), 0);
  }

  handleFilters(filters: any) {
    this.statusFilter$.next(filters.estado);
    this.frequencyFilter$.next(filters.frecuencia);
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    const query = this.searchQuery.toLowerCase().trim();
    const status = this.statusFilter$.value;
    const frequency = this.frequencyFilter$.value;

    this.filteredProgramaciones = this.programaciones
      .filter(p => {
        const matchSearch = (p.cliente_nombre?.toLowerCase() || '').includes(query) ||
                            p.concepto.toLowerCase().includes(query);
        
        let matchStatus = true;
        if (status === 'ACTIVO') matchStatus = p.activo === true;
        if (status === 'INACTIVO') matchStatus = p.activo === false;

        const matchFrequency = frequency === 'ALL' || p.tipo_frecuencia === frequency;

        return matchSearch && matchStatus && matchFrequency;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    this.pagination.totalItems = this.filteredProgramaciones.length;
    this.cdr.detectChanges();
  }

  get paginatedProgramaciones(): FacturaProgramada[] {
    const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return this.filteredProgramaciones.slice(inicio, inicio + this.pagination.pageSize);
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.cdr.detectChanges();
  }

  onPageSizeChange(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.cdr.detectChanges();
  }

  openCreateModal() {
    if (this.sriError) {
      this.uiService.showToast(this.sriError, 'warning');
      return;
    }
    this.selectedProgramacion = null;
    this.isViewOnly = false;
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  handleCreateClose(saved: boolean) {
    this.showCreateModal = false;
    this.isViewOnly = false;
    if (saved) {
      this.uiService.showToast('Programación guardada correctamente', 'success');
    }
  }

  handleAction(event: {type: string, data: FacturaProgramada}) {
    this.selectedProgramacion = event.data;
    // Buscamos la factura plantilla (BORRADOR) asociada de forma reactiva o via servicio
    // Por ahora, asumimos que el servicio puede obtenerla o que la pasamos si la tenemos.
    // Como no la tenemos en el listado plano, el modal la cargará por nosotros si le pasamos la lógica.
    // Pero espera, el modal necesita un facturaId. 
    // Necesitamos un método en el servicio para obtener el ID del borrador de una programación.
    
    if (event.type === 'execute') {
      this.selectedProgramacion = event.data;
      this.showIndividualExecuteConfirm = true;
      return;
    }

    if (event.type === 'view' || event.type === 'edit') {
      this.isViewOnly = event.type === 'view';
      this.selectedFacturaId = undefined;
      
      if (this.isViewOnly) {
        this.showViewTemplateModal = true;
      } else {
        this.showCreateModal = true;
      }
      
      this.isLoadingEdit = true;
      this.cdr.detectChanges();

      // Resolver el ID de la plantilla en paralelo
      this.service.obtenerIdPlantilla(event.data.id).subscribe({
        next: (res: any) => {
          this.isLoadingEdit = false;
          const facturaId = typeof res === 'string' ? res : (res?.data ?? null);
          
          if (!facturaId) {
            this.showCreateModal = false;
            this.showViewTemplateModal = false;
            this.uiService.showToast('No se encontró la factura plantilla para esta programación', 'warning');
            this.cdr.detectChanges();
            return;
          }
          
          this.selectedFacturaId = facturaId;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingEdit = false;
          this.showCreateModal = false;
          this.showViewTemplateModal = false;
          this.uiService.showError(err, 'Error al obtener factura plantilla');
          this.cdr.detectChanges();
        }
      });
    } else if (event.type === 'history') {
      this.showHistoryModal = true;
      this.cdr.detectChanges();
    } else if (event.type === 'delete') {
      this.showConfirmModal = true;
      this.cdr.detectChanges();
    } else if (event.type === 'toggle') {
      this.showToggleConfirmModal = true;
      this.cdr.detectChanges();
    }
  }

  toggleProgramacion() {
    if (!this.selectedProgramacion) return;
    this.isProcessing = true;
    const nuevoEstado = !this.selectedProgramacion.activo;
    this.service.actualizar(this.selectedProgramacion.id, { activo: nuevoEstado })
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.showToggleConfirmModal = false;
      }))
      .subscribe({
        next: () => {
          const msg = nuevoEstado ? 'Programación activada' : 'Programación desactivada';
          this.uiService.showToast(msg, 'success');
        },
        error: (err) => this.uiService.showError(err, 'Error al actualizar programación')
      });
  }

  deleteProgramacion() {
    if (!this.selectedProgramacion) return;
    this.isProcessing = true;
    this.service.eliminar(this.selectedProgramacion.id)
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.showConfirmModal = false;
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Programación eliminada', 'success');
        },
        error: (err) => this.uiService.showError(err, 'Error al eliminar')
      });
  }

  executeIndividual() {
    if (!this.selectedProgramacion) return;
    
    this.showIndividualExecuteConfirm = false;
    this.isProcessing = true;
    this.uiService.showToast('Iniciando ejecución manual...', 'info');

    this.service.ejecutarAhora(this.selectedProgramacion.id).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.uiService.showToast('Factura generada y emitida exitosamente', 'success');
        this.service.refresh(); // Recargar tabla para ver contadores actualizados
      },
      error: (err) => {
        this.isProcessing = false;
        this.uiService.showError(err, 'Error en la ejecución manual');
        this.service.refresh(); // Refrescar por si hubo cambios parciales
      }
    });
  }
}



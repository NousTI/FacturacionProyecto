import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, combineLatest, map } from 'rxjs';

import { RecurrenteStatsComponent } from './components/recurrente-stats/recurrente-stats.component';
import { RecurrenteTableComponent } from './components/recurrente-table/recurrente-table.component';
import { CreateFacturaModalComponent } from '../facturacion/components/create-factura-modal/create-factura-modal.component';
import { RecurrenteHistoryModalComponent } from './components/recurrente-history-modal/recurrente-history-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

import { FacturacionProgramadaService } from './services/facturacion-programada.service';
import { UiService } from '../../../shared/services/ui.service';
import { FacturaProgramada } from '../../../domain/models/facturacion-programada.model';

@Component({
  selector: 'app-usuario-facturacion-recurrente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RecurrenteStatsComponent,
    RecurrenteTableComponent,
    CreateFacturaModalComponent,
    RecurrenteHistoryModalComponent,
    ToastComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="recurrente-page-container">
      <div class="container-fluid p-0 animate__animated animate__fadeIn">
        
        <!-- FILTERS & SEARCH + ACTIONS -->
        <div class="px-4 mb-4">
          <div class="d-flex justify-content-between align-items-center gap-3">
             <div class="search-box-premium flex-grow-1">
                <i class="bi bi-search"></i>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  placeholder="Buscar por cliente o concepto..."
                  class="form-control-premium"
                >
             </div>
             <div class="d-flex gap-2">
                <button class="btn-refresh-premium" (click)="refreshData()" [class.spinning]="isRefreshing" title="Refrescar">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button class="btn-bulk-premium" (click)="runBulkExecution()" [disabled]="isProcessing" title="Ejecutar Facturaciones Pendientes">
                  <i class="bi bi-play-circle-fill me-2"></i>
                  Ejecutar Pendientes
                </button>
                <button class="btn-create-premium" (click)="openCreateModal()">
                  <i class="bi bi-plus-lg me-2"></i>
                  Nueva Programación
                </button>
             </div>
          </div>
        </div>

        <!-- STATS -->
        <div class="px-4 mb-4">
          <app-recurrente-stats
            [activeCount]="stats.activeCount"
            [successCount]="stats.successCount"
            [failedCount]="stats.failedCount"
          ></app-recurrente-stats>
        </div>

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
        <div class="px-4" *ngIf="!isLoading">
          <app-recurrente-table
            [programaciones]="filteredProgramaciones"
            (onAction)="handleAction($event)"
          ></app-recurrente-table>
        </div>

        <!-- MODALS -->
        <app-create-factura-modal
          *ngIf="showCreateModal"
          [mode]="'RECURRENTE'"
          [facturaId]="selectedFacturaId"
          [programacionId]="selectedProgramacion?.id"
          [isViewOnly]="isViewOnly"
          (onClose)="handleCreateClose($event)"
        ></app-create-factura-modal>

        <app-recurrente-history-modal
          *ngIf="showHistoryModal && selectedProgramacion"
          [programacionId]="selectedProgramacion.id"
          [programacionNombre]="selectedProgramacion.cliente_nombre || ''"
          (onClose)="showHistoryModal = false"
        ></app-recurrente-history-modal>

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
    </div>
  `,
  styles: [`
    .recurrente-page-container { min-height: 100vh; background: #f8fafc; }
    .page-title { font-size: 1.75rem; font-weight: 900; color: #161d35; margin-bottom: 0.25rem; }
    .page-subtitle { color: #94a3b8; font-size: 0.95rem; font-weight: 500; }

    .btn-refresh-premium {
      background: white; border: 1px solid #e2e8f0;
      width: 44px; height: 44px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.2s;
    }
    .btn-refresh-premium:hover { background: #f1f5f9; color: #161d35; border-color: #cbd5e1; }
    .spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .btn-create-premium {
      background: #161d35; color: white; border: none;
      padding: 0 1.5rem; height: 44px; border-radius: 14px;
      font-weight: 700; display: flex; align-items: center;
      transition: all 0.2s;
    }
    .btn-create-premium:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

    .btn-bulk-premium {
      background: #f1f5f9; color: #161d35; border: 1.5px solid #161d35;
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
      height: 100%; width: 40%; background: #161d35;
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
    .form-control-premium:focus { border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none; }

    .spinner-premium {
      width: 40px; height: 40px; border: 4px solid #f3f3f3;
      border-top: 4px solid #161d35; border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `]
})
export class FacturacionRecurrentePage implements OnInit, OnDestroy {
  programaciones: FacturaProgramada[] = [];
  filteredProgramaciones: FacturaProgramada[] = [];
  
  stats = { activeCount: 0, successCount: 0, failedCount: 0 };
  private _searchQuery: string = '';
  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.applyFilters();
  }

  isLoading: boolean = true;
  isLoadingEdit: boolean = false;
  isRefreshing: boolean = false;
  isProcessing: boolean = false;
  
  showCreateModal: boolean = false;
  isViewOnly: boolean = false; // Nueva bandera
  showHistoryModal: boolean = false;
  showConfirmModal: boolean = false;
  showBulkConfirmModal: boolean = false;
  showToggleConfirmModal: boolean = false;
  selectedProgramacion: FacturaProgramada | null = null;
  selectedFacturaId: string | undefined = undefined;

  private subscription: Subscription = new Subscription();

  constructor(
    private service: FacturacionProgramadaService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Facturación Recurrente', 'Automatización de emisiones periódicas');
    
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

  applyFilters() {
    const query = this._searchQuery.toLowerCase().trim();
    this.filteredProgramaciones = this.programaciones.filter(p => 
      (p.cliente_nombre?.toLowerCase() || '').includes(query) || 
      p.concepto.toLowerCase().includes(query)
    );
  }

  openCreateModal() {
    this.selectedProgramacion = null;
    this.isViewOnly = false;
    this.showCreateModal = true;
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
    
    if (event.type === 'view' || event.type === 'edit') {
      this.isViewOnly = event.type === 'view';
      // Abrir modal inmediatamente — mostrará su spinner mientras resolvemos la plantilla
      this.selectedFacturaId = undefined;
      this.showCreateModal = true;
      this.isLoadingEdit = true;
      // Resolver el ID de la plantilla en paralelo y pasárselo al modal cuando llegue
      this.service.obtenerIdPlantilla(event.data.id).subscribe({
        next: (res: any) => {
          this.isLoadingEdit = false;
          const facturaId = typeof res === 'string' ? res : (res?.data ?? null);
          if (!facturaId) {
            this.showCreateModal = false;
            this.uiService.showToast('No se encontró la factura plantilla para esta programación', 'warning');
            return;
          }
          this.selectedFacturaId = facturaId;
        },
        error: (err) => {
          this.isLoadingEdit = false;
          this.showCreateModal = false;
          this.uiService.showError(err, 'Error al obtener factura plantilla');
        }
      });
    } else if (event.type === 'history') {
      this.showHistoryModal = true;
    } else if (event.type === 'delete') {
      this.showConfirmModal = true;
    } else if (event.type === 'toggle') {
      this.showToggleConfirmModal = true;
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
}

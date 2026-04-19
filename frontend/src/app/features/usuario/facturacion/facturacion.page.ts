import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { FacturaStatsComponent } from './components/factura-stats/factura-stats.component';
import { FacturaActionsComponent } from './components/factura-actions/factura-actions.component';
import { FacturaTableComponent } from './components/factura-table/factura-table.component';
import { CreateFacturaModalComponent } from './components/create-factura-modal/create-factura-modal.component';
import { ViewFacturaModalComponent } from './components/view-factura-modal/view-factura-modal.component';
import { EmailFacturaModalComponent } from './components/email-factura-modal/email-factura-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PagosFacturaModalComponent } from './components/pagos-factura-modal/pagos-factura-modal.component';
import { AnularFacturaModalComponent } from './components/anular-factura-modal/anular-factura-modal.component';

import { FacturasService } from './services/facturas.service';
import { UiService } from '../../../shared/services/ui.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { Factura, FacturaListadoFiltros } from '../../../domain/models/factura.model';
import { FACTURAS_PERMISSIONS } from '../../../constants/permission-codes';
import { PaginationState } from './components/factura-paginacion/factura-paginacion.component';

import { SriConfigService } from '../certificado-sri/services/sri-config.service';

@Component({
  selector: 'app-usuario-facturacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaStatsComponent,
    FacturaActionsComponent,
    FacturaTableComponent,
    CreateFacturaModalComponent,
    ViewFacturaModalComponent,
    EmailFacturaModalComponent,
    PagosFacturaModalComponent,
    AnularFacturaModalComponent,
    ToastComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="facturas-page-container">
      <ng-container *ngIf="canView; else noPermission">
        <div class="container-fluid p-0 d-flex flex-column flex-grow-1 overflow-hidden">

          <!-- BLOQUEO SRI -->
          <ng-container *ngIf="sriError; else contenidoFacturacion">
            <div class="sri-block-container">
              <div class="sri-block-card">
                <div class="sri-block-icon">
                  <i class="bi bi-shield-exclamation"></i>
                </div>
                <h2 class="sri-block-title">Firma Electrónica Requerida</h2>
                <p class="sri-block-message">{{ sriError }}</p>
                <p class="sri-block-hint">Para emitir comprobantes electrónicos autorizados por el SRI, primero debes configurar y activar tu certificado de firma electrónica.</p>
                <button *ngIf="canConfigSri" class="sri-block-btn" (click)="irACertificadoSri()">
                  <i class="bi bi-gear-fill me-2"></i>
                  Configurar Certificado SRI
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #contenidoFacturacion>
            <!-- STATS -->
            <app-factura-stats
              [totalCount]="stats.totalCount"
              [totalAmount]="stats.totalAmount"
              [pendingAmount]="stats.pendingAmount"
            ></app-factura-stats>

            <!-- ACTIONS -->
            <app-factura-actions
              [(searchQuery)]="searchQuery"
              (searchQueryChange)="applyFilters()"
              [sriError]="sriError"
              (onFilterChangeEmit)="handleFilters($event)"
              (onCreate)="openCreateModal()"
            ></app-factura-actions>

            <!-- TABLE -->
            <app-factura-table
              [facturas]="paginatedFacturas"
              [pagination]="pagination"
              [processingStates]="processingStates"
              (onAction)="handleAction($event)"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-factura-table>
          </ng-template>

           <!-- MODALS -->
           <app-create-factura-modal
              *ngIf="showCreateModal"
              [facturaId]="selectedFactura?.id"
              (onClose)="closeCreateModal($event)"
           ></app-create-factura-modal>

           <app-confirm-modal
              *ngIf="showConfirmModal"
              [title]="confirmModalConfig.title"
              [message]="confirmModalConfig.message"
              [confirmText]="confirmModalConfig.confirmText"
              [type]="confirmModalConfig.type"
              [icon]="confirmModalConfig.icon"
              [loading]="isProcessing"
              (onConfirm)="handleModalConfirm()"
              (onCancel)="showConfirmModal = false"
           ></app-confirm-modal>

           <app-view-factura-modal
              *ngIf="showViewModal && selectedFactura"
              [facturaId]="selectedFactura.id"
              (onClose)="closeViewModal()"
           ></app-view-factura-modal>

           <app-email-factura-modal
              *ngIf="showEmailModal && selectedFactura"
              [factura]="selectedFactura"
              (close)="closeEmailModal($event)"
           ></app-email-factura-modal>

           <app-pagos-factura-modal
              *ngIf="showPagosModal && selectedFactura"
              [factura]="selectedFactura"
              (close)="closePagosModal($event)"
           ></app-pagos-factura-modal>

           <app-anular-factura-modal
              *ngIf="showAnularModal && selectedFactura"
              [factura]="selectedFactura"
              (close)="onAnularModalClose($event)"
           ></app-anular-factura-modal>

           <app-toast></app-toast>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center h-100 text-center p-5 animate-fade-in">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 max-w-400">
            No tienes permisos suficientes para gestionar la facturación de esta empresa.
            Si crees que esto es un error, contacta a su administrador.
          </p>
          <button class="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm" (click)="refreshData()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

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
    .facturas-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: transparent;
      overflow: hidden;
      min-height: 0;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: black;
      margin-bottom: 0.25rem;
    }
    .page-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .btn-refresh-premium {
      background: white;
      border: 1px solid #e2e8f0;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }
    .btn-refresh-premium:hover {
      background: #f8fafc;
      color: black;
      border-color: #cbd5e1;
    }
    .spinning i {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .no-permission-container { min-height: 70vh; }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .max-w-400 { max-width: 400px; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .sri-block-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 2rem;
    }
    .sri-block-card {
      background: white;
      border-radius: 24px;
      padding: 3rem 2.5rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
      border: 1px solid #e2e8f0;
      animation: fadeIn 0.4s ease-out;
    }
    .sri-block-icon {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: #d97706;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 25px rgba(217, 119, 6, 0.2);
    }
    .sri-block-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: black;
      margin-bottom: 0.75rem;
    }
    .sri-block-message {
      font-size: 0.95rem;
      font-weight: 600;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
    .sri-block-hint {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .sri-block-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.9rem 2rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
    }
    .sri-block-btn:hover {
      background: #232d4b;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(22, 29, 53, 0.25);
    }
  `]
})
export class FacturacionPage implements OnInit {

  // Helper centralizado para verificar permisos combinando granulares con el bypass del Admin de Empresa
  private checkAccess(permissionCode: string): boolean {
    return this.permissionsService.isAdminEmpresa || this.permissionsService.hasPermission(permissionCode);
  }

  get canView(): boolean {
    return this.checkAccess(FACTURAS_PERMISSIONS.VER_TODAS) ||
           this.checkAccess(FACTURAS_PERMISSIONS.VER_PROPIAS);
  }

  facturas: Factura[] = [];
  filteredFacturas: Factura[] = [];

  stats = {
    totalCount: 0,
    totalAmount: 0,
    pendingAmount: 0
  };

  searchQuery: string = '';
  filters = { estado: 'ALL', estado_pago: 'ALL' };

  pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };

  selectedFactura: Factura | null = null;
  isLoading: boolean = false;
  isProcessing: boolean = false; // Para modales de confirmación (uso único)
  
  // Mapa para tracking de estados SRI independientes por factura
  processingStates: Map<string, 'consultar' | 'emitir'> = new Map();

  // MOdal Config
  showConfirmModal: boolean = false;
  confirmModalConfig = {
    title: '',
    message: '',
    confirmText: '',
    type: 'danger' as 'danger' | 'primary',
    icon: '',
    action: '' as 'delete' | 'sri'
  };

  showCreateModal: boolean = false;
  showViewModal: boolean = false;
  showEmailModal: boolean = false;
  showPagosModal: boolean = false;
  showAnularModal: boolean = false;

  // SRI Status
  sriError: string | null = null;

  constructor(
    private facturasService: FacturasService,
    private uiService: UiService,
    private permissionsService: PermissionsService,
    private sriConfigService: SriConfigService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) { }

  irACertificadoSri() {
    this.router.navigate(['/usuario/certificado-sri']);
  }

  ngOnInit() {
    this.uiService.setPageHeader('Facturación Electrónica', 'Emite y gestiona tus comprobantes autorizados por el SRI');
    this.checkSriStatus();
    this.loadData();
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

        const now = new Date();
        const expiration = new Date(config.fecha_expiracion_cert);

        if (expiration < now) {
          const fechaStr = expiration.toLocaleDateString();
          this.sriError = `La firma electrónica caducó el ${fechaStr}. Renueve su certificado.`;
          return;
        }

        this.sriError = null;
      },
      error: (err) => {
        console.error("Error checking SRI status", err);
      }
    });
  }

  loadData() {
    // Permission Check Logic for Listing
    const canViewAll = this.checkAccess('FACTURAS_VER_TODAS');
    const canViewOwn = this.checkAccess('FACTURAS_VER_PROPIAS');

    if (!canViewAll && !canViewOwn) {
      this.uiService.showToast('No tienes permisos para ver facturas', 'warning');
      return;
    }

    const params: Partial<FacturaListadoFiltros> = {};
    if (!canViewAll && canViewOwn) {
      params.solo_propias = true;
    }

    this.isLoading = true;
    this.facturasService.listarFacturas(params).subscribe({
      next: (data) => {
        console.log('DEBUG [Facturas]:', data);
        this.facturas = data;
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.uiService.showError(err, 'Error al cargar facturas');
        this.isLoading = false;
      }
    });
  }

  calculateStats() {
    this.stats.totalCount = this.facturas.length;
    this.stats.totalAmount = this.facturas
      .filter(f => f.estado === 'AUTORIZADA')
      .reduce((acc, curr) => acc + (parseFloat(curr.total as any) || 0), 0);

    // Sumamos el saldo_pendiente real del backend para el KPI de Pendientes
    this.stats.pendingAmount = this.facturas
      .filter(f => f.estado === 'AUTORIZADA' && f.estado_pago !== 'PAGADO')
      .reduce((acc, curr) => acc + (parseFloat(curr.saldo_pendiente as any) || 0), 0);
    
    console.log('STATS [Calculated]:', this.stats);
  }

  applyFilters() {
    this.filteredFacturas = this.facturas.filter(f => {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return true;

      const clientName = f.snapshot_cliente?.razon_social?.toLowerCase() || '';
      const clientIdent = f.snapshot_cliente?.identificacion || '';
      const numFactura = f.numero_factura?.toLowerCase() || '';
      const idStr = f.id?.toLowerCase() || '';

      const matchSearch = 
        clientName.includes(query) ||
        clientIdent.includes(query) ||
        numFactura.includes(query) ||
        idStr.includes(query);

      const matchEstado = this.filters.estado === 'ALL' || f.estado === this.filters.estado;
      const matchPago = this.filters.estado_pago === 'ALL' || f.estado_pago === this.filters.estado_pago;

      return matchSearch && matchEstado && matchPago;
    });
    
    this.pagination.totalItems = this.filteredFacturas.length;
    this.cd.detectChanges();
  }

  get paginatedFacturas(): Factura[] {
    const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    return this.filteredFacturas.slice(inicio, inicio + this.pagination.pageSize);
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.cd.detectChanges();
  }

  onPageSizeChange(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.cd.detectChanges();
  }

  handleFilters(filters: any) {
    this.filters = filters;
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  openCreateModal() {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.CREAR)) {
      this.uiService.showToast('No tienes permiso para crear facturas', 'warning');
      return;
    }

    if (this.sriError) {
      this.uiService.showToast(this.sriError, 'warning');
      return;
    }
    this.selectedFactura = null; // Clear selected factura for new creations
    this.showCreateModal = true;
  }

  closeCreateModal(saved: boolean) {
    this.showCreateModal = false;
    if (saved) {
      this.loadData();
    }
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedFactura = null;
  }

  closePagosModal(hasChanges: boolean) {
    this.showPagosModal = false;
    this.selectedFactura = null;
    if (hasChanges) {
      this.loadData();
    }
  }

  onAnularModalClose(success: boolean) {
    this.showAnularModal = false;
    this.selectedFactura = null;
    if (success) {
      this.loadData();
      // El toast ya lo muestra el modal, pero podemos forzar un refresh de las estadísticas
      this.calculateStats();
    }
  }

  handleAction(event: { type: string, factura: Factura }) {
    this.selectedFactura = event.factura;

    switch (event.type) {
      case 'edit':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.EDITAR)) {
           this.uiService.showToast('No tienes permiso para editar', 'danger'); return;
        }
        if (this.sriError) {
          this.uiService.showToast('No se puede editar: ' + this.sriError, 'warning');
          return;
        }
        this.showCreateModal = true;
        break;
      case 'delete':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.EDITAR)) { // Eliminar borrador usa el permiso de editar
           this.uiService.showToast('No tienes permiso para eliminar', 'danger'); return;
        }
        this.confirmModalConfig = {
          title: '¿Eliminar Factura?',
          message: '¿Estás seguro de que deseas eliminar la factura ' + (this.selectedFactura?.numero_factura || 'BORRADOR') + '?',
          confirmText: 'Eliminar',
          type: 'danger',
          icon: 'bi-trash3-fill',
          action: 'delete'
        };
        this.showConfirmModal = true;
        break;
      case 'view':
        this.showViewModal = true;
        break;
      case 'sri':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_SRI)) {
           this.uiService.showToast('No tienes permiso para interactuar con el SRI', 'danger'); return;
        }
        if (this.sriError) {
          this.uiService.showToast('No se puede enviar: ' + this.sriError, 'warning');
          return;
        }
        this.confirmModalConfig = {
          title: 'Confirmar Envío SRI',
          message: '¿Está seguro de enviar la factura ' + this.selectedFactura?.numero_factura + ' al SRI? Esta acción no se puede deshacer.',
          confirmText: 'Enviar y Autorizar',
          type: 'primary',
          icon: 'bi-cloud-upload-fill',
          action: 'sri'
        };
        this.showConfirmModal = true;
        break;
      case 'pdf':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.DESCARGAR_PDF)) {
           this.uiService.showToast('No tienes permiso para descargar PDFs', 'danger'); return;
        }
        this.descargarPdf(event.factura.id);
        break;
      case 'email':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_EMAIL)) {
           this.uiService.showToast('No tienes permiso para enviar emails', 'danger'); return;
        }
        this.showEmailModal = true;
        break;
      case 'anular':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.ANULAR)) {
           this.uiService.showToast('No tienes permiso para anular facturas', 'danger'); return;
        }
        if (this.sriError) {
          this.uiService.showToast('No se puede anular: ' + this.sriError, 'warning');
          return;
        }
        this.showAnularModal = true;
        break;
      case 'consultar':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_SRI)) {
           this.uiService.showToast('No tienes permiso para interactuar con el SRI', 'danger'); return;
        }
        this.selectedFactura = event.factura;
        this.consultarSri();
        break;
      case 'abono':
        if (!this.checkAccess(FACTURAS_PERMISSIONS.PAGO_CREAR)) {
           this.uiService.showToast('No tienes permiso para registrar pagos', 'danger'); return;
        }
        this.showPagosModal = true;
        break;
    }
  }

  handleModalConfirm() {
    if (!this.selectedFactura) return; 
    
    // Evitar re-confirmar si la factura específica ya se está enviando
    if (this.processingStates.has(this.selectedFactura.id)) {
      this.showConfirmModal = false;
      return;
    }

    if (this.confirmModalConfig.action === 'delete') {
      this.deleteFactura();
    } else if (this.confirmModalConfig.action === 'sri') {
      this.enviarSri();
    }
  }

  deleteFactura() {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.EDITAR)) return;
    if (!this.selectedFactura) return;
    this.isProcessing = true;
    this.facturasService.eliminarFactura(this.selectedFactura.id)
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.showConfirmModal = false;
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Factura eliminada', 'success');
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error al eliminar')
      });
  }

  enviarSri() {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_SRI)) return;
    if (!this.selectedFactura) return; 
    
    const id = this.selectedFactura.id;
    
    // Marcar como procesando esta factura específica
    this.processingStates.set(id, 'emitir');
    this.showConfirmModal = false; 

    this.facturasService.enviarSri(id)
      .pipe(finalize(() => {
        this.processingStates.delete(id);
      }))
      .subscribe({
        next: (res: any) => {
          // Actualizar estado localmente según respuesta
          // Mapeo detallado de estados SRI a estados locales
          let estado: any = 'EN_PROCESO';
          if (res.estado === 'AUTORIZADO' || res.estado === 'AUTORIZADA') {
            estado = 'AUTORIZADA';
          } else if (res.estado === 'DEVUELTA' || res.estado === 'DEVUELTO') {
            estado = 'DEVUELTA';
          } else if (res.estado === 'NO AUTORIZADO' || res.estado === 'NO_AUTORIZADO') {
            estado = 'NO_AUTORIZADA';
          } else if (res.estado?.includes('ERROR')) {
            estado = 'ERROR_TECNICO';
          }

          let msgType: 'success' | 'warning' | 'error' = 'success';
          let msgText = 'Factura autorizada correctamente';

          if (estado === 'DEVUELTA') {
            msgType = 'warning';
            msgText = 'Factura devuelta por el SRI (Error en Recepción)';
          } else if (estado === 'NO_AUTORIZADA') {
            msgType = 'error';
            msgText = 'Factura no autorizada legalmente';
          } else if (estado === 'EN_PROCESO') {
            msgType = 'warning';
            msgText = 'Factura todavía en procesamiento por el SRI';
          }

          this.uiService.showToast(msgText, msgType as any);

          // ACTUALIZACION REACTIVA (Inmutabilidad)
          const index = this.facturas.findIndex(f => f.id === id);
          if (index !== -1) {
            // Reemplazamos el objeto completo para asegurar la detección de cambios
            this.facturas[index] = { 
              ...this.facturas[index], 
              estado: estado as any,
              numero_autorizacion: res.numeroAutorizacion || this.facturas[index].numero_autorizacion,
              fecha_autorizacion: res.fechaAutorizacion || this.facturas[index].fecha_autorizacion
            };
            
            // Forzamos el refresco completo del array para triggers reactivos
            this.facturas = [...this.facturas];
            
            this.calculateStats();
            this.applyFilters();
          } else {
            console.warn(`[REAC] Index not found for ID: ${id}. Standard reload triggered.`);
            this.loadData();
          }
          
          // RECARGA DE SEGURIDAD: Invocamos loadData de todas formas para asegurar sincronización con el servidor
          console.log(`[SYNC] Action complete for ID: ${id}. Refreshing full list for safety.`);
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error envío SRI')
      });
  }

  anularFactura(id: string, razon: string) {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.ANULAR)) {
       this.uiService.showToast('Acceso Denegado: Permiso ANULAR requerido', 'danger');
       return;
    }
    this.isLoading = true;
    this.facturasService.anularFactura(id, razon)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Factura anulada', 'success');
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error al anular')
      });
  }

  consultarSri(facturaId?: string) {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_SRI)) return;
    const id = facturaId || this.selectedFactura?.id;
    if (!id || this.processingStates.has(id)) return;

    this.processingStates.set(id, 'consultar');
    this.facturasService.consultarEstadoSri(id)
      .pipe(finalize(() => {
        this.processingStates.delete(id);
      }))
      .subscribe({
        next: (res: any) => {
          // Re-mapear estado similar a enviarSri
          let estadoMapping: any = (res.estado === 'AUTORIZADO' || res.estado === 'AUTORIZADA') ? 'AUTORIZADA' :
            (res.estado === 'DEVUELTA' || res.estado === 'DEVUELTO') ? 'DEVUELTA' :
              (res.estado === 'NO AUTORIZADO' || res.estado === 'NO_AUTORIZADO') ? 'NO_AUTORIZADA' : 'EN_PROCESO';

          let msgText = 'Estamos consultando el estado con el SRI...';
          if (res.estado === 'NO_ENCONTRADO' || res.estado === 'EN PROCESO') {
             msgText = 'Tu factura todavía se está procesando en el SRI. Por favor, espera un par de minutos antes de volver a consultar.';
          } else if (res.estado === 'AUTORIZADO' || res.estado === 'AUTORIZADA') {
             msgText = '¡Excelente! Tu factura ya ha sido autorizada correctamente.';
          } else if (res.estado === 'DEVUELTA' || res.estado === 'DEVUELTO') {
             msgText = 'La factura ha sido devuelta con observaciones. Por favor, revisa los detalles.';
          }

          this.uiService.showToast(msgText, estadoMapping === 'AUTORIZADA' ? 'success' : 'warning');
          
          // ACTUALIZACION REACTIVA (En lugar de loadData completo)
          const index = this.facturas.findIndex(f => f.id === id);
          if (index !== -1) {
            this.facturas[index] = { 
              ...this.facturas[index], 
              estado: estadoMapping,
              numero_autorizacion: res.numeroAutorizacion || this.facturas[index].numero_autorizacion,
              fecha_autorizacion: res.fechaAutorizacion || this.facturas[index].fecha_autorizacion
            };
            
            // Reemplazo del array para asegurar triggering
            this.facturas = [...this.facturas];
            
            this.calculateStats();
            this.applyFilters();
          } else {
            console.warn(`[REAC] Index not found for ID: ${id}. Standard reload triggered.`);
            this.loadData();
          }

          // RECARGA DE SEGURIDAD
          console.log(`[SYNC] Consultation complete for ID: ${id}. Refreshing full list.`);
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error al consultar SRI')
      });
  }


  descargarPdf(id: string) {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.DESCARGAR_PDF)) {
       this.uiService.showToast('No tienes permiso para descargar', 'danger');
       return;
    }
    this.uiService.showToast('Preparando documento PDF, por favor espere...', 'info', 'Esto puede tomar unos segundos.', 4000);
    this.facturasService.descargarPdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${this.selectedFactura?.numero_factura || 'doc'}.pdf`;
        a.click();
      },
      error: (err) => {
        this.uiService.showError(err, 'Error al generar o descargar el PDF');
      }
    });
  }

  closeEmailModal(email: string | null) {
    this.showEmailModal = false;
    if (email) {
      this.enviarEmail(this.selectedFactura!.id, email);
    }
  }

  enviarEmail(id: string, email?: string) {
    if (!this.checkAccess(FACTURAS_PERMISSIONS.ENVIAR_EMAIL)) {
       this.uiService.showToast('No tienes permiso para enviar email', 'danger');
       return;
    }
    this.facturasService.enviarEmail(id, email).subscribe({
      next: () => this.uiService.showToast('Correo enviado (No implementado)', 'success'),
      error: (err) => this.uiService.showError(err, 'Error enviando correo')
    });
  }

  refreshData() {
    this.isLoading = true;
    this.loadData();
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 800);
  }
}



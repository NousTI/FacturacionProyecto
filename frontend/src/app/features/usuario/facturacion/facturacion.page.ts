import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { FacturasService } from './services/facturas.service';
import { UiService } from '../../../shared/services/ui.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { Factura, FacturaListadoFiltros } from '../../../domain/models/factura.model';

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
    ToastComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="facturas-page-container">
      <div class="container-fluid p-0">

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
          [facturas]="filteredFacturas"
          (onAction)="handleAction($event)"
        ></app-factura-table>

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
        
         <app-toast></app-toast>
      </div>
    </div>
  `,
  styles: [`
    .facturas-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: #161d35;
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
      color: #161d35;
      border-color: #cbd5e1;
    }
    .spinning i {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class FacturacionPage implements OnInit {
  facturas: Factura[] = [];
  filteredFacturas: Factura[] = [];

  stats = {
    totalCount: 0,
    totalAmount: 0,
    pendingAmount: 0
  };

  searchQuery: string = '';
  filters = { estado: 'ALL', estado_pago: 'ALL' };

  selectedFactura: Factura | null = null;
  isLoading: boolean = false;
  isProcessing: boolean = false; // Used for spinners

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

  // SRI Status
  sriError: string | null = null;

  constructor(
    private facturasService: FacturasService,
    private uiService: UiService,
    private permissionsService: PermissionsService,
    private sriConfigService: SriConfigService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.uiService.setPageHeader('Facturación Electrónica', 'Emite y gestiona tus comprobantes autorizados por el SRI');
    this.checkSriStatus();
    this.loadData();
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
    const canViewAll = this.permissionsService.hasPermission('FACTURAS_VER_TODAS');
    const canViewOwn = this.permissionsService.hasPermission('FACTURAS_VER_PROPIAS');

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
        // Correct status mapping in case data logic differs
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

    this.stats.pendingAmount = this.facturas
      .filter(f => f.estado === 'AUTORIZADA' && f.estado_pago !== 'PAGADO')
      .reduce((acc, curr) => acc + (parseFloat(curr.total as any) || 0), 0);
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
    this.cd.detectChanges();
  }

  handleFilters(filters: any) {
    this.filters = filters;
    this.applyFilters();
  }

  openCreateModal() {
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

  handleAction(event: { type: string, factura: Factura }) {
    this.selectedFactura = event.factura;

    switch (event.type) {
      case 'edit':
        if (this.sriError) {
          this.uiService.showToast('No se puede editar: ' + this.sriError, 'warning');
          return;
        }
        this.showCreateModal = true;
        break;
      case 'delete':
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
        this.descargarPdf(event.factura.id);
        break;
      case 'email':
        this.showEmailModal = true;
        break;
      case 'anular':
        if (this.sriError) {
          this.uiService.showToast('No se puede anular: ' + this.sriError, 'warning');
          return;
        }
        const razon = prompt("Razón de anulación:");
        if (razon) this.anularFactura(event.factura.id, razon);
        break;
      case 'consultar':
        this.selectedFactura = event.factura;
        this.consultarSri();
        break;
      case 'toggle-pago':
        this.toggleEstadoPago(event.factura);
        break;
      case 'abono':
        this.showPagosModal = true;
        break;
    }
  }

  handleModalConfirm() {
    if (!this.selectedFactura || this.isProcessing) return; // Prevent double clicks

    if (this.confirmModalConfig.action === 'delete') {
      this.deleteFactura();
    } else if (this.confirmModalConfig.action === 'sri') {
      this.enviarSri();
    }
  }

  deleteFactura() {
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
    if (!this.selectedFactura || this.isProcessing) return; // Double protection
    this.isProcessing = true;

    this.facturasService.enviarSri(this.selectedFactura.id)
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.showConfirmModal = false;
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

          // Actualizar en lista sin recargar todo si es posible
          const index = this.facturas.findIndex(f => f.id === this.selectedFactura?.id);
          if (index !== -1) {
            this.facturas[index].estado = estado as any; // Cast to any or strict type
            // Si fue autorizada, actualizar fecha y autorización
            if (estado === 'AUTORIZADA') {
              this.facturas[index].numero_autorizacion = res.numeroAutorizacion;
              this.facturas[index].fecha_autorizacion = res.fechaAutorizacion;
            }
            this.calculateStats();
            this.applyFilters();
          } else {
            this.loadData(); // Fallback
          }
        },
        error: (err) => this.uiService.showError(err, 'Error envío SRI')
      });
  }

  anularFactura(id: string, razon: string) {
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
    const id = facturaId || this.selectedFactura?.id;
    if (!id || this.isProcessing) return;

    this.isProcessing = true;
    this.facturasService.consultarEstadoSri(id)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: (res: any) => {
          // Re-mapear estado similar a enviarSri
          let estado: any = (res.estado === 'AUTORIZADO' || res.estado === 'AUTORIZADA') ? 'AUTORIZADA' :
            (res.estado === 'DEVUELTA' || res.estado === 'DEVUELTO') ? 'DEVUELTA' :
              (res.estado === 'NO AUTORIZADO' || res.estado === 'NO_AUTORIZADO') ? 'NO_AUTORIZADA' : 'EN_PROCESO';

          this.uiService.showToast(`Estado SRI: ${res.estado}`, estado === 'AUTORIZADA' ? 'success' : 'warning');
          this.loadData(); // Recargar para ver cambios
        },
        error: (err) => this.uiService.showError(err, 'Error al consultar SRI')
      });
  }


  descargarPdf(id: string) {
    this.facturasService.descargarPdf(id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${this.selectedFactura?.numero_factura || 'doc'}.pdf`;
      a.click();
    });
  }

  closeEmailModal(email: string | null) {
    this.showEmailModal = false;
    if (email) {
      this.enviarEmail(this.selectedFactura!.id, email);
    }
  }

  enviarEmail(id: string, email?: string) {
    this.facturasService.enviarEmail(id, email).subscribe({
      next: () => this.uiService.showToast('Correo enviado', 'success'),
      error: (err) => this.uiService.showError(err, 'Error enviando correo')
    });
  }

  toggleEstadoPago(factura: Factura) {
    const nuevoEstado = factura.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    this.isLoading = true;
    
    this.facturasService.actualizarEstadoPago(factura.id, nuevoEstado)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (facturaActualizada) => {
          this.uiService.showToast(`Estado cambiado a ${nuevoEstado}`, 'success');
          // Actualizar localmente
          const index = this.facturas.findIndex(f => f.id === factura.id);
          if (index !== -1) {
            this.facturas[index].estado_pago = facturaActualizada.estado_pago;
            this.calculateStats();
            this.applyFilters();
          }
        },
        error: (err) => this.uiService.showError(err, 'No se pudo cambiar el estado de pago')
      });
  }
}

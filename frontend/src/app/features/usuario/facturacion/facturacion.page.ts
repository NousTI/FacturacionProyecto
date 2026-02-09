import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { FacturaStatsComponent } from './components/factura-stats/factura-stats.component';
import { FacturaActionsComponent } from './components/factura-actions/factura-actions.component';
import { FacturaTableComponent } from './components/factura-table/factura-table.component';
import { CreateFacturaModalComponent } from './components/create-factura-modal/create-factura-modal.component';
import { ViewFacturaModalComponent } from './components/view-factura-modal/view-factura-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

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
    ToastComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="facturas-page-container">
      <div class="container-fluid px-4 py-4">

        <!-- STATS -->
        <app-factura-stats
          [totalCount]="stats.totalCount"
          [totalAmount]="stats.totalAmount"
          [pendingAmount]="stats.pendingAmount"
        ></app-factura-stats>

        <!-- ACTIONS -->
        <app-factura-actions
          [(searchQuery)]="searchQuery"
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
            (onClose)="closeCreateModal($event)"
         ></app-create-factura-modal>

         <app-confirm-modal
            *ngIf="showConfirmModal"
            title="¿Eliminar Factura?"
            [message]="'¿Estás seguro de que deseas eliminar la factura ' + (selectedFactura?.numero_factura || 'BORRADOR') + '?'"
            confirmText="Eliminar"
            type="danger"
            icon="bi-trash3-fill"
            [loading]="isProcessing"
            (onConfirm)="confirmDelete()"
            (onCancel)="showConfirmModal = false"
         ></app-confirm-modal>

         <app-view-factura-modal
            *ngIf="showViewModal && selectedFactura"
            [facturaId]="selectedFactura.id"
            (onClose)="closeViewModal()"
         ></app-view-factura-modal>
        
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
  isProcessing: boolean = false;

  showConfirmModal: boolean = false;
  showCreateModal: boolean = false;
  showViewModal: boolean = false;

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
      .filter(f => f.estado === 'EMITIDA')
      .reduce((acc, curr) => acc + (curr.total || 0), 0);

    this.stats.pendingAmount = this.facturas
      .filter(f => f.estado === 'EMITIDA' && f.estado_pago !== 'PAGADO')
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
  }

  applyFilters() {
    this.filteredFacturas = this.facturas.filter(f => {
      const query = this.searchQuery.toLowerCase();
      const clientName = f.snapshot_cliente?.razon_social?.toLowerCase() || '';
      const clientIdent = f.snapshot_cliente?.identificacion || '';
      const numFactura = f.numero_factura?.toLowerCase() || '';

      const matchSearch = !query ||
        clientName.includes(query) ||
        clientIdent.includes(query) ||
        numFactura.includes(query);

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

  handleAction(event: { type: string, factura: Factura }) {
    this.selectedFactura = event.factura;

    switch (event.type) {
      case 'edit':
        if (this.sriError) {
          this.uiService.showToast('No se puede editar: ' + this.sriError, 'warning');
          return;
        }
        this.openCreateModal();
        break;
      case 'delete':
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
        this.enviarSri(event.factura.id);
        break;
      case 'pdf':
        this.descargarPdf(event.factura.id);
        break;
      case 'email':
        this.enviarEmail(event.factura.id);
        break;
      case 'anular':
        if (this.sriError) {
          this.uiService.showToast('No se puede anular: ' + this.sriError, 'warning');
          return;
        }
        const razon = prompt("Razón de anulación:");
        if (razon) this.anularFactura(event.factura.id, razon);
        break;
    }
  }

  confirmDelete() {
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

  enviarSri(id: string) {
    if (!confirm("¿CONFIRMAR ENVIO AL SRI?")) return;
    this.isLoading = true;
    this.facturasService.enviarSri(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Factura enviada al SRI', 'success');
          this.loadData();
        },
        error: (err) => this.uiService.showError(err, 'Error envío SRI')
      });
  }

  descargarPdf(id: string) {
    this.facturasService.descargarPdf(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${this.selectedFactura?.numero_factura || 'doc'}.pdf`;
      a.click();
    });
  }

  enviarEmail(id: string) {
    const email = prompt("Ingrese email (dejar vacio para usar email del cliente):");
    if (email === null) return;
    this.facturasService.enviarEmail(id, email || undefined).subscribe({
      next: () => this.uiService.showToast('Correo enviado', 'success'),
      error: (err) => this.uiService.showError(err, 'Error enviando correo')
    });
  }
}

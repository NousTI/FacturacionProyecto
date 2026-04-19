import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewFacturaModalComponent } from '../../../facturacion/components/view-factura-modal/view-factura-modal.component';
import { FacturacionProgramadaService } from '../../services/facturacion-programada.service';
import { HistorialProgramacion } from '../../../../../domain/models/facturacion-programada.model';
import { finalize, timeout, catchError, of } from 'rxjs';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-recurrente-history-modal',
  standalone: true,
  imports: [CommonModule, ViewFacturaModalComponent, HasPermissionDirective],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn">
      <div class="modal-container animate__animated animate__zoomIn">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle bg-premium">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="header-text">
              <h3>Historial de Emisiones</h3>
              <p>Programación: {{ programacionNombre }}</p>
            </div>
          </div>
          <button class="btn-close-modal" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body custom-scrollbar">
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="premium-spinner"></div>
            <p class="mt-3 text-muted">Cargando historial...</p>
          </div>

          <div *ngIf="!isLoading && historial.length === 0" class="text-center py-5">
            <i class="bi bi-info-circle text-muted fs-1 mb-3"></i>
            <h5>Sin emisiones todavía</h5>
            <p class="text-muted">No se han encontrado facturas generadas por esta programación.</p>
          </div>

          <table *ngIf="!isLoading && historial.length > 0" class="table custom-table-mini">
            <thead>
              <tr>
                <th>Fecha Intento</th>
                <th>Número Factura</th>
                <th>Estado</th>
                <th class="text-end">Detalle técnico / Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of historial">
                <td>
                  <div class="fw-bold">{{ item.fecha | date:'dd/MM/yyyy' }}</div>
                  <div class="text-muted small">{{ item.fecha | date:'HH:mm' }}</div>
                </td>
                <td>
                  <span 
                    *ngIf="item.numero_factura" 
                    class="badge bg-light text-dark border"
                    [class.cursor-pointer]="item.factura_id"
                    [class.hover-shadow]="item.factura_id"
                    (click)="item.factura_id ? verDetalleFactura(item.factura_id) : null"
                    [title]="item.factura_id ? 'Ver detalles de la factura' : ''"
                  >
                    <i class="bi bi-eye me-1 text-primary" *ngIf="item.factura_id"></i>
                    {{ item.numero_factura }}
                  </span>
                  <span *ngIf="!item.numero_factura" class="text-muted small">N/A</span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getEstadoClass(item.estado)">
                    {{ item.estado }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="d-flex flex-column align-items-end">
                    <div class="text-dark small fw-500">{{ item.detalle }}</div>
                    
                    <div class="d-flex gap-2 mt-2">
                      <ng-container *ngIf="item.factura_id">
                        <button
                          *hasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS']"
                          class="btn btn-sm btn-outline-primary py-0 px-2 smallest"
                          (click)="verDetalleFactura(item.factura_id)"
                          title="Ver factura"
                        >
                          <i class="bi bi-eye-fill"></i> Ver
                        </button>
                      </ng-container>

                      <div *ngIf="item.sri_mensajes && item.sri_mensajes.length > 0">
                        <button class="btn btn-link p-0 smallest text-primary" (click)="item.showJson = !item.showJson">
                          {{ item.showJson ? 'Ocultar XML/JSON' : 'Ver respuesta SRI' }}
                        </button>
                      </div>
                    </div>
                    
                    <pre *ngIf="item.showJson" class="json-preview text-start w-100">{{ item.sri_mensajes | json }}</pre>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Paginación -->
          <div *ngIf="!isLoading && (offset > 0 || historial.length === limit)" class="d-flex justify-content-between align-items-center mt-3">
            <button class="btn btn-secondary-premium btn-sm" (click)="prevPage()" [disabled]="offset === 0">
              <i class="bi bi-chevron-left me-1"></i> Anterior
            </button>
            <span class="text-muted small">Registros {{ offset + 1 }} – {{ offset + historial.length }}</span>
            <button class="btn btn-secondary-premium btn-sm" (click)="nextPage()" [disabled]="historial.length < limit">
              Siguiente <i class="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary-premium" (click)="onClose.emit()">Cerrar</button>
        </div>
      </div>

      <!-- Modal de Detalle de Factura -->
      <app-view-factura-modal
        *ngIf="showViewModal && selectedFacturaId"
        [facturaId]="selectedFacturaId"
        (onClose)="showViewModal = false"
      ></app-view-factura-modal>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1100;
      display: flex;
      align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-container {
      background: white;
      width: 100%;
      max-width: 900px;
      max-height: 85vh;
      border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .modal-header {
      padding: 1.75rem 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .header-content { display: flex; align-items: center; gap: 1.25rem; }
    .icon-circle {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; color: white;
    }
    .bg-premium { background: var(--primary-color); }
    .header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .header-text p { margin: 0; font-size: 0.85rem; color: #64748b; }
    .btn-close-modal {
      width: 36px; height: 36px;
      border-radius: 10px;
      border: none; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #64748b;
      transition: all 0.2s;
    }
    .btn-close-modal:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }

    .modal-body { padding: 1.5rem 2rem; overflow-y: auto; }
    .modal-footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end;
      background: #f8fafc;
    }

    .custom-table-mini { width: 100%; }
    .custom-table-mini th {
      font-size: 0.7rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; padding: 1rem 0.5rem;
      border-bottom: 2px solid #f1f5f9;
    }
    .custom-table-mini td { padding: 1.15rem 0.5rem; border-bottom: 1px solid #f8fafc; font-size: 0.9rem; }

    .status-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 800;
      display: inline-block;
    }
    .status-badge.exitoso { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .status-badge.en_proceso { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .status-badge.error_sistema, .status-badge.error_validacion, .status-badge.error_conectividad { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .status-badge.borrador { background: #f1f5f9; color: #64748b; }

    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0;
      color: #64748b; font-weight: 600; padding: 0.6rem 1.5rem;
      border-radius: 12px; transition: all 0.2s;
    }
    .btn-secondary-premium:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

    .premium-spinner {
      width: 40px; height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .json-preview {
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.65rem;
      margin-top: 0.5rem;
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    .cursor-pointer { cursor: pointer; }
    .hover-shadow:hover { 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color) !important;
      background: #f8fafc !important;
    }
  `]
})
export class RecurrenteHistoryModalComponent implements OnInit {
  @Input() programacionId: string = '';
  @Input() programacionNombre: string = '';
  @Output() onClose = new EventEmitter<void>();

  historial: HistorialProgramacion[] = [];
  isLoading: boolean = true;
  readonly limit = 50;
  offset = 0;

  // Estado para el modal de detalle
  showViewModal = false;
  selectedFacturaId: string | null = null;

  constructor(private service: FacturacionProgramadaService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    if (!this.programacionId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.cdr.detectChanges();
    this.service.obtenerHistorial(this.programacionId, this.limit, this.offset).pipe(
      timeout(10000),
      catchError(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log('📋 Historial cargado:', data);
        console.log('🔍 Factura IDs:', data.map((item: any) => ({ numero: item.numero_factura, facturaId: item.factura_id })));
        this.historial = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  prevPage() {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadHistory();
  }

  nextPage() {
    if (this.historial.length < this.limit) return;
    this.offset += this.limit;
    this.loadHistory();
  }

  getEstadoClass(estado: string): string {
    return estado?.toLowerCase().replace(/_/g, '_') ?? '';
  }

  verDetalleFactura(id: string) {
    console.log('👁️ Abriendo detalle de factura:', id);
    this.selectedFacturaId = id;
    this.showViewModal = true;
    this.cdr.detectChanges();
  }
}

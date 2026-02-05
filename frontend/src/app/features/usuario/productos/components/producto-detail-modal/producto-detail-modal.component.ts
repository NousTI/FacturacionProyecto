import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../../domain/models/producto.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';

@Component({
  selector: 'app-producto-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-badge" [style.background]="getAvatarColor(producto.nombre)">
              {{ getInitials(producto.nombre) }}
            </div>
            <div>
              <h2 class="modal-title-final">{{ producto.nombre }}</h2>
              <span class="badge-status" [class.active]="producto.activo">
                {{ producto.activo ? 'Item Activo' : 'Item Inactivo' }}
              </span>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          
          <div class="row g-4">
            <!-- Columna Izquierda: Información Principal -->
            <div class="col-md-7">
              <div class="detail-section">
                <h3 class="section-title"><i class="bi bi-info-circle me-2"></i> Identificación & Tipo</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Código / SKU</span>
                    <span class="info-value highlighted">{{ producto.codigo }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tipo de Item</span>
                    <span class="info-value">{{ producto.tipo }}</span>
                  </div>
                  <div class="info-item col-12" *ngIf="producto.descripcion">
                    <span class="info-label">Descripción</span>
                    <span class="info-value">{{ producto.descripcion }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4">
                <h3 class="section-title"><i class="bi bi-tag me-2"></i> Valores & Impuestos</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Precio de Venta</span>
                    <span class="info-value text-primary fw-bold">{{ producto.precio | currency:'USD' }}</span>
                  </div>
                  <div class="info-item" *ngIf="canViewCosts">
                    <span class="info-label">Costo Real</span>
                    <span class="info-value">{{ (producto.costo | currency:'USD') || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Impuesto (IVA)</span>
                    <span class="info-value">{{ producto.tipo_iva }} ({{ producto.porcentaje_iva }}%)</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Rentabilidad</span>
                    <span class="info-value" [ngClass]="getMargenClass()">{{ calculateMargen() }}% de margen</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Stock y Auditoría -->
            <div class="col-md-5">
              <div class="card-premium-dark p-4" *ngIf="producto.tipo === 'PRODUCTO'">
                <h3 class="section-title text-white mb-4"><i class="bi bi-box-seam me-2"></i> Estado de Inventario</h3>
                <div *ngIf="producto.maneja_inventario; else noInv" class="d-flex flex-column gap-4">
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Stock Disponible</span>
                    <span class="metric-value text-white d-flex align-items-center gap-2">
                       {{ producto.stock_actual }}
                       <small class="fs-6 opacity-50">{{ producto.unidad_medida }}</small>
                    </span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Estado de Alerta</span>
                    <span class="badge-stock" [ngClass]="getStockAlertClass()">
                      {{ getStockStatus() }}
                    </span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Stock Mínimo</span>
                    <span class="metric-value text-white fs-4">{{ producto.stock_minimo }}</span>
                  </div>
                </div>
                <ng-template #noInv>
                   <div class="text-white-50 text-center py-4">
                     <i class="bi bi-slash-circle fs-1 d-block mb-2"></i>
                     Sin control de inventario
                   </div>
                </ng-template>
              </div>

              <div class="audit-section mt-4">
                <h3 class="section-title"><i class="bi bi-clock-history me-2"></i> Auditoría</h3>
                <div class="audit-list">
                  <div class="audit-item">
                    <span class="audit-label">Fecha Creación</span>
                    <span class="audit-value">{{ producto.created_at | date:'medium' }}</span>
                  </div>
                  <div class="audit-item" *ngIf="producto.updated_at">
                    <span class="audit-label">Última Actualización</span>
                    <span class="audit-value">{{ producto.updated_at | date:'medium' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="onClose.emit()" class="btn-primary-final px-5">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 850px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-header-final {
      padding: 2.5rem; display: flex; justify-content: space-between; align-items: flex-start;
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
    }
    .avatar-badge {
      width: 64px; height: 64px; color: white;
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; box-shadow: 0 10px 20px rgba(22, 29, 53, 0.1);
    }
    .modal-title-final {
      font-size: 1.5rem; font-weight: 900; color: #1e293b; margin: 0;
    }
    .badge-status {
      display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; 
      font-weight: 700; margin-top: 6px; background: #f1f5f9; color: #64748b;
    }
    .badge-status.active { background: #dcfce7; color: #166534; }
    
    .btn-close-final {
      background: white; border: 1px solid #e2e8f0; width: 44px; height: 44px;
      border-radius: 14px; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-final:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }

    .modal-body-final {
      padding: 0 2.5rem 2.5rem; overflow-y: auto; flex: 1;
    }

    .section-title {
      font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 1.5rem;
    }

    .info-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
    }
    .info-item {
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    .info-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
    .info-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .info-value.highlighted { color: #161d35; font-size: 1.1rem; }

    .card-premium-dark {
      background: #1e293b; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .metric-item { display: flex; flex-direction: column; }
    .metric-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
    .metric-value { font-size: 1.5rem; font-weight: 800; }

    .badge-stock {
      padding: 6px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; display: inline-block;
    }
    .stock-success { background: #ecfdf5; color: #059669; }
    .stock-warning { background: #fffbeb; color: #d97706; }
    .stock-danger { background: #fef2f2; color: #dc2626; }

    .audit-list { display: flex; flex-direction: column; gap: 1rem; }
    .audit-item { display: flex; justify-content: space-between; align-items: center; 
      padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
    .audit-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .audit-value { font-size: 0.8rem; font-weight: 700; color: #1e293b; }

    .modal-footer-final {
      padding: 1.5rem 2.5rem; background: white; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: center;
    }
    .btn-primary-final {
      background: #161d35; color: white; border: none; padding: 1rem 3rem; 
      border-radius: 16px; font-weight: 800; transition: all 0.2s;
    }
    .btn-primary-final:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

    .margen-success { color: #10b981; }
    .margen-warning { color: #f59e0b; }
    .margen-danger { color: #ef4444; }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class ProductoDetailModalComponent implements OnInit, OnDestroy {
  @Input() producto!: Producto;
  @Output() onClose = new EventEmitter<void>();

  canViewCosts: boolean = false;

  constructor(private permissionsService: PermissionsService) { }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.canViewCosts = this.permissionsService.hasPermission('PRODUCTOS_VER_COSTOS');
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  calculateMargen(): number {
    if (!this.producto.precio || !this.producto.costo) return 0;
    const margen = ((this.producto.precio - this.producto.costo) / this.producto.precio) * 100;
    return Math.round(margen);
  }

  getMargenClass(): string {
    const margen = this.calculateMargen();
    if (margen >= 30) return 'margen-success';
    if (margen > 10) return 'margen-warning';
    return 'margen-danger';
  }

  getStockAlertClass(): string {
    if (this.producto.stock_actual <= 0) return 'stock-danger';
    if (this.producto.stock_actual <= this.producto.stock_minimo) return 'stock-warning';
    return 'stock-success';
  }

  getStockStatus(): string {
    if (this.producto.stock_actual <= 0) return 'CÍTICO: AGOTADO';
    if (this.producto.stock_actual <= this.producto.stock_minimo) return 'ALERTA: STOCK BAJO';
    return 'SALDO ÓPTIMO';
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return '#94a3b8';
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}

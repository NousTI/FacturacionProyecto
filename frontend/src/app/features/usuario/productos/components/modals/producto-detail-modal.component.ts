import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../../domain/models/producto.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';

@Component({
  selector: 'app-producto-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-editorial-overlay" (click)="onClose.emit()">
      <div class="modal-editorial-container detail-modal" (click)="$event.stopPropagation()">
        
        <div class="modal-editorial-header border-0">
          <div class="product-brand-header">
            <div class="avatar-large" [style.background]="getAvatarColor(producto.nombre)">
              {{ getInitials(producto.nombre) }}
            </div>
            <div class="brand-info">
              <h2 class="modal-title">{{ producto.nombre }}</h2>
              <div class="status-tags">
                <span class="type-tag">{{ producto.tipo }}</span>
                <span class="active-tag" [class.inactive]="!producto.activo">
                  {{ producto.activo ? 'Habilitado' : 'Deshabilitado' }}
                </span>
              </div>
            </div>
          </div>
          <button class="btn-close-editorial" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-editorial-body scroll-custom">
          <div class="row g-4">
            <!-- COLUMNA IZQUIERDA: DATOS -->
            <div class="col-md-7">
              <div class="detail-card-editorial shadow-sm mb-4">
                <div class="card-header-editorial">
                  <i class="bi bi-card-text"></i>
                  <span>Especificaciones</span>
                </div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Código Interno</label>
                    <span class="value code-font">{{ producto.codigo }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Unidad de Medida</label>
                    <span class="value">{{ producto.unidad_medida || 'No especificada' }}</span>
                  </div>
                  <div class="detail-item full">
                    <label>Descripción</label>
                    <span class="value description">{{ producto.descripcion || 'Sin descripción adicional' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-card-editorial shadow-sm">
                <div class="card-header-editorial">
                  <i class="bi bi-wallet2"></i>
                  <span>Precios & Tributos</span>
                </div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Precio de Venta (PVP)</label>
                    <span class="value price">{{ producto.precio | number:'1.2-2' }} <small>USD</small></span>
                  </div>
                  <div class="detail-item">
                    <label>Tipo de IVA</label>
                    <span class="value">{{ producto.porcentaje_iva }}%</span>
                  </div>
                  <div class="detail-item" *ngIf="canViewCosts">
                    <label>Costo de Compra</label>
                    <span class="value">{{ (producto.costo | number:'1.2-2') || '—' }} <small>USD</small></span>
                  </div>
                  <div class="detail-item" *ngIf="canViewCosts">
                    <label>Rentabilidad Proyectada</label>
                    <span class="value margin" [ngClass]="getMargenClass()">{{ calculateMargen() }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMNA DERECHA: STOCK -->
            <div class="col-md-5">
              <div class="inventory-card-premium shadow-sm mb-4" *ngIf="producto.tipo === 'PRODUCTO'">
                <div class="card-header-editorial text-white border-0">
                  <i class="bi bi-box-seam"></i>
                  <span>Existencias</span>
                </div>
                
                <div *ngIf="producto.maneja_inventario; else noStockControl" class="stock-content">
                  <div class="stock-main-display">
                    <span class="stock-number">{{ producto.stock_actual }}</span>
                    <span class="stock-unit">{{ producto.unidad_medida }} en bodega</span>
                  </div>

                  <div class="stock-meta">
                    <div class="meta-item">
                      <label>Estado de Alerta</label>
                      <span class="alert-badge" [ngClass]="getStockAlertClass()">
                        {{ getStockStatus() }}
                      </span>
                    </div>
                    <div class="meta-item">
                      <label>Stock de Seguridad</label>
                      <span class="meta-value">{{ producto.stock_minimo }}</span>
                    </div>
                  </div>
                </div>

                <ng-template #noStockControl>
                  <div class="no-stock-msg">
                    <i class="bi bi-slash-circle"></i>
                    <p>Producto sin control de inventario</p>
                  </div>
                </ng-template>
              </div>

              <div class="audit-card-editorial shadow-sm">
                <div class="card-header-editorial">
                  <i class="bi bi-clock-history"></i>
                  <span>Historial de Item</span>
                </div>
                <div class="audit-timeline">
                  <div class="timeline-point">
                    <div class="point-marker"></div>
                    <div class="point-content">
                      <label>Creado el</label>
                      <span>{{ producto.created_at | date:'medium' }}</span>
                    </div>
                  </div>
                  <div class="timeline-point" *ngIf="producto.updated_at">
                    <div class="point-marker active"></div>
                    <div class="point-content">
                      <label>Última actualización</label>
                      <span>{{ producto.updated_at | date:'medium' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-editorial-footer">
          <button (click)="onClose.emit()" class="btn-editorial-primary w-100">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-editorial-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-editorial-container {
      background: #ffffff; width: 880px; max-width: 100%; max-height: 90vh;
      border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #f1f5f9;
    }
    .modal-editorial-header {
      padding: 2.5rem 2.5rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-start;
    }
    .product-brand-header { display: flex; align-items: center; gap: 1.5rem; }
    .avatar-large {
      width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center;
      justify-content: center; font-size: 1.8rem; font-weight: 900; color: white;
    }
    .brand-info { display: flex; flex-direction: column; gap: 0.5rem; }
    .modal-title { font-size: 1.6rem; font-weight: 900; color: black; margin: 0; }
    .status-tags { display: flex; gap: 0.75rem; }
    .type-tag { font-size: 0.7rem; font-weight: 800; color: black; background: #eff6ff; padding: 0.25rem 0.75rem; border-radius: 6px; text-transform: uppercase; }
    .active-tag { font-size: 0.7rem; font-weight: 800; color: #059669; background: #ecfdf5; padding: 0.25rem 0.75rem; border-radius: 6px; text-transform: uppercase; }
    .active-tag.inactive { color: #dc2626; background: #fef2f2; }

    .btn-close-editorial {
      width: 44px; height: 44px; border-radius: 14px; border: none; background: #f8fafc;
      color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-editorial:hover { background: #f1f5f9; color: black; }

    .modal-editorial-body { padding: 0 2.5rem 2.5rem; overflow-y: auto; flex: 1; }
    
    .detail-card-editorial { background: white; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; }
    .card-header-editorial {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; color: #64748b;
      display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; font-weight: 800; text-transform: uppercase;
    }
    .card-header-editorial i { color: black; font-size: 1rem; }
    .inventory-card-premium .card-header-editorial i { color: white; }

    .detail-grid { padding: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full { grid-column: span 2; }
    .detail-item label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .detail-item .value { font-size: 1rem; font-weight: 700; color: black; }
    .code-font { font-family: 'JetBrains Mono', monospace; color: black !important; font-size: 1.1rem !important; }
    .description { color: #475569 !important; font-weight: 500 !important; line-height: 1.5; }
    .price { font-size: 1.4rem !important; color: black !important; font-weight: 900 !important; }
    .price small { font-size: 0.8rem; opacity: 0.5; margin-left: 2px; }
    .margin.margen-success { color: #059669; }
    .margin.margen-warning { color: #d97706; }
    .margin.margen-danger { color: #dc2626; }

    .inventory-card-premium { background: var(--primary-color); border-radius: 20px; overflow: hidden; padding-bottom: 1.5rem; }
    .stock-content { padding: 0 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .stock-main-display { display: flex; flex-direction: column; align-items: center; padding: 1rem 0; }
    .stock-number { font-size: 3.5rem; font-weight: 950; color: white; line-height: 1; letter-spacing: -2px; }
    .stock-unit { font-size: 0.8rem; color: white; font-weight: 700; text-transform: uppercase; margin-top: 0.5rem; }
    
    .stock-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .meta-item label { font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; }
    .alert-badge { padding: 0.5rem; border-radius: 10px; font-size: 0.65rem; font-weight: 900; text-align: center; color: white; }
    .alert-badge.stock-success { background: #10b981; }
    .alert-badge.stock-warning { background: #f59e0b; }
    .alert-badge.stock-danger { background: #ef4444; }
    .meta-value { font-size: 1.1rem; font-weight: 800; color: white; }

    .no-stock-msg { padding: 3rem 1rem; text-align: center; color: #475569; }
    .no-stock-msg i { font-size: 2.5rem; opacity: 0.2; margin-bottom: 1rem; display: block; }
    .no-stock-msg p { font-size: 0.85rem; font-weight: 700; }

    .audit-card-editorial { background: white; border-radius: 20px; border: 1px solid #f1f5f9; padding-bottom: 1.5rem; }
    .audit-timeline { padding: 1.5rem 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
    .timeline-point { display: flex; gap: 1rem; }
    .point-marker { width: 12px; height: 12px; border-radius: 50%; border: 3px solid #e2e8f0; margin-top: 0.3rem; flex-shrink: 0; }
    .point-marker.active { border-color: black; background: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .point-content { display: flex; flex-direction: column; }
    .point-content label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .point-content span { font-size: 0.85rem; font-weight: 700; color: #475569; }

    .modal-editorial-footer { padding: 1.5rem 2.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; }
    .btn-editorial-primary { background: var(--primary-color); color: white; border: none; padding: 1rem; border-radius: 14px; font-weight: 800; font-size: 0.95rem; transition: all 0.2s; }
    .btn-editorial-primary:hover { background: var(--primary-color); transform: translateY(-2px); }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
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
    if (this.producto.stock_actual <= 0) return 'AGOTADO';
    if (this.producto.stock_actual <= this.producto.stock_minimo) return 'STOCK BAJO';
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



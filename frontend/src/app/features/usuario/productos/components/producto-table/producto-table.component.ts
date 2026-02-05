import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../../domain/models/producto.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';

@Component({
  selector: 'app-producto-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container-lux">
      <table class="table mb-0 align-middle">
        <thead>
          <tr>
            <th class="ps-4">Item / Tipo</th>
            <th style="width: 140px">Referencia</th>
            <th style="width: 130px">Estado</th>
            <th style="width: 140px">Venta (USD)</th>
            <th *ngIf="canViewCosts" style="width: 130px">Costo (USD)</th>
            <th style="width: 160px">Disponibilidad</th>
            <th class="text-end pe-4" style="width: 80px">Gesti&oacute;n</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let producto of productos" class="row-lux animate-fade-in">
            <td class="ps-4">
              <div class="d-flex align-items-center">
                <div class="item-icon-wrapper me-3 shadow-sm" [style.background]="getAvatarColor(producto.nombre, 0.1)" [style.color]="getAvatarColor(producto.nombre, 1)">
                  <i class="bi" [ngClass]="producto.tipo === 'SERVICIO' ? 'bi-lightning-charge-fill' : 'bi-box-seam-fill'"></i>
                </div>
                <div>
                  <span class="fw-bold text-dark d-block mb-0">{{ producto.nombre }}</span>
                  <small class="text-muted text-uppercase fw-800" style="font-size: 0.65rem; letter-spacing: 0.5px;">{{ producto.tipo }}</small>
                </div>
              </div>
            </td>
            <td>
              <div class="sku-badge">{{ producto.codigo }}</div>
            </td>
            <td>
              <div class="badge-status-lux" [ngClass]="producto.activo ? 'activo' : 'inactivo'">
                <div class="dot"></div>
                {{ producto.activo ? 'ACTIVO' : 'INACTIVO' }}
              </div>
            </td>
            <td>
              <span class="price-lux">{{ producto.precio | currency:'USD' }}</span>
            </td>
            <td *ngIf="canViewCosts">
              <span class="cost-lux">{{ producto.costo !== null ? (producto.costo | currency:'USD') : '---' }}</span>
            </td>
            <td>
               <div *ngIf="producto.maneja_inventario; else noInv" class="stock-container">
                  <div class="stock-info">
                    <span class="stock-val" [ngClass]="getStockClass(producto)">
                      {{ producto.stock_actual }}
                    </span>
                    <span class="stock-unit text-muted small ms-1">{{ producto.unidad_medida }}</span>
                  </div>
                  <div class="stock-bar-bg" *ngIf="producto.stock_minimo > 0">
                    <div class="stock-bar-fill" [style.width.%]="calculateStockPercent(producto)" [ngClass]="getStockClass(producto, true)"></div>
                  </div>
               </div>
               <ng-template #noInv>
                  <div class="badge-flat-soft">No Inventariable</div>
               </ng-template>
            </td>
            <td class="text-end pe-4">
              <div class="dropdown">
                <button 
                  class="btn-trigger-lux" 
                  type="button" 
                  [id]="'actions-p-' + producto.id" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4 animate-fade-in-scale" [attr.aria-labelledby]="'actions-p-' + producto.id">
                  <li>
                    <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', producto})">
                      <div class="icon-item bg-soft-info"><i class="bi bi-eye-fill"></i></div>
                      <span class="ms-2">Ficha T&eacute;cnica</span>
                    </a>
                  </li>
                  <li *ngIf="canEdit">
                    <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', producto})">
                      <div class="icon-item bg-soft-primary"><i class="bi bi-pencil-fill"></i></div>
                      <span class="ms-2">Modificar</span>
                    </a>
                  </li>
                  <li *ngIf="canDelete"><hr class="dropdown-divider mx-2 opacity-10"></li>
                  <li *ngIf="canDelete">
                    <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', producto})">
                      <div class="icon-item bg-soft-danger"><i class="bi bi-trash3-fill"></i></div>
                      <span class="ms-2">Eliminar</span>
                    </a>
                  </li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="productos.length === 0" class="empty-state py-5 text-center">
        <div class="empty-icon-bg mb-3 mx-auto">
          <i class="bi bi-search"></i>
        </div>
        <h5 class="fw-bold text-dark">Sin coincidencias</h5>
        <p class="text-muted small">No encontramos productos con esos filtros.</p>
      </div>
    </div>
  `,
  styles: [`
    .table-container-lux { background: #fff; position: relative; overflow: visible; }
    
    .table thead th {
      background: #fcfdfe;
      padding: 1.25rem 1rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f8fafc;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .row-lux { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-bottom: 1px solid #f8fafc; cursor: default; }
    .row-lux:hover { background: #fcfcfe; transform: scale(1.002); z-index: 5; position: relative; }
    
    .row-lux td { padding: 1.25rem 1rem; }
    
    .item-icon-wrapper {
      width: 44px; height: 44px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    
    .sku-badge {
      background: #f1f5f9; color: #475569;
      padding: 0.35rem 0.75rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700; font-family: 'Monaco', monospace;
    }
    
    .badge-status-lux {
      display: inline-flex; align-items: center;
      padding: 0.45rem 1rem; border-radius: 12px;
      font-size: 0.7rem; font-weight: 800;
      letter-spacing: 0.5px;
    }
    .badge-status-lux.activo { background: #ecfdf5; color: #10b981; }
    .badge-status-lux.inactivo { background: #fef2f2; color: #ef4444; }
    .badge-status-lux .dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 8px; background: currentColor; }

    .price-lux { font-weight: 800; color: #161d35; font-size: 0.95rem; }
    .cost-lux { font-weight: 600; color: #94a3b8; font-size: 0.85rem; }

    .stock-container { width: 100%; max-width: 140px; }
    .stock-val { font-weight: 800; font-size: 0.9rem; }
    .stock-bar-bg { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; margin-top: 6px; overflow: hidden; }
    .stock-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }
    
    .stock-danger { color: #ef4444; }
    .stock-warning { color: #f59e0b; }
    .stock-success { color: #10b981; }
    
    .bg-stock-danger { background: #ef4444; }
    .bg-stock-warning { background: #f59e0b; }
    .bg-stock-success { background: #10b981; }

    .badge-flat-soft { font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }

    .btn-trigger-lux {
      background: transparent; border: none;
      width: 36px; height: 36px;
      border-radius: 10px; color: #94a3b8;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-trigger-lux:hover { background: #f1f5f9; color: #161d35; }

    .dropdown-menu { z-index: 100000 !important; min-width: 200px; border: 1px solid #e2e8f0 !important; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15) !important; }
    .dropdown-item {
      display: flex; align-items: center; font-size: 0.825rem;
      font-weight: 700; color: #475569; border-radius: 10px;
      margin-bottom: 2px; transition: all 0.2s;
      cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; transform: translateX(4px); }
    
    .icon-item {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem;
    }
    .bg-soft-info { background: #e0f2fe; color: #0ea5e9; }
    .bg-soft-primary { background: #e0e7ff; color: #4f46e5; }
    .bg-soft-danger { background: #fee2e2; color: #ef4444; }

    .empty-icon-bg {
      width: 80px; height: 80px; background: #f8fafc;
      border-radius: 100%; display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: #cbd5e1; border: 2px dashed #e2e8f0;
    }

    .fw-800 { font-weight: 800; }
  `]
})
export class ProductoTableComponent implements OnInit {
  @Input() productos: Producto[] = [];
  @Output() onAction = new EventEmitter<{ type: string, producto: Producto }>();

  constructor(private permissionsService: PermissionsService) {
    console.log('ProductoTableComponent initialized');
  }

  ngOnInit() {
    // No longer needed as permissions are handled by getters
  }

  get canViewCosts(): boolean {
    return this.permissionsService.hasPermission('PRODUCTOS_VER_COSTOS') ||
      this.permissionsService.hasPermission('PRODUCTO_VER_COSTOS');
  }

  get canEdit(): boolean {
    return this.permissionsService.hasPermission('PRODUCTOS_EDITAR') ||
      this.permissionsService.hasPermission('PRODUCTO_EDITAR');
  }

  get canDelete(): boolean {
    return this.permissionsService.hasPermission('PRODUCTOS_ELIMINAR') ||
      this.permissionsService.hasPermission('PRODUCTO_ELIMINAR');
  }

  getStockClass(p: Producto, isBg = false): string {
    const prefix = isBg ? 'bg-stock-' : 'stock-';
    if (p.stock_actual <= 0) return prefix + 'danger';
    if (p.stock_actual <= p.stock_minimo) return prefix + 'warning';
    return prefix + 'success';
  }

  calculateStockPercent(p: Producto): number {
    if (!p.stock_actual) return 0;
    const maxVisualValue = p.stock_minimo * 3 || 100;
    const percent = (p.stock_actual / maxVisualValue) * 100;
    return Math.min(percent, 100);
  }

  getAvatarColor(name: string, opacity: number): string {
    if (!name) return `rgba(148, 163, 184, ${opacity})`;
    const colors = [
      `rgba(99, 102, 241, ${opacity})`,
      `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`,
      `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`,
      `rgba(20, 184, 166, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

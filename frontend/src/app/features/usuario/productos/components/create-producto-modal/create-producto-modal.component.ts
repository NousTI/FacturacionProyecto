import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../../domain/models/producto.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';

@Component({
  selector: 'app-create-producto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">{{ producto ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
          <button (click)="onClose.emit()" class="btn-close-final" [disabled]="loading">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <form #prodForm="ngForm" id="productoForm" (ngSubmit)="handleSave(prodForm)">
            
            <!-- DATOS BÁSICOS -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información General</h3>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="label-final">Código *</label>
                  <input type="text" [(ngModel)]="formData.codigo" name="codigo" class="input-final" required placeholder="SKU-001">
                </div>
                <div class="col-md-8">
                  <label class="label-final">Nombre *</label>
                  <input type="text" [(ngModel)]="formData.nombre" name="nombre" class="input-final" required placeholder="Nombre del producto">
                </div>
                <div class="col-12">
                  <label class="label-final">Descripción</label>
                  <textarea [(ngModel)]="formData.descripcion" name="descripcion" class="input-final" rows="2" placeholder="Notas adicionales..."></textarea>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Tipo</label>
                  <select [(ngModel)]="formData.tipo" name="tipo" class="select-final">
                    <option value="PRODUCTO">Producto</option>
                    <option value="SERVICIO">Servicio</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-center pt-3">
                  <div class="form-check form-switch switch-final">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="formData.activo" name="activo" id="activoCheck">
                    <label class="form-check-label label-final ms-2 mb-0" for="activoCheck">Item Activo</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- COSTOS Y PRECIOS -->
            <div class="form-section-final">
              <h3 class="section-header-final">Precios e Impuestos</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Precio Venta (PVP) *</label>
                  <div class="input-group-final">
                    <span class="prefix-final">$</span>
                    <input type="number" [(ngModel)]="formData.precio" name="precio" class="input-final ps-5" required min="0" step="0.01">
                  </div>
                </div>
                <div class="col-md-6" *ngIf="canViewCosts">
                  <label class="label-final">Costo Compra</label>
                  <div class="input-group-final">
                    <span class="prefix-final">$</span>
                    <input type="number" [(ngModel)]="formData.costo" name="costo" class="input-final ps-5" min="0" step="0.01">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Impuesto IVA</label>
                  <select [(ngModel)]="formData.tipo_iva" name="tipo_iva" class="select-final" (change)="onIvaChange()">
                    <option value="4">Tarifa 15%</option>
                    <option value="0">Tarifa 0%</option>
                    <option value="6">Exento</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Margen Proyectado</label>
                  <div class="margen-indicator-final shadow-sm" [ngClass]="getMargenClass()">
                    {{ calculateMargen() }}% Ganancia
                  </div>
                </div>
              </div>
            </div>

            <!-- INVENTARIO -->
            <div class="form-section-final border-0 mb-0 pb-0" *ngIf="formData.tipo === 'PRODUCTO'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="section-header-final mb-0">Inventario</h3>
                <div class="form-check form-switch switch-final">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="formData.maneja_inventario" name="maneja_inventario" id="inventarioCheck">
                  <label class="form-check-label label-final ms-1 mb-0" for="inventarioCheck">Controlar Stock</label>
                </div>
              </div>
              
              <div class="row g-3" *ngIf="formData.maneja_inventario">
                <div class="col-md-4">
                  <label class="label-final">Stock Inicial</label>
                  <input type="number" [(ngModel)]="formData.stock_actual" name="stock_actual" class="input-final">
                </div>
                <div class="col-md-4">
                  <label class="label-final">Stock Mínimo Alerta</label>
                  <input type="number" [(ngModel)]="formData.stock_minimo" name="stock_minimo" class="input-final">
                </div>
                <div class="col-md-4">
                  <label class="label-final">Unidad</label>
                  <select [(ngModel)]="formData.unidad_medida" name="unidad_medida" class="select-final">
                    <option value="unidad">unid.</option>
                    <option value="kg">kg</option>
                    <option value="litro">litros</option>
                    <option value="servicio">serv.</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button type="button" class="btn-cancel-final" (click)="onClose.emit()" [disabled]="loading">Cerrar</button>
          <button type="submit" 
                  form="productoForm"
                  class="btn-submit-final shadow-sm"
                  [disabled]="loading || !prodForm.valid">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Guardando...' : (producto ? 'Guardar Cambios' : 'Crear Item') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 700px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
    }
    .modal-title-final {
      font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0;
    }
    .btn-close-final {
      background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
    }
    .modal-body-final {
      padding: 0 2.5rem 2rem; overflow-y: auto; flex: 1;
    }
    .form-section-final {
      margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .section-header-final {
      font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.25rem;
    }
    .label-final {
      font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; display: block;
    }
    .input-final, .select-final {
      width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.25rem; font-size: 0.9rem; color: #475569; font-weight: 600;
      transition: all 0.2s;
    }
    .input-final:focus, .select-final:focus {
      border-color: #161d35; outline: none; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .modal-footer-final {
      padding: 1.25rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none; padding: 0.75rem 2rem; border-radius: 12px;
      font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) {
      background: #232d4d; transform: translateY(-1px);
    }
    .btn-submit-final:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 600;
    }
    
    .input-group-final { position: relative; display: flex; align-items: center; }
    .prefix-final { position: absolute; left: 1.25rem; font-weight: 800; color: #94a3b8; font-size: 0.9rem; }
    
    .margen-indicator-final {
      height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 800;
    }
    .margen-success { background: #ecfdf5; color: #059669; }
    .margen-warning { background: #fffbeb; color: #d97706; }
    .margen-danger { background: #fef2f2; color: #dc2626; }

    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .switch-final .form-check-input:checked { background-color: #161d35; border-color: #161d35; }

    @media (max-width: 600px) {
      .modal-container-final { width: 100%; border-radius: 0; max-height: 100vh; }
    }
  `]
})
export class CreateProductoModalComponent implements OnInit, OnDestroy {
  @Input() producto: Producto | null = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  formData: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    costo: 0,
    tipo_iva: '4', // SRI: 4 = 15%
    porcentaje_iva: 15,
    maneja_inventario: true,
    tipo: 'PRODUCTO',
    unidad_medida: 'unidad',
    activo: true,
    stock_actual: 0,
    stock_minimo: 0,
    empresa_id: null
  };

  canViewCosts: boolean = false;

  constructor(private permissionsService: PermissionsService) { }

  ngOnInit() {
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    this.canViewCosts = this.permissionsService.hasPermission('PRODUCTOS_VER_COSTOS');
    if (this.producto) {
      // Al editar, clonamos y nos aseguramos de que los valores sensibles se manejen
      this.formData = { ...this.producto };
    }
  }

  ngOnDestroy() {
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  onIvaChange() {
    if (this.formData.tipo_iva === '4') {
      this.formData.porcentaje_iva = 15;
    } else {
      this.formData.porcentaje_iva = 0;
    }
  }

  calculateMargen(): number {
    const precio = Number(this.formData.precio) || 0;
    const costo = Number(this.formData.costo) || 0;
    if (precio <= 0) return 0;
    const margen = ((precio - costo) / precio) * 100;
    return Math.round(margen);
  }

  getMargenClass(): string {
    const margen = this.calculateMargen();
    if (margen >= 30) return 'margen-success';
    if (margen > 10) return 'margen-warning';
    return 'margen-danger';
  }

  handleSave(form: any) {
    if (form.valid) {
      // Limpieza de datos antes de enviar
      const dataToSave = { ...this.formData };

      // Si estamos creando (producto es null), eliminamos empresa_id si existe
      if (!this.producto) {
        delete dataToSave.empresa_id;
        delete dataToSave.id;
      }

      this.onSave.emit(dataToSave);
    }
  }
}

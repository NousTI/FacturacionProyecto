import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../../domain/models/producto.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { SRI_IVA_TARIFAS, GET_IVA_PERCENTAGE } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-producto-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-editorial-overlay" (click)="onClose.emit()">
      <div class="modal-editorial-container" (click)="$event.stopPropagation()">
        
        <div class="modal-editorial-header">
          <div class="header-main">
            <h2 class="modal-title">{{ producto ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
            <p class="modal-subtitle">Define los detalles técnicos, precios e inventario</p>
          </div>
          <button class="btn-close-editorial" (click)="onClose.emit()" [disabled]="loading">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-editorial-body scroll-custom">
          <form #prodForm="ngForm" id="productoForm" (ngSubmit)="handleSave(prodForm)">
            
            <!-- IDENTIFICACIÓN -->
            <div class="form-section-modern">
              <div class="section-title-modern">
                <i class="bi bi-info-circle"></i>
                <span>Información General</span>
              </div>

              <div class="row g-4">
                <div class="col-md-4">
                  <div class="input-group-modern">
                    <label>Código Interno *</label>
                    <input type="text" [(ngModel)]="formData.codigo" name="codigo" #codigo="ngModel" required minlength="3" placeholder="SKU-XXX">
                    <div *ngIf="codigo.invalid && codigo.touched" class="error-text">El código es requerido (min. 3)</div>
                  </div>
                </div>
                <div class="col-md-8">
                  <div class="input-group-modern">
                    <label>Nombre del Producto / Servicio *</label>
                    <input type="text" [(ngModel)]="formData.nombre" name="nombre" #nombre="ngModel" required placeholder="Nombre descriptivo">
                    <div *ngIf="nombre.invalid && nombre.touched" class="error-text">El nombre es obligatorio</div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="input-group-modern">
                    <label>Descripción</label>
                    <textarea [(ngModel)]="formData.descripcion" name="descripcion" rows="2" placeholder="Detalles adicionales..."></textarea>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="input-group-modern">
                    <label>Clasificación</label>
                    <select [(ngModel)]="formData.tipo" name="tipo">
                      <option value="PRODUCTO">Bien / Producto</option>
                      <option value="SERVICIO">Prestación de Servicio</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="input-group-modern">
                    <label>Estado</label>
                    <div class="toggle-container">
                      <div class="form-check form-switch custom-switch-premium">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="formData.activo" name="activo" id="activoCheck">
                        <label class="form-check-label" for="activoCheck">
                          {{ formData.activo ? 'Habilitado' : 'Inactivo' }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PRECIOS -->
            <div class="form-section-modern">
              <div class="section-title-modern">
                <i class="bi bi-currency-dollar"></i>
                <span>Precios y Tributos</span>
              </div>

              <div class="row g-4">
                <div class="col-md-6">
                  <div class="input-group-modern">
                    <label>Precio de Venta (PVP) *</label>
                    <div class="input-with-icon">
                      <span class="prefix">$</span>
                      <input type="number" [(ngModel)]="formData.precio" name="precio" #precio="ngModel" required min="0.01" step="0.01" (keypress)="validateNoNegative($event)">
                    </div>
                  </div>
                </div>
                <div class="col-md-6" *ngIf="canViewCosts">
                  <div class="input-group-modern">
                    <label>Costo de Compra</label>
                    <div class="input-with-icon">
                      <span class="prefix">$</span>
                      <input type="number" [(ngModel)]="formData.costo" name="costo" #costo="ngModel" min="0" step="0.01" (keypress)="validateNoNegative($event)">
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="input-group-modern">
                    <label>Tipo de IVA (SRI)</label>
                    <select [(ngModel)]="formData.tipo_iva" name="tipo_iva" (change)="onIvaChange()">
                      <option *ngFor="let option of ivaOptions" [value]="option.code">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6" *ngIf="canViewCosts">
                  <div class="input-group-modern">
                    <label>Margen de Utilidad</label>
                    <div class="margin-indicator" [ngClass]="getMargenClass()">
                      <i class="bi" [ngClass]="calculateMargen() >= 10 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'"></i>
                      <span>{{ calculateMargen() }}% de ganancia proyectada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- INVENTARIO -->
            <div class="form-section-modern border-0" *ngIf="formData.tipo === 'PRODUCTO'">
              <div class="section-title-modern">
                <i class="bi bi-box-seam"></i>
                <span>Control de Existencias</span>
              </div>

              <div class="inventory-config-panel">
                <div class="form-check form-switch custom-switch-premium">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="formData.maneja_inventario" name="maneja_inventario" id="inventarioCheck">
                  <label class="form-check-label" for="inventarioCheck">Este producto controla stock en bodega</label>
                </div>
              </div>
              
              <div class="row g-4 mt-1" *ngIf="formData.maneja_inventario">
                <div class="col-md-4">
                  <div class="input-group-modern">
                    <label>Stock Actual</label>
                    <input type="number" [(ngModel)]="formData.stock_actual" name="stock_actual" min="0" (keypress)="validateNoNegative($event)">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="input-group-modern">
                    <label>Stock Mínimo</label>
                    <input type="number" [(ngModel)]="formData.stock_minimo" name="stock_minimo" min="0" (keypress)="validateNoNegative($event)">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="input-group-modern">
                    <label>Unidad de Medida</label>
                    <select [(ngModel)]="formData.unidad_medida" name="unidad_medida">
                      <option value="unidad">Unidades (u.)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="litro">Litros (l.)</option>
                      <option value="servicio">Servicio (hv)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-editorial-footer">
          <button type="button" class="btn-editorial-ghost" (click)="onClose.emit()" [disabled]="loading">Cancelar</button>
          <button type="submit" 
                  form="productoForm"
                  class="btn-editorial-primary"
                  [disabled]="loading || !prodForm.valid || (producto && !hasChanges)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Procesando...' : (producto ? 'Guardar Cambios' : 'Registrar Producto') }}
          </button>
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
      background: #ffffff; width: 720px; max-width: 100%; max-height: 90vh;
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #f1f5f9;
    }
    .modal-editorial-header {
      padding: 1.75rem 2rem; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin: 0; }
    .modal-subtitle { font-size: 0.82rem; color: #64748b; margin: 0.25rem 0 0 0; font-weight: 500; }
    .btn-close-editorial {
      width: 40px; height: 40px; border-radius: 12px; border: none; background: #f8fafc;
      color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-editorial:hover { background: #f1f5f9; color: #1e293b; }

    .modal-editorial-body { padding: 2rem; overflow-y: auto; flex: 1; }
    .form-section-modern { margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #f1f5f9; }
    .section-title-modern {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
      font-size: 0.75rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .section-title-modern i { font-size: 1rem; }

    .input-group-modern { display: flex; flex-direction: column; gap: 0.5rem; }
    .input-group-modern label { font-size: 0.8rem; font-weight: 700; color: #475569; }
    .input-group-modern input, .input-group-modern select, .input-group-modern textarea {
      padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc;
      font-size: 0.92rem; font-weight: 600; color: #1e293b; transition: all 0.2s;
    }
    .input-group-modern input:focus, .input-group-modern select:focus, .input-group-modern textarea:focus {
      outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .input-with-icon { position: relative; }
    .input-with-icon .prefix { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-weight: 700; }
    .input-with-icon input { padding-left: 2rem; width: 100%; }

    .margin-indicator {
      height: 46px; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem;
      padding: 0 1rem; font-size: 0.85rem; font-weight: 700;
    }
    .margen-success { background: #ecfdf5; color: #059669; }
    .margen-warning { background: #fffbeb; color: #d97706; }
    .margen-danger { background: #fef2f2; color: #dc2626; }

    .inventory-config-panel { background: #f8fafc; padding: 1.25rem; border-radius: 16px; margin-bottom: 1rem; }

    .custom-switch-premium .form-check-input { width: 3rem; height: 1.5rem; cursor: pointer; }
    .custom-switch-premium .form-check-label { font-size: 0.85rem; font-weight: 700; color: #475569; padding-top: 0.2rem; cursor: pointer; }
    .custom-switch-premium .form-check-input:checked { background-color: #3b82f6; border-color: #3b82f6; }

    .modal-editorial-footer {
      padding: 1.5rem 2rem; display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9; background: #f8fafc;
    }
    .btn-editorial-primary {
      background: #1e293b; color: white; border: none; padding: 0.8rem 2rem; border-radius: 12px;
      font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
    }
    .btn-editorial-primary:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); }
    .btn-editorial-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-editorial-ghost {
      background: transparent; color: #64748b; border: 1px solid #e2e8f0; padding: 0.8rem 2rem; border-radius: 12px;
      font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
    }
    .btn-editorial-ghost:hover { background: #f1f5f9; color: #1e293b; }

    .error-text { font-size: 0.72rem; color: #ef4444; font-weight: 700; text-transform: uppercase; margin-top: 0.2rem; }
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class ProductoFormModalComponent implements OnInit, OnDestroy {
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
    stock_minimo: 0
  };

  canViewCosts: boolean = false;
  ivaOptions = SRI_IVA_TARIFAS;

  constructor(private permissionsService: PermissionsService) { }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.canViewCosts = this.permissionsService.hasPermission('PRODUCTOS_VER_COSTOS');
    if (this.producto) {
      this.formData = { ...this.producto };
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  onIvaChange() {
    this.formData.porcentaje_iva = GET_IVA_PERCENTAGE(this.formData.tipo_iva);
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

  validateNoNegative(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 45) event.preventDefault();
  }

  handleSave(form: any) {
    if (form.valid) {
      const dataToSave = { ...this.formData };
      if (!this.producto) {
        delete dataToSave.id;
        delete dataToSave.empresa_id;
      }
      this.onSave.emit(dataToSave);
    }
  }

  get hasChanges(): boolean {
    if (!this.producto) return true;
    const fields = [
      'codigo', 'nombre', 'descripcion', 'precio', 'costo', 
      'tipo_iva', 'porcentaje_iva', 'maneja_inventario', 
      'tipo', 'unidad_medida', 'activo', 'stock_actual', 'stock_minimo'
    ];
    for (const field of fields) {
      const initial = String((this.producto as any)[field] ?? '');
      const current = String(this.formData[field] ?? '');
      if (initial !== current) return true;
    }
    return false;
  }
}

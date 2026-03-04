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
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="dashboard-modal-container" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="dashboard-modal-header">
          <div class="header-content">
            <h2 class="modal-title">{{ producto ? 'Editar Item' : 'Nuevo Registro' }}</h2>
            <p class="modal-subtitle">Configure los detalles técnicos y comerciales</p>
          </div>
          <button (click)="onClose.emit()" class="btn-modal-close" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="dashboard-modal-body scroll-custom">
          <form #prodForm="ngForm" id="productoForm" (ngSubmit)="handleSave(prodForm)">
            
            <!-- SECCIÓN 1: IDENTIFICACIÓN -->
            <div class="form-section">
              <span class="section-tag">Identificación General</span>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="dashboard-label">Código / Referencia</label>
                  <input type="text" [(ngModel)]="formData.codigo" name="codigo" class="dashboard-input" required placeholder="Ej: SKU-100">
                </div>
                <div class="col-md-8">
                  <label class="dashboard-label">Nombre Comercial</label>
                  <input type="text" [(ngModel)]="formData.nombre" name="nombre" class="dashboard-input" required placeholder="Ej: Producto A">
                </div>
                <div class="col-12">
                  <label class="dashboard-label">Descripción</label>
                  <textarea [(ngModel)]="formData.descripcion" name="descripcion" class="dashboard-input" rows="2" placeholder="Detalles opcionales..."></textarea>
                </div>
                <div class="col-md-6">
                  <label class="dashboard-label">Clasificación</label>
                  <select [(ngModel)]="formData.tipo" name="tipo" class="dashboard-select">
                    <option value="PRODUCTO">Bien / Producto</option>
                    <option value="SERVICIO">Prestación de Servicio</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-center pt-3">
                  <div class="form-check form-switch custom-switch">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="formData.activo" name="activo" id="activoCheck">
                    <label class="form-check-label dashboard-label ms-2 mb-0" for="activoCheck">Estado del Item</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: PRECIOS -->
            <div class="form-section">
              <span class="section-tag">Precios & Tributos</span>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="dashboard-label">Precio Publicado (USD) *</label>
                  <div class="input-currency-wrapper">
                    <i class="bi bi-currency-dollar"></i>
                    <input type="number" [(ngModel)]="formData.precio" name="precio" class="dashboard-input ps-4" required min="0" step="0.01">
                  </div>
                </div>
                <div class="col-md-6" *ngIf="canViewCosts">
                  <label class="dashboard-label">Costo de Adquisición</label>
                  <div class="input-currency-wrapper">
                    <i class="bi bi-tag"></i>
                    <input type="number" [(ngModel)]="formData.costo" name="costo" class="dashboard-input ps-4" min="0" step="0.01">
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="dashboard-label">Esquema IVA</label>
                  <select [(ngModel)]="formData.tipo_iva" name="tipo_iva" class="dashboard-select" (change)="onIvaChange()">
                    <option value="4">Tarifa 15% (Ecuador)</option>
                    <option value="0">Tarifa 0%</option>
                    <option value="6">Exento de Impuesto</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="dashboard-label">Rendimiento Operativo</label>
                  <div class="margen-badge-simple" [ngClass]="getMargenClass()">
                    <i class="bi bi-graph-up-arrow me-2"></i>
                    <span>{{ calculateMargen() }}% de ganancia</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: INVENTARIO -->
            <div class="form-section border-0" *ngIf="formData.tipo === 'PRODUCTO'">
              <span class="section-tag">Control de Existencias</span>
              <div class="d-flex align-items-center mb-4 gap-3 bg-light-soft p-3 rounded-4">
                 <div class="form-check form-switch custom-switch">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="formData.maneja_inventario" name="maneja_inventario" id="inventarioCheck">
                    <label class="dashboard-label ms-1 mb-0" for="inventarioCheck">Habilitar seguimiento de stock</label>
                 </div>
              </div>
              
              <div class="row g-3" *ngIf="formData.maneja_inventario">
                <div class="col-md-4">
                  <label class="dashboard-label">Balance Inicial</label>
                  <input type="number" [(ngModel)]="formData.stock_actual" name="stock_actual" class="dashboard-input">
                </div>
                <div class="col-md-4">
                  <label class="dashboard-label">Mínimo de Alerta</label>
                  <input type="number" [(ngModel)]="formData.stock_minimo" name="stock_minimo" class="dashboard-input">
                </div>
                <div class="col-md-4">
                  <label class="dashboard-label">Presentación</label>
                  <select [(ngModel)]="formData.unidad_medida" name="unidad_medida" class="dashboard-select">
                    <option value="unidad">Unidades (u.)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="litro">Litros (l.)</option>
                    <option value="servicio">Servicio (hv)</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="dashboard-modal-footer">
          <button type="button" class="btn-dashboard-secondary" (click)="onClose.emit()" [disabled]="loading">Cancelar</button>
          <button type="submit" 
                  form="productoForm"
                  class="btn-dashboard-primary"
                  [disabled]="loading || !prodForm.valid">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Sincronizando...' : (producto ? 'Aplicar Cambios' : 'Registrar Item') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }

    .dashboard-modal-container {
      background: #ffffff;
      width: 720px;
      max-width: 95vw;
      max-height: 92vh;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(0,0,0,0.15);
      border: 1px solid var(--border-color);
    }

    .dashboard-modal-header {
      padding: 2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f8fafc;
    }

    .header-content { display: flex; flex-direction: column; }
    
    .modal-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--primary-color);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
      margin-top: 0.25rem;
    }

    .btn-modal-close {
      background: #f1f5f9;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-modal-close:hover {
      background: #e2e8f0;
      color: var(--primary-color);
    }

    .dashboard-modal-body {
      padding: 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-section {
      margin-bottom: 2.5rem;
      padding-bottom: 2.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-tag {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--primary-color);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
      opacity: 0.7;
    }

    .dashboard-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.6rem;
      display: block;
    }

    .dashboard-input, .dashboard-select {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 600;
      transition: all 0.15s;
    }

    .dashboard-input:focus, .dashboard-select:focus {
      border-color: var(--primary-color);
      background: white;
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .input-currency-wrapper { position: relative; }
    .input-currency-wrapper i {
       position: absolute;
       left: 1rem;
       top: 50%;
       transform: translateY(-50%);
       color: #94a3b8;
       font-style: normal;
       font-weight: 700;
    }

    .dashboard-modal-footer {
      padding: 1.5rem 2.5rem;
      background: #ffffff;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-dashboard-primary {
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      padding: 0.9rem 2.5rem;
      border-radius: 14px;
      font-weight: 800;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .btn-dashboard-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.2);
    }

    .btn-dashboard-secondary {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.9rem 2.5rem;
      border-radius: 14px;
      font-weight: 700;
      transition: all 0.2s;
    }

    .btn-dashboard-secondary:hover {
        background: #f8fafc;
        color: var(--primary-color);
    }

    .margen-badge-simple {
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .margen-success { background: #ecfdf5; color: #10b981; }
    .margen-warning { background: #fffbeb; color: #f59e0b; }
    .margen-danger { background: #fef2f2; color: #ef4444; }

    .custom-switch .form-check-input {
      width: 2.8em;
      height: 1.5em;
      cursor: pointer;
    }

    .custom-switch .form-check-input:checked {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .bg-light-soft { background: #f8fafc; }

    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    @media (max-width: 600px) {
      .dashboard-modal-container { width: 100%; border-radius: 0; max-height: 100vh; }
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

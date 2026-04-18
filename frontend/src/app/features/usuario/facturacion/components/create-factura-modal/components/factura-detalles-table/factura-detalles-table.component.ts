import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { Producto } from '../../../../../../../domain/models/producto.model';
import { SRI_IVA_TARIFAS } from '../../../../../../../core/constants/sri-iva.constants';
import { FacturaCalculationService } from '../../../../services/factura-calculation.service';
import { PermissionsService } from '../../../../../../../core/auth/permissions.service';
import { PRODUCTOS_PERMISSIONS } from '../../../../../../../constants/permission-codes';

@Component({
  selector: 'app-factura-detalles-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="section-lux mb-4" [formGroup]="parentForm">

      <!-- HEADER: título + buscador + botón nuevo -->
      <div class="d-flex justify-content-between align-items-center mb-3 gap-3">
        <div class="section-title-lux mb-0 flex-shrink-0">
          <i class="bi bi-cart-fill me-2"></i> Detalle de Productos
        </div>

        <div class="d-flex align-items-center gap-2 flex-grow-1 justify-content-end">
          <!-- BUSCADOR -->
          <div class="prod-search-wrapper" style="position:relative; max-width:320px; flex:1;">
            <div class="input-lux-wrapper input-sm">
              <i class="bi bi-search"></i>
              <input type="text"
                     class="input-lux"
                     placeholder="Buscar por código o nombre..."
                     [(ngModel)]="searchTerm"
                     [ngModelOptions]="{standalone: true}"
                     (focus)="isDropdownOpen = true; filterProductos()"
                     (input)="filterProductos()"
                     (click)="$event.stopPropagation()">
              <button type="button" class="btn-clear-search" *ngIf="searchTerm" (click)="clearSearch()">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <!-- Dropdown resultados -->
            <div class="search-results-lux custom-scrollbar" *ngIf="isDropdownOpen && (filteredProductos.length > 0 || searchTerm)" (click)="$event.stopPropagation()">
              <div class="search-item-lux" *ngFor="let p of filteredProductos" (click)="addProductoFromSearch(p)">
                <div class="fw-bold">{{ p.nombre }}</div>
                <div class="small-info">{{ p.codigo }} • {{ p.precio | currency:'USD' }}</div>
              </div>
              <div class="search-item-lux no-results p-3 text-center" *ngIf="filteredProductos.length === 0 && searchTerm">
                <span class="small text-muted">No se encontraron resultados</span>
              </div>
            </div>
          </div>

          <!-- BOTÓN NUEVO PRODUCTO -->
          <button *ngIf="canCreateProducto" type="button" class="btn-create-client-lux btn-sm py-1 px-2 flex-shrink-0" (click)="onCreateProducto.emit()" title="Nuevo Producto">
            <i class="bi bi-plus-circle-fill me-1"></i>
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      <div class="table-responsive rounded-3 overflow-hidden border">
        <table class="table table-lux-white align-middle mb-0">
          <thead>
            <tr>
              <th style="min-width: 220px;">Producto / Descripción</th>
              <th style="width: 90px;" class="text-center">Cant.</th>
              <th style="width: 140px;" class="text-center">P. Unit ($)</th>
              <th style="width: 130px;" class="text-center">Desc. ($)</th>
              <th style="width: 130px;">IVA</th>
              <th style="width: 130px;" class="text-end">Subtotal</th>
              <th style="width: 80px;" class="text-center"></th>
            </tr>
          </thead>
          <tbody formArrayName="detalles">
            <tr *ngFor="let item of getDetallesControls(); let i=index" [formGroupName]="i" class="border-bottom-light">
              <td>
                <div class="d-flex align-items-center gap-1 mb-1">
                  <div class="select-lux-wrapper flex-grow-1">
                    <select class="select-lux input-sm" formControlName="producto_id" (change)="onProductSelect.emit(i)">
                      <option [ngValue]="null">Seleccione Producto...</option>
                      <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                    </select>
                  </div>
                  <button *ngIf="canEditProducto && item.get('producto_id')?.value"
                          type="button"
                          class="btn-edit-prod-small flex-shrink-0"
                          (click)="onEditProducto.emit(getProductoById(item.get('producto_id')?.value))"
                          title="Editar producto">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                </div>
                <input *ngIf="!item.get('producto_id')?.value" type="text"
                       class="input-lux input-sm"
                       placeholder="Descripción manual..."
                       formControlName="descripcion">
              </td>
              <td>
                <input type="text" class="input-lux input-sm text-end"
                       [class.is-invalid]="item.get('cantidad')?.invalid && item.get('cantidad')?.touched"
                       formControlName="cantidad" placeholder="0.00"
                       (keypress)="validateInput($event)"
                       (input)="onInputChange($event, 'cantidad', i)">
              </td>
              <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="text" class="input-lux text-end"
                         [class.is-invalid]="item.get('precio_unitario')?.invalid && item.get('precio_unitario')?.touched"
                         formControlName="precio_unitario" placeholder="0.00"
                         (keypress)="validateInput($event)"
                         (input)="onInputChange($event, 'precio_unitario', i)">
                </div>
              </td>
              <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="text" class="input-lux text-end"
                         [class.is-invalid]="item.get('descuento')?.invalid && item.get('descuento')?.touched"
                         formControlName="descuento" placeholder="0.00"
                         (keypress)="validateInput($event)"
                         (input)="onInputChange($event, 'descuento', i)">
                </div>
              </td>
              <td>
                <div class="select-lux-wrapper">
                  <select class="select-lux input-sm" formControlName="tipo_iva">
                    <option *ngFor="let rate of IVA_RATES" [value]="rate.code" [label]="rate.percentage + '%'">
                      {{ rate.label }}
                    </option>
                  </select>
                </div>
              </td>
              <td class="text-end fw-bold text-dark font-monospace">
                {{ calculateRowTotal(i) | currency:'USD':'symbol':'1.2-2' }}
              </td>
              <td class="text-center">
                <button type="button" class="btn-delete-lux" (click)="onRemove.emit(i)">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="getDetallesControls().length === 0" class="empty-state-lux py-5 text-center">
        <i class="bi bi-bag-plus text-muted mb-3 d-block" style="font-size: 2.5rem;"></i>
        <p class="text-muted small fw-bold mb-0">Busca un producto o agrégalo manualmente</p>
      </div>
    </div>
  `
})
export class FacturaDetallesTableComponent {
  @Input() parentForm!: FormGroup;
  @Input() productos: Producto[] = [];

  readonly IVA_RATES = SRI_IVA_TARIFAS;

  @Output() onAdd = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<number>();
  @Output() onProductSelect = new EventEmitter<number>();
  @Output() onCreateProducto = new EventEmitter<void>();
  @Output() onEditProducto = new EventEmitter<Producto>();

  searchTerm = '';
  isDropdownOpen = false;
  filteredProductos: Producto[] = [];

  private permissionsService = inject(PermissionsService);
  get canCreateProducto(): boolean { return this.permissionsService.hasPermission(PRODUCTOS_PERMISSIONS.CREAR); }
  get canEditProducto(): boolean { return this.permissionsService.hasPermission(PRODUCTOS_PERMISSIONS.EDITAR); }

  constructor(private calculationService: FacturaCalculationService) {
    document.addEventListener('click', () => { this.isDropdownOpen = false; });
  }

  filterProductos() {
    this.isDropdownOpen = true;
    if (!this.searchTerm) { this.filteredProductos = [...this.productos]; return; }
    const term = this.searchTerm.toLowerCase();
    this.filteredProductos = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredProductos = [];
    this.isDropdownOpen = false;
  }

  addProductoFromSearch(producto: Producto) {
    this.onAdd.emit();
    this.searchTerm = '';
    this.isDropdownOpen = false;
    setTimeout(() => {
      const array = this.parentForm.get('detalles') as FormArray;
      if (!array) return;
      const lastIndex = array.length - 1;
      array.at(lastIndex).patchValue({ producto_id: producto.id });
      this.onProductSelect.emit(lastIndex);
    }, 50);
  }

  getProductoById(id: string): Producto | undefined {
    return this.productos.find(p => p.id === id);
  }

  getDetallesControls() {
    const array = this.parentForm.get('detalles') as FormArray;
    return array ? array.controls : [];
  }

  calculateRowTotal(index: number): number {
    const array = this.parentForm.get('detalles') as FormArray;
    if (!array || !array.at(index)) return 0;
    return this.calculationService.calculateRowTotal(array.at(index).value);
  }

  validateInput(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir números (48-57) y punto (46). Bloquear el resto (incluyendo -)
    if (charCode !== 46 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    // No permitir más de un punto via teclado
    const input = event.target as HTMLInputElement;
    if (charCode === 46 && input.value.includes('.')) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onInputChange(event: any, controlName: string, index: number) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // 1. Limpieza de caracteres no permitidos (por si pegan texto)
    value = value.replace(/[^0-9.]/g, '');

    // 2. Solo un punto permitido
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // 3. Limitar a 2 decimales
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }

    // 4. Limite de valor (1,000,000)
    const numeric = parseFloat(value);
    if (!isNaN(numeric) && numeric > 1000000) {
      value = '1000000';
    }

    // Actualizar control sin disparar recursividad infinita si es posible
    const array = this.parentForm.get('detalles') as FormArray;
    const control = array.at(index).get(controlName);
    
    if (control && control.value !== value) {
      control.setValue(value, { emitEvent: true });
      input.value = value;
    }
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FacturasService } from '../../services/facturas.service';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { ProductosService } from '../../../productos/services/productos.service';
import { EstablecimientosService } from '../../../establecimientos/services/establecimientos.service';
import { PuntosEmisionService } from '../../../puntos-emision/services/puntos-emision.service';
import { SriConfigService } from '../../../certificado-sri/services/sri-config.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { Producto } from '../../../../../domain/models/producto.model';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';
import { FacturaCreacion, FacturaDetalleCreacion } from '../../../../../domain/models/factura.model';
import { ConfigSRI } from '../../../certificado-sri/models/sri-config.model';
import { forkJoin, switchMap, tap, catchError, of, filter, take } from 'rxjs';

@Component({
  selector: 'app-create-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop fade show" style="display: block;"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          
          <!-- HEADER -->
          <div class="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
            <div>
                 <h5 class="modal-title fw-bold text-dark d-inline-block me-2">Nueva Factura</h5>
                 <span *ngIf="sriConfig" class="badge rounded-pill" 
                       [ngClass]="sriConfig.ambiente === 'PRODUCCION' ? 'text-bg-success' : 'text-bg-warning'">
                    {{ sriConfig.ambiente }}
                 </span>
            </div>
            <button type="button" class="btn-close" (click)="close()"></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4">
            <form [formGroup]="facturaForm">
              
              <!-- SECCIÓN 1: DATOS DE EMISIÓN -->
              <div class="row g-3 mb-4">
                <div class="col-md-6 col-lg-3">
                  <label class="form-label fw-semibold text-muted small">Establecimiento</label>
                  <select class="form-select" formControlName="establecimiento_id">
                    <option [ngValue]="null" disabled>Seleccione...</option>
                    <option *ngFor="let est of establecimientos" [value]="est.id">{{ est.nombre }} ({{ est.codigo }})</option>
                  </select>
                </div>
                
                <div class="col-md-6 col-lg-3">
                  <label class="form-label fw-semibold text-muted small">Punto de Emisión</label>
                  <select class="form-select" formControlName="punto_emision_id">
                    <option [ngValue]="null" disabled>Seleccione...</option>
                    <option *ngFor="let pto of puntosEmisionFiltered" [value]="pto.id">{{ pto.codigo }}</option>
                  </select>
                </div>

                <div class="col-md-6 col-lg-3">
                  <label class="form-label fw-semibold text-muted small">Fecha Emisión</label>
                  <input type="date" class="form-control" formControlName="fecha_emision">
                </div>

                <div class="col-md-6 col-lg-3">
                  <label class="form-label fw-semibold text-muted small">Cliente</label>
                  <select class="form-select" formControlName="cliente_id">
                    <option [ngValue]="null" disabled>Seleccione Cliente...</option>
                    <option *ngFor="let cli of clientes" [value]="cli.id">{{ cli.razon_social }} ({{ cli.identificacion }})</option>
                  </select>
                </div>

                <div class="col-md-6 col-lg-3">
                  <label class="form-label fw-semibold text-muted small">Forma de Pago</label>
                  <select class="form-select" formControlName="forma_pago_sri">
                    <option value="01">Efectivo</option>
                    <option value="16">Tarjeta de Débito</option>
                    <option value="17">Tarjeta de Crédito</option>
                    <option value="18">Tarjeta Prepago</option>
                    <option value="19">Transferencia/Depósito</option>
                    <option value="20">Otros con Sistema Financiero</option>
                    <option value="15">Compensación de Deudas</option>
                    <option value="21">Endoso de Títulos</option>
                  </select>
                </div>
              </div>

              <!-- SECCIÓN 2: DETALLES PRODUCTOS -->
              <div class="card border-0 bg-light rounded-4 mb-4">
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold mb-0 text-dark">Detalle de Productos</h6>
                    <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" (click)="addDetalle()">
                      <i class="bi bi-plus-lg me-1"></i> Agregar Item
                    </button>
                  </div>

                  <div class="table-responsive">
                    <table class="table table-borderless align-middle mb-0">
                      <thead class="text-muted small text-uppercase">
                        <tr>
                          <th style="min-width: 250px;">Producto / Servicio</th>
                          <th style="width: 100px;">Cant.</th>
                          <th style="width: 120px;">Precio Unit.</th>
                          <th style="width: 120px;">Desc. ($)</th>
                          <th style="width: 100px;">IVA</th>
                          <th style="width: 120px;" class="text-end">Subtotal</th>
                          <th style="width: 50px;"></th>
                        </tr>
                      </thead>
                      <tbody formArrayName="detalles">
                        <tr *ngFor="let item of detalles.controls; let i=index" [formGroupName]="i" class="border-bottom border-light">
                          
                          <!-- Producto Select -->
                          <td>
                            <select class="form-select form-select-sm" formControlName="producto_id" (change)="onProductoSelect(i)">
                              <option [ngValue]="null">Seleccione Producto...</option>
                              <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                            </select>
                            <input *ngIf="!item.get('producto_id')?.value" type="text" 
                                   class="form-control form-control-sm mt-1" 
                                   placeholder="Descripción manual" 
                                   formControlName="descripcion">
                          </td>
                          
                          <!-- Cantidad -->
                          <td>
                            <input type="number" class="form-control form-control-sm" 
                                   formControlName="cantidad" min="1">
                          </td>
                          
                          <!-- Precio -->
                          <td>
                            <div class="input-group input-group-sm">
                              <span class="input-group-text bg-white border-end-0 text-muted">$</span>
                              <input type="number" class="form-control border-start-0 ps-1" 
                                     formControlName="precio_unitario" min="0">
                            </div>
                          </td>

                           <!-- Descuento -->
                           <td>
                            <div class="input-group input-group-sm">
                              <span class="input-group-text bg-white border-end-0 text-muted">$</span>
                              <input type="number" class="form-control border-start-0 ps-1" 
                                     formControlName="descuento" min="0">
                            </div>
                          </td>

                          <!-- IVA Checkbox (Simplificado para UI, backend recibe código) -->
                          <td>
                             <select class="form-select form-select-sm" formControlName="tipo_iva">
                              <option value="0">0%</option>
                              <option value="2">12%</option>
                              <option value="3">14%</option> <!-- Ajustar según vigencia -->
                              <option value="4">15%</option>
                             </select>
                          </td>

                          <!-- Subtotal Row Calc -->
                          <td class="text-end fw-semibold">
                            {{ calculateRowTotal(i) | currency:'USD' }}
                          </td>

                          <!-- Eliminar -->
                          <td class="text-end">
                            <button type="button" class="btn btn-link text-danger p-0" (click)="removeDetalle(i)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div *ngIf="detalles.length === 0" class="text-center py-4 text-muted">
                    <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
                    No hay productos en la factura
                  </div>

                </div>
              </div>

              <!-- SECCIÓN 3: TOTALES Y OBSERVACIONES -->
              <div class="row">
                <div class="col-lg-6">
                  <label class="form-label fw-semibold text-muted small">Observaciones</label>
                  <textarea class="form-control" rows="3" formControlName="observaciones" placeholder="Notas adicionales..."></textarea>
                </div>
                <div class="col-lg-4 offset-lg-2">
                   <div class="bg-white p-3 rounded-4 border border-light">
                      <div class="d-flex justify-content-between mb-2 text-muted">
                        <span>Subtotal Sin IVA</span>
                        <span>{{ totals.subtotal_sin_iva | currency:'USD' }}</span>
                      </div>
                      <div class="d-flex justify-content-between mb-2 text-muted">
                        <span>Subtotal Con IVA</span>
                        <span>{{ totals.subtotal_con_iva | currency:'USD' }}</span>
                      </div>
                       <div class="d-flex justify-content-between mb-2 text-muted">
                        <span>Descuento</span>
                        <span class="text-danger">- {{ totals.descuento | currency:'USD' }}</span>
                      </div>
                      <div class="d-flex justify-content-between mb-2 text-muted">
                        <span>IVA</span>
                        <span>{{ totals.iva | currency:'USD' }}</span>
                      </div>
                      <div class="border-top my-2"></div>
                      <div class="d-flex justify-content-between fw-bold fs-5 text-dark">
                        <span>TOTAL</span>
                        <span>{{ totals.total | currency:'USD' }}</span>
                      </div>
                   </div>
                </div>
              </div>

            </form>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top-0 pt-0 pb-4 pe-4">
             <button type="button" class="btn btn-light rounded-pill px-4" (click)="close()">Cancelar</button>
             <button type="button" class="btn btn-primary-premium rounded-pill px-4 ms-2" 
                     [disabled]="facturaForm.invalid || isSaving || detalles.length === 0"
                     (click)="save()">
               <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
               Guardar Factura
             </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary-premium {
      background: #161d35;
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15);
      transition: all 0.2s;
    }
    .btn-primary-premium:hover {
      background: #252f50;
      transform: translateY(-1px);
    }
    .btn-primary-premium:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .form-label { margin-bottom: 0.25rem; }
    .table > :not(caption) > * > * { padding: 0.75rem 0.5rem; }
    .modal-backdrop { opacity: 0.5; }
  `]
})
export class CreateFacturaModalComponent implements OnInit {
  @Input() facturaId?: string;
  @Output() onClose = new EventEmitter<boolean>();

  facturaForm: FormGroup;
  isSaving = false;

  clientes: Cliente[] = [];
  productos: Producto[] = [];
  establecimientos: Establecimiento[] = [];
  puntosEmision: PuntoEmision[] = [];
  puntosEmisionFiltered: PuntoEmision[] = [];

  sriConfig: ConfigSRI | null = null;

  totals = {
    subtotal_sin_iva: 0,
    subtotal_con_iva: 0,
    descuento: 0,
    iva: 0,
    total: 0
  };

  constructor(
    private fb: FormBuilder,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private establecimientosService: EstablecimientosService,
    private puntosEmisionService: PuntosEmisionService,
    private sriConfigService: SriConfigService,
    private uiService: UiService
  ) {
    this.facturaForm = this.fb.group({
      establecimiento_id: [null, Validators.required],
      punto_emision_id: [{ value: null, disabled: true }, Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      cliente_id: [null, Validators.required],
      forma_pago_sri: ['01', Validators.required],
      observaciones: [''],
      detalles: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupListeners();
  }

  get detalles() {
    return this.facturaForm.get('detalles') as FormArray;
  }

  loadData() {
    console.log('--- INICIANDO CARGA DE CATALOGOS ---');

    // Force refresh first
    this.establecimientosService.refresh();
    this.puntosEmisionService.refresh();

    // Use filter to wait for data (ignore initial empty cache if it exists)
    // We add take(1) to ensure the observable completes for forkJoin
    const waitForData = (obs: any, name: string) => obs.pipe(
      filter((d: any) => d && d.length > 0),
      take(1),
      tap((d: any[]) => console.log(`${name} cargados:`, d.length))
    );

    const reqs = {
      clientes: waitForData(this.clientesService.getClientes(), 'Clientes'),
      productos: waitForData(this.productosService.getProductos(), 'Productos'),
      establecimientos: waitForData(this.establecimientosService.getEstablecimientos(), 'Establecimientos'),
      puntos: waitForData(this.puntosEmisionService.getPuntosEmision(), 'Puntos Emision'),
      sri: this.sriConfigService.obtenerConfiguracion().pipe(tap(d => console.log('SRI Config:', d)), take(1))
    };

    forkJoin(reqs).subscribe({
      next: (resp: any) => {
        console.log('--- DATOS COMPLETOS RECIBIDOS ---', resp);
        this.clientes = resp.clientes as Cliente[];
        this.productos = resp.productos as Producto[];
        this.establecimientos = resp.establecimientos as Establecimiento[];
        this.puntosEmision = resp.puntos as PuntoEmision[];
        this.sriConfig = resp.sri as ConfigSRI;

        // Auto-select establishment if simple
        if (this.establecimientos && this.establecimientos.length === 1) {
          console.log('Auto-seleccionando establecimiento único:', this.establecimientos[0].id);
          this.facturaForm.patchValue({ establecimiento_id: this.establecimientos[0].id });
        }
      },
      error: (err) => {
        console.error('Error loading data', err);
        // Even if error, we might have partial data or empty arrays are valid (e.g. no products yet)
        if (err.name === 'EmptyError') {
          console.warn('Algun catalogo esta vacio, continuando...');
        } else {
          this.uiService.showError(err, 'Error cargando catálogos');
        }
      }
    });
  }

  setupListeners() {
    // Filter Puntos Emisión based on Establecimiento
    this.facturaForm.get('establecimiento_id')?.valueChanges.subscribe(estabId => {
      this.filterPuntosEmision(estabId);
    });

    // Recalculate totals on form changes
    this.facturaForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  filterPuntosEmision(estabId: string) {
    this.puntosEmisionFiltered = this.puntosEmision.filter(pe => pe.establecimiento_id === estabId && pe.activo);

    const ptoControl = this.facturaForm.get('punto_emision_id');
    if (this.puntosEmisionFiltered.length > 0) {
      ptoControl?.enable();
      if (this.puntosEmisionFiltered.length === 1) {
        ptoControl?.setValue(this.puntosEmisionFiltered[0].id);
      } else {
        ptoControl?.setValue(null);
      }
    } else {
      ptoControl?.disable();
      ptoControl?.setValue(null);
    }
  }

  addDetalle() {
    const detalleGroup = this.fb.group({
      producto_id: [null],
      descripcion: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      tipo_iva: ['4', Validators.required]
    });

    this.detalles.push(detalleGroup);
  }

  removeDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  onProductoSelect(index: number) {
    const group = this.detalles.at(index);
    const prodId = group.get('producto_id')?.value;
    const product = this.productos.find(p => p.id === prodId);

    if (product) {
      group.patchValue({
        descripcion: product.nombre,
        precio_unitario: product.precio,
        tipo_iva: this.mapIvaCode(product.porcentaje_iva)
      });
    }
  }

  mapIvaCode(percent: number): string {
    if (percent === 0) return '0';
    if (percent === 12) return '2';
    if (percent === 14) return '3';
    if (percent === 15) return '4';
    return '2';
  }

  getIvaRate(code: string): number {
    switch (code) {
      case '0': return 0;
      case '2': return 0.12;
      case '3': return 0.14;
      case '4': return 0.15;
      default: return 0;
    }
  }

  calculateRowTotal(index: number): number {
    const row = this.detalles.at(index).value;
    const subtotal = (row.cantidad * row.precio_unitario) - (row.descuento || 0);
    return subtotal > 0 ? subtotal : 0;
  }

  calculateTotals() {
    let sub_sin_iva = 0;
    let sub_con_iva = 0;
    let total_desc = 0;
    let total_iva = 0;

    this.detalles.controls.forEach(control => {
      const val = control.value;
      // IMPORTANT: Backend expects GROSS amounts for subtotal groups
      // GROSS Subtotal
      const subtotal_linea_gross = (val.cantidad * val.precio_unitario);

      const descuento_linea = val.descuento || 0;

      // Base Imponible (Net) for Tax Calculation
      const base_imponible = Math.max(0, subtotal_linea_gross - descuento_linea);

      const ivaRate = this.getIvaRate(val.tipo_iva);

      if (ivaRate === 0) {
        sub_sin_iva += subtotal_linea_gross; // Accumulate GROSS
      } else {
        sub_con_iva += subtotal_linea_gross; // Accumulate GROSS
        total_iva += (base_imponible * ivaRate);
      }

      total_desc += descuento_linea;
    });

    // Round intermediates to avoid floating point issues
    sub_sin_iva = Number(sub_sin_iva.toFixed(2));
    sub_con_iva = Number(sub_con_iva.toFixed(2));
    total_desc = Number(total_desc.toFixed(2));
    total_iva = Number(total_iva.toFixed(2));

    const total_final = Number(((sub_sin_iva + sub_con_iva) - total_desc + total_iva).toFixed(2));

    this.totals = {
      subtotal_sin_iva: sub_sin_iva,
      subtotal_con_iva: sub_con_iva,
      descuento: total_desc,
      iva: total_iva,
      total: total_final
    };
  }

  save() {
    if (this.facturaForm.invalid) return;
    this.isSaving = true;

    const formVal = this.facturaForm.getRawValue();

    const nuevaFactura: FacturaCreacion = {
      establecimiento_id: formVal.establecimiento_id,
      punto_emision_id: formVal.punto_emision_id,
      cliente_id: formVal.cliente_id,
      fecha_emision: formVal.fecha_emision,
      observaciones: formVal.observaciones,

      subtotal_sin_iva: Number(this.totals.subtotal_sin_iva.toFixed(2)),
      subtotal_con_iva: Number(this.totals.subtotal_con_iva.toFixed(2)),
      descuento: Number(this.totals.descuento.toFixed(2)),
      iva: Number(this.totals.iva.toFixed(2)),
      total: Number(this.totals.total.toFixed(2)),

      propina: 0,
      retencion_iva: 0,
      retencion_renta: 0,
      ambiente: 1,
      tipo_emision: 1,
      forma_pago_sri: formVal.forma_pago_sri,
      origen: 'MANUAL'
    };

    this.facturasService.crearFactura(nuevaFactura).pipe(
      switchMap((facturaCreada) => {
        const detalles = formVal.detalles.map((d: any) => {
          const product = this.productos.find(p => p.id === d.producto_id);
          const codigo_producto = product?.codigo || 'GENERICO';

          const detalleObs: FacturaDetalleCreacion = {
            producto_id: d.producto_id,
            codigo_producto: codigo_producto,
            nombre: d.descripcion,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento || 0,
            tipo_iva: d.tipo_iva
          };
          return this.facturasService.agregarDetalle(facturaCreada.id, detalleObs);
        });

        return detalles.length > 0 ? forkJoin(detalles) : of([]);
      }),
      tap(() => {
        this.uiService.showToast('Factura creada exitosamente', 'success');
        this.isSaving = false;
        this.onClose.emit(true);
      }),
      catchError(err => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al guardar factura');
        return of(null);
      })
    ).subscribe();
  }

  close() {
    this.onClose.emit(false);
  }
}

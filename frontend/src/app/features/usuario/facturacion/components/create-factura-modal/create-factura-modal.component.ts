import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
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
import { FacturaCreacion, FacturaDetalleCreacion, Factura, FacturaDetalle } from '../../../../../domain/models/factura.model';
import { ConfigSRI } from '../../../certificado-sri/models/sri-config.model';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { forkJoin, switchMap, tap, catchError, of, filter, take, map, Observable } from 'rxjs';

@Component({
  selector: 'app-create-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent],
  template: `
    <div class="modal-backdrop fade show" style="display: block; background-color: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          
          <!-- 1. HEADER: TITULO - AMBIENTE -->
          <div class="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-start">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-header-lux">
                <i class="bi bi-file-earmark-plus-fill"></i>
              </div>
              <div>
                <h5 class="fw-900 mb-1 text-dark" style="letter-spacing: -0.5px;">{{ facturaId ? 'Actualizar Comprobante' : 'Nueva Factura Electrónica' }}</h5>
                <div class="d-flex align-items-center gap-2">
                   <span class="text-muted tiny-cap">Ambiente del SRI</span>
                   <span *ngIf="sriConfig" class="badge-ambiente-lux" 
                         [ngClass]="sriConfig.ambiente === 'PRODUCCION' ? 'ambiente-produccion' : 'ambiente-pruebas'">
                      <div class="dot"></div>
                      {{ sriConfig.ambiente }}
                   </span>
                </div>
              </div>
            </div>
            <button type="button" class="btn-close-lux" (click)="close()">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <!-- 2. CONTENIDO (Cuerpo con scroll) -->
          <div class="modal-body p-4 custom-scrollbar">
            <div *ngIf="isLoadingData" class="text-center py-5">
              <div class="loader-lux-wrapper">
                <div class="spinner-border text-dark" role="status"></div>
                <p class="mt-3 text-muted fw-bold small">Preparando catálogos...</p>
              </div>
            </div>

            <form [formGroup]="facturaForm" *ngIf="!isLoadingData">
              
              <!-- CABECERA UNIFICADA (Cliente, Emisión y Pago) -->
              <div class="section-lux mb-3 py-3">
                <div class="row g-2 align-items-end">
                  
                  <!-- FILA 1: CLIENTE (PRIORIDAD) -->
                  <div class="col-md-12 col-lg-6">
                    <label class="form-label-lux">Cliente / Receptor</label>
                    <div class="select-lux-wrapper">
                      <select class="select-lux input-sm" formControlName="cliente_id">
                        <option [ngValue]="null" disabled>Seleccione Cliente...</option>
                        <option *ngFor="let cli of clientes" [value]="cli.id">{{ cli.razon_social }} ({{ cli.identificacion }})</option>
                      </select>
                    </div>
                  </div>

                  <div class="col-md-6 col-lg-3">
                    <label class="form-label-lux">Establecimiento</label>
                    <div class="select-lux-wrapper">
                      <select class="select-lux input-sm" formControlName="establecimiento_id">
                        <option [ngValue]="null" disabled>Seleccione...</option>
                        <option *ngFor="let est of establecimientos" [value]="est.id">{{ est.nombre }} ({{ est.codigo }})</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="col-md-6 col-lg-3">
                    <label class="form-label-lux">Punto Emisión</label>
                    <div class="select-lux-wrapper">
                      <select class="select-lux input-sm" formControlName="punto_emision_id">
                        <option [ngValue]="null" disabled>Seleccione...</option>
                        <option *ngFor="let pto of puntosEmisionFiltered" [value]="pto.id">{{ pto.codigo }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- FILA 2: FECHA Y PAGO -->
                  <div class="col-md-12 col-lg-3">
                    <label class="form-label-lux">Fecha Emisión</label>
                    <div class="input-lux-wrapper input-sm">
                      <i class="bi bi-calendar-event"></i>
                      <input type="date" class="input-lux" formControlName="fecha_emision">
                    </div>
                  </div>

                  <div class="col-md-12 col-lg-5">
                    <label class="form-label-lux">Forma de Pago SRI</label>
                    <div class="select-lux-wrapper">
                      <select class="select-lux input-sm" formControlName="forma_pago_sri">
                        <option value="01">SIN UTILIZACIÓN DEL SISTEMA FINANCIERO (EFECTIVO)</option>
                        <option value="15">COMPENSACIÓN DE DEUDAS</option>
                        <option value="16">TARJETA DE DÉBITO</option>
                        <option value="17">DINERO ELECTRÓNICO</option>
                        <option value="18">TARJETA PREPAGO</option>
                        <option value="19">TARJETA DE CRÉDITO</option>
                        <option value="20">OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO</option>
                        <option value="21">ENDOSO DE TÍTULOS</option>
                      </select>
                    </div>
                  </div>

                  <div class="col-md-6 col-lg-2" *ngIf="facturaForm.get('forma_pago_sri')?.value !== '01'">
                    <label class="form-label-lux">Plazo</label>
                    <input type="number" class="input-lux input-sm" formControlName="plazo" min="0" placeholder="0">
                  </div>

                  <div class="col-md-6 col-lg-2" *ngIf="facturaForm.get('forma_pago_sri')?.value !== '01'">
                    <label class="form-label-lux">Unidad</label>
                    <div class="select-lux-wrapper">
                      <select class="select-lux input-sm" formControlName="unidad_tiempo">
                        <option value="DIAS">Días</option>
                        <option value="MESES">Meses</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              <!-- DETALLES PRODUCTOS -->
              <div class="section-lux mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="section-title-lux mb-0">
                    <i class="bi bi-cart-fill me-2"></i> Detalle de Productos
                  </div>
                  <button type="button" class="btn btn-add-lux-white" (click)="addDetalle()">
                    <i class="bi bi-plus-lg"></i> Agregar Item
                  </button>
                </div>

                <div class="table-responsive rounded-3 overflow-hidden border">
                  <table class="table table-lux-white align-middle mb-0">
                    <thead>
                      <tr>
                        <th style="min-width: 300px;">Producto / Descripción</th>
                        <th style="width: 100px;">Cant.</th>
                        <th style="width: 140px;">P. Unit ($)</th>
                        <th style="width: 120px;">Desc. ($)</th>
                        <th style="width: 110px;">IVA</th>
                        <th style="width: 140px;" class="text-end">Subtotal</th>
                        <th style="width: 60px;"></th>
                      </tr>
                    </thead>
                    <tbody formArrayName="detalles">
                      <tr *ngFor="let item of detalles.controls; let i=index" [formGroupName]="i" class="border-bottom-light">
                        <td>
                          <div class="select-lux-wrapper">
                            <select class="select-lux input-sm" formControlName="producto_id" (change)="onProductoSelect(i)">
                              <option [ngValue]="null">Seleccione Producto...</option>
                              <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                            </select>
                          </div>
                          <input *ngIf="!item.get('producto_id')?.value" type="text" 
                                 class="input-lux input-sm mt-2" 
                                 placeholder="Descripción manual..." 
                                 formControlName="descripcion">
                        </td>
                        <td>
                          <input type="number" class="input-lux input-sm text-center" 
                                 formControlName="cantidad" min="1">
                        </td>
                        <td>
                          <div class="input-lux-wrapper input-sm">
                            <span class="prefix">$</span>
                            <input type="number" class="input-lux" 
                                   formControlName="precio_unitario" min="0">
                          </div>
                        </td>
                         <td>
                          <div class="input-lux-wrapper input-sm">
                            <span class="prefix">$</span>
                            <input type="number" class="input-lux" 
                                   formControlName="descuento" min="0">
                          </div>
                        </td>
                        <td>
                          <div class="select-lux-wrapper">
                            <select class="select-lux input-sm" formControlName="tipo_iva">
                              <option value="0">0%</option>
                              <option value="2">12%</option>
                              <option value="3">14%</option>
                              <option value="4">15%</option>
                            </select>
                          </div>
                        </td>
                        <td class="text-end fw-bold text-dark fs-6">
                          {{ calculateRowTotal(i) | currency:'USD' }}
                        </td>
                        <td class="text-center">
                          <button type="button" class="btn-delete-lux" (click)="removeDetalle(i)">
                            <i class="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div *ngIf="detalles.length === 0" class="empty-state-lux py-5 text-center">
                  <i class="bi bi-bag-plus text-muted mb-3 d-block" style="font-size: 2.5rem;"></i>
                  <p class="text-muted small fw-bold mb-0">No se han agregado productos a la factura</p>
                </div>
              </div>

              <!-- BOTTOM: TOTALS AND OBS -->
              <div class="row g-4">
                <div class="col-lg-7">
                  <div class="section-lux h-100">
                    <div class="section-title-lux mb-3">Observaciones</div>
                    <textarea class="input-lux" rows="6" formControlName="observaciones" placeholder="Ej: Pago contra entrega, referencia bancaria..."></textarea>
                  </div>
                </div>
                <div class="col-lg-5">
                   <div class="totals-card-lux">
                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small-cap">Subtotal Sin IVA</span>
                        <span class="fw-bold">{{ totals.subtotal_sin_iva | currency:'USD' }}</span>
                      </div>
                      <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small-cap">Subtotal Con IVA</span>
                        <span class="fw-bold">{{ totals.subtotal_con_iva | currency:'USD' }}</span>
                      </div>
                       <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted small-cap">Descuento Total</span>
                        <span class="text-danger fw-bold">- {{ totals.descuento | currency:'USD' }}</span>
                      </div>
                      <div class="d-flex justify-content-between mb-3">
                        <span class="text-muted small-cap">IVA Acumulado</span>
                        <span class="fw-bold text-dark">{{ totals.iva | currency:'USD' }}</span>
                      </div>
                      <div class="total-divider mb-3"></div>
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-900 fs-5 text-dark">TOTAL PAGAR</span>
                        <span class="fw-900 fs-3 text-dark">{{ totals.total | currency:'USD' }}</span>
                      </div>
                   </div>
                </div>
              </div>

            </form>
          </div>

          <!-- 3. FOOTER: BOTONES DE ACCION -->
          <div class="modal-footer border-0 p-4 bg-light-soft">
             <button type="button" class="btn-cancel-lux" (click)="close()">Cancelar</button>
             <button type="button" class="btn-save-lux ms-3" 
                     [disabled]="facturaForm.invalid || isSaving || detalles.length === 0 || isLoadingData"
                     (click)="save()">
               <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
               <i *ngIf="!isSaving" class="bi bi-check-circle-fill me-2"></i>
               {{ facturaId ? 'Actualizar Factura' : 'Guardar Factura' }}
             </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar ítem -->
    <app-confirm-modal
      *ngIf="showConfirmDelete"
      title="¿Eliminar ítem?"
      message="Este ítem contiene datos. Si lo eliminas, se perderá la información ingresada."
      confirmText="Eliminar"
      type="danger"
      (onConfirm)="confirmDelete()"
      (onCancel)="showConfirmDelete = false"
    ></app-confirm-modal>
  `,
  styles: [`
    /* LUX BASE STYLES */
    .fw-900 { font-weight: 900; }
    .tiny-cap { text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.8px; font-weight: 800; }
    .small-cap { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; font-weight: 700; }
    
    .icon-header-lux {
      width: 48px;
      height: 48px;
      background: #161d35;
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .btn-close-lux {
      background: #f1f5f9;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }
    .btn-close-lux:hover { background: #e2e8f0; color: #1e293b; }

    .badge-ambiente-lux {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-ambiente-lux .dot { width: 6px; height: 6px; border-radius: 50%; }
    .ambiente-produccion { background: #ecfdf5; color: #065f46; }
    .ambiente-produccion .dot { background: #10b981; }
    .ambiente-pruebas { background: #fff7ed; color: #9a3412; }
    .ambiente-pruebas .dot { background: #f97316; }

    /* SECTIONS */
    .section-lux {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 18px;
      padding: 1.25rem;
    }
    .section-lux-dark {
      background: #161d35;
      border-radius: 18px;
      padding: 1.25rem;
    }
    .section-title-lux {
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }

    /* FORMS LUX */
    .form-label-lux {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 0.4rem;
      display: block;
    }
    .input-lux-wrapper { position: relative; display: flex; align-items: center; }
    .input-lux-wrapper i { position: absolute; left: 0.85rem; color: #94a3b8; font-size: 0.9rem; }
    .input-lux-wrapper .prefix { position: absolute; left: 0.85rem; color: #94a3b8; font-weight: 600; font-size: 0.85rem; }
    
    .input-lux, .select-lux {
      width: 100%;
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      transition: all 0.2s;
    }
    .input-lux-wrapper .input-lux { padding-left: 2.5rem; }
    .input-lux:focus, .select-lux:focus {
      border-color: #161d35;
      background: white;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .input-sm { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
    .input-lux-wrapper.input-sm .input-lux { padding-left: 1.75rem; }
    .input-lux-wrapper.input-sm .prefix { left: 0.65rem; }

    .select-lux-wrapper { position: relative; }
    .select-lux-wrapper::after {
      content: '▼'; font-size: 0.6rem; color: #94a3b8;
      position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      pointer-events: none;
    }
    .select-lux { appearance: none; padding-right: 2.5rem; }

    /* TABLE WHITE LUX */
    .table-lux-white { color: #1e293b; background: white; }
    .table-lux-white thead th {
      background: #f8fafc;
      border: none;
      padding: 1rem;
      font-size: 0.65rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .table-lux-white tbody td {
      border-bottom: 1px solid #f1f5f9;
      padding: 0.75rem 0.5rem;
    }
    
    .border-bottom-light { border-bottom: 1px solid #f1f5f9; }

    /* BUTTONS LUX */
    .btn-add-lux-white {
      background: #161d35;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.45rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-add-lux-white:hover { background: #232d4b; transform: scale(1.02); }

    .btn-delete-lux {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-delete-lux:hover { background: #ef4444; color: white; }

    .totals-card-lux {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 18px;
      padding: 1.5rem;
    }
    .total-divider { border-top: 2px dashed #e2e8f0; }

    .btn-save-lux {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 800;
      transition: all 0.2s;
    }
    .btn-save-lux:hover:not(:disabled) { background: #232d4b; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15); }
    .btn-save-lux:disabled { background: #cbd5e1; cursor: not-allowed; }

    .btn-cancel-lux {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-cancel-lux:hover { background: #e2e8f0; color: #1e293b; }

    /* UTILS */
    .bg-light-soft { background-color: #fcfdfe; }
    .custom-scrollbar { max-height: 70vh; overflow-y: auto; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class CreateFacturaModalComponent implements OnInit {
  @Input() facturaId?: string;
  @Output() onClose = new EventEmitter<boolean>();

  facturaForm: FormGroup;
  isSaving = false;
  isLoadingData = true;

  // Confirmación de eliminación de ítem
  showConfirmDelete: boolean = false;
  indexToDelete: number | null = null;

  clientes: Cliente[] = [];
  productos: Producto[] = [];
  establecimientos: Establecimiento[] = [];
  puntosEmision: PuntoEmision[] = [];
  puntosEmisionFiltered: PuntoEmision[] = [];

  sriConfig: ConfigSRI | null = null;

  // Guardar detalles originales para edición
  originalDetalles: FacturaDetalle[] = [];

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
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.facturaForm = this.fb.group({
      establecimiento_id: [null, Validators.required],
      punto_emision_id: [{ value: null, disabled: true }, Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      cliente_id: [null, Validators.required],
      forma_pago_sri: ['01', Validators.required],
      estado_pago: ['PENDIENTE', Validators.required],
      plazo: [0],
      unidad_tiempo: ['DIAS'],
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
    this.isLoadingData = true;

    // Force refresh first
    this.establecimientosService.refresh();
    this.puntosEmisionService.refresh();

    const waitForData = (obs: Observable<any[]>, name: string) => obs.pipe(
      filter((d: any) => d !== null && d !== undefined),
      take(1),
      tap((d: any[]) => console.log(`${name} cargados:`, d.length))
    );

    const reqs = {
      clientes: waitForData(this.clientesService.getActivos(), 'Clientes'),
      productos: waitForData(this.productosService.getActivos(), 'Productos'),
      establecimientos: waitForData(this.establecimientosService.getActivos(), 'Establecimientos'),
      puntos: waitForData(this.puntosEmisionService.getActivos(), 'Puntos Emision'),
      sri: this.sriConfigService.obtenerConfiguracion().pipe(take(1))
    };

    forkJoin(reqs).subscribe({
      next: (resp: any) => {
        console.log('Catalogos cargados', resp);
        this.clientes = resp.clientes;
        this.productos = resp.productos;
        this.establecimientos = resp.establecimientos;
        this.puntosEmision = resp.puntos;
        this.sriConfig = resp.sri;

        if (this.facturaId) {
          this.loadFacturaForEdit(this.facturaId);
        } else {
          // Modo creación: Autoseleccionar si solo hay 1 establecimiento
          if (this.establecimientos && this.establecimientos.length === 1) {
            this.facturaForm.patchValue({ establecimiento_id: this.establecimientos[0].id });
          }
          this.isLoadingData = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading data', err);
        // En modo desarrollo a veces los catalogos pueden estar vacios al inicio
        // Si es un error de "EmptyError" de RxJS significa que no emitio nada, lo cual puede pasar si el filtro es estricto
        // Pero si falla la carga completa, no podemos continuar bien.
        if (err.name !== 'EmptyError') {
          this.uiService.showError(err, 'Error cargando catálogos');
        } else {
          // Si falla por vacio, intentamos cargar factura de todas formas si es edicion?
          // No, necesitamos los catalogos para mostrar nombres.
        }
        this.isLoadingData = false;
        this.cd.detectChanges();
      }
    });
  }

  loadFacturaForEdit(id: string) {
    console.log('Cargando factura para editar:', id);
    forkJoin({
      factura: this.facturasService.obtenerFactura(id),
      detalles: this.facturasService.obtenerDetalles(id)
    }).subscribe({
      next: ({ factura, detalles }) => {
        console.log('Factura y detalles cargados', factura, detalles);
        this.originalDetalles = detalles;

        // Parchar cabecera
        this.facturaForm.patchValue({
          establecimiento_id: factura.establecimiento_id,
          // punto_emision: se setea despues al filtrar
          fecha_emision: factura.fecha_emision.split('T')[0],
          cliente_id: factura.cliente_id,
          forma_pago_sri: factura.forma_pago_sri,
          estado_pago: factura.estado_pago || 'PENDIENTE',
          plazo: factura.plazo || 0,
          unidad_tiempo: factura.unidad_tiempo || 'DIAS',
          observaciones: factura.observaciones || ''
        });

        // Trigger filtro puntos y setear punto
        this.filterPuntosEmision(factura.establecimiento_id);

        // Timeout pequeno para asegurar que el control se habilito
        setTimeout(() => {
          this.facturaForm.patchValue({ punto_emision_id: factura.punto_emision_id });
          this.cd.detectChanges();
        }, 50);

        // Cargar detalles
        this.detalles.clear();
        detalles.forEach(d => this.addDetalle(d));

        // Calcular totales iniciales
        setTimeout(() => {
          this.calculateTotals();
          this.isLoadingData = false;
          this.cd.detectChanges();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading factura details', err);
        this.uiService.showError(err, 'Error cargando factura');
        this.close();
      }
    });
  }

  setupListeners() {
    this.facturaForm.get('establecimiento_id')?.valueChanges.subscribe(estabId => {
      this.filterPuntosEmision(estabId);
    });

    this.facturaForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  filterPuntosEmision(estabId: string) {
    this.puntosEmisionFiltered = this.puntosEmision.filter(pe => pe.establecimiento_id === estabId && pe.activo);

    const ptoControl = this.facturaForm.get('punto_emision_id');
    if (this.puntosEmisionFiltered.length > 0) {
      ptoControl?.enable();
      // Solo autoseleccionar si es creacion nueva o si el actual no es valido
      // En modo edicion ya se setea manualmente, pero si cambia establecimiento reseteamos
      const currentVal = ptoControl?.value;
      const exists = this.puntosEmisionFiltered.find(p => p.id === currentVal);

      if (!exists && !this.facturaId) { // Solo auto si NO es edicion (o si cambio y ya no existe)
        if (this.puntosEmisionFiltered.length === 1) {
          ptoControl?.setValue(this.puntosEmisionFiltered[0].id);
        } else {
          ptoControl?.setValue(null);
        }
      }
    } else {
      ptoControl?.disable();
      ptoControl?.setValue(null);
    }
  }

  addDetalle(data?: any) {
    const detalleGroup = this.fb.group({
      producto_id: [data?.producto_id || null],
      descripcion: [data?.descripcion || '', Validators.required],
      cantidad: [data?.cantidad || 1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [data?.precio_unitario || 0, [Validators.required, Validators.min(0)]],
      descuento: [data?.descuento || 0, [Validators.min(0)]],
      tipo_iva: [data?.tipo_iva || '4', Validators.required] // Default 15%
    });

    this.detalles.push(detalleGroup);
  }

  removeDetalle(index: number) {
    const group = this.detalles.at(index);
    const hasData = group.get('producto_id')?.value || 
                   (group.get('descripcion')?.value && group.get('descripcion')?.value !== '') || 
                   group.get('precio_unitario')?.value > 0;

    if (hasData) {
      this.indexToDelete = index;
      this.showConfirmDelete = true;
    } else {
      this.detalles.removeAt(index);
    }
  }

  confirmDelete() {
    if (this.indexToDelete !== null) {
      this.detalles.removeAt(this.indexToDelete);
      this.indexToDelete = null;
    }
    this.showConfirmDelete = false;
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
    return '4'; // Default
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
      const cantidad = parseFloat(val.cantidad) || 0;
      const precio = parseFloat(val.precio_unitario) || 0;
      const descuento_linea = parseFloat(val.descuento) || 0;

      const subtotal_linea_gross = (cantidad * precio);
      const base_imponible = Math.max(0, subtotal_linea_gross - descuento_linea);
      const ivaRate = this.getIvaRate(val.tipo_iva);

      if (ivaRate === 0) {
        sub_sin_iva += subtotal_linea_gross;
      } else {
        sub_con_iva += subtotal_linea_gross;
        total_iva += (base_imponible * ivaRate);
      }

      total_desc += descuento_linea;
    });

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
    console.log('--- INICIANDO GUARDADO DE FACTURA ---');
    console.log('Datos del formulario:', formVal);
    console.log('Totales calculados:', this.totals);

    // Mapping a FacturaCreacion funciona tambien para Actualizacion parcial
    const datosFactura: FacturaCreacion = {
      establecimiento_id: formVal.establecimiento_id,
      punto_emision_id: formVal.punto_emision_id,
      cliente_id: formVal.cliente_id,
      fecha_emision: formVal.fecha_emision,
      estado_pago: formVal.estado_pago,
      observaciones: formVal.observaciones,
      subtotal_sin_iva: Number(this.totals.subtotal_sin_iva.toFixed(2)),
      subtotal_con_iva: Number(this.totals.subtotal_con_iva.toFixed(2)),
      descuento: Number(this.totals.descuento.toFixed(2)),
      iva: Number(this.totals.iva.toFixed(2)),
      total: Number(this.totals.total.toFixed(2)),
      propina: 0,
      retencion_iva: 0,
      retencion_renta: 0,
      ambiente: 1, // Default, sera ignorado en update
      tipo_emision: 1,
      forma_pago_sri: formVal.forma_pago_sri,
      plazo: formVal.forma_pago_sri !== '01' ? formVal.plazo : null,
      unidad_tiempo: formVal.forma_pago_sri !== '01' ? formVal.unidad_tiempo : null,
      origen: 'MANUAL'
    };

    console.log('Payload de factura a enviar:', datosFactura);

    let operacionPrincipal$: Observable<Factura>;

    if (this.facturaId) {
      // EDICION
      console.log('Modo EDICIÓN - ID:', this.facturaId);
      // @ts-ignore - Partial update fix types if needed
      operacionPrincipal$ = this.facturasService.actualizarFactura(this.facturaId, datosFactura).pipe(
        switchMap((facturaActualizada) => {
          console.log('Factura actualizada (cabecera):', facturaActualizada);
          // 1. Eliminar todos los detalles anteriores (para luego insertar los nuevos)
          // Esta es la estrategia mas segura vs hacer diff
          console.log('Eliminando detalles anteriores...', this.originalDetalles.length);
          const deleteObs = this.originalDetalles.map(d => this.facturasService.eliminarDetalle(d.id));
          return (deleteObs.length > 0 ? forkJoin(deleteObs) : of([])).pipe(
            map(() => {
              console.log('Detalles anteriores eliminados');
              return facturaActualizada;
            })
          );
        })
      );
    } else {
      // CREACION
      console.log('Modo CREACIÓN');
      operacionPrincipal$ = this.facturasService.crearFactura(datosFactura).pipe(
        tap(f => console.log('Factura creada (cabecera):', f))
      );
    }

    operacionPrincipal$.pipe(
      switchMap((factura) => {
        // Guardar nuevos detalles
        console.log('Procesando nuevos detalles:', formVal.detalles.length);
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
          return this.facturasService.agregarDetalle(factura.id, detalleObs);
        });

        return detalles.length > 0 ? forkJoin(detalles) : of([]);
      }),
      tap((resDetalles) => {
        console.log('Detalles guardados exitosamente:', resDetalles);
        const msg = this.facturaId ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente';
        this.uiService.showToast(msg, 'success');
        this.isSaving = false;
        this.onClose.emit(true);
      }),
      catchError(err => {
        console.error('ERROR EN PROCESO DE GUARDADO:', err);
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

import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, ChangeDetectorRef, ViewEncapsulation, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FacturasService } from '../../services/facturas.service';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { ProductosService } from '../../../productos/services/productos.service';
import { EstablecimientosService } from '../../../establecimientos/services/establecimientos.service';
import { PuntosEmisionService } from '../../../puntos-emision/services/puntos-emision.service';
import { FacturacionProgramadaService } from '../../../facturacion-recurrente/services/facturacion-programada.service';
import { SriConfigService } from '../../../certificado-sri/services/sri-config.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { FACTURAS_PERMISSIONS } from '../../../../../constants/permission-codes';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { Producto } from '../../../../../domain/models/producto.model';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';
import { FacturaCreacion, FacturaDetalleCreacion, Factura, FacturaDetalle } from '../../../../../domain/models/factura.model';
import { ConfigSRI } from '../../../certificado-sri/models/sri-config.model';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { forkJoin, switchMap, tap, catchError, of, filter, take, map, Observable, fromEvent, Subject, takeUntil } from 'rxjs';
import { CreateClienteModalComponent } from '../../../clientes/components/create-cliente-modal/create-cliente-modal.component';

import { FacturaClienteHeaderComponent } from './components/factura-cliente-header/factura-cliente-header.component';
import { FacturaEmisionHeaderComponent } from './components/factura-emision-header/factura-emision-header.component';
import { FacturaDetallesTableComponent } from './components/factura-detalles-table/factura-detalles-table.component';
import { FacturaRecurrenteConfigComponent } from './components/factura-recurrente-config/factura-recurrente-config.component';
import { FacturaTotalesPanelComponent } from './components/factura-totales-panel/factura-totales-panel.component';

@Component({
  selector: 'app-create-factura-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent, CreateClienteModalComponent,
    FacturaClienteHeaderComponent, FacturaEmisionHeaderComponent, FacturaDetallesTableComponent, 
    FacturaRecurrenteConfigComponent, FacturaTotalesPanelComponent
  ],
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
              
              <!-- CABECERA DE FACTURACIÓN REDISEÑADA (Dos Columnas) -->
              <div class="row g-3 mb-4">
                <div class="col-lg-6">
                  <app-factura-cliente-header
                    [parentForm]="facturaForm"
                    [clientes]="clientes"
                    (openCreateClienteModal)="openCreateClienteModal()"
                    (openEditClienteModal)="openEditClienteModal($event)">
                  </app-factura-cliente-header>
                </div>

                <div class="col-lg-6">
                  <app-factura-emision-header
                    [parentForm]="facturaForm"
                    [establecimientos]="establecimientos"
                    [puntosEmisionFiltered]="puntosEmisionFiltered">
                  </app-factura-emision-header>
                </div>
              </div>

              <!-- DETALLES PRODUCTOS -->
              <app-factura-detalles-table
                [parentForm]="facturaForm"
                [productos]="productos"
                (onAdd)="addDetalle()"
                (onRemove)="removeDetalle($event)"
                (onProductSelect)="onProductoSelect($event)">
              </app-factura-detalles-table>

              <!-- BOTTOM: TOTALS AND OBS -->
              <div class="row g-4">
                <div class="col-lg-7">
                  <div class="section-lux h-100">
                    <div class="section-title-lux mb-3">Observaciones</div>
                    <textarea class="input-lux" rows="6" formControlName="observaciones" placeholder="Ej: Pago contra entrega, referencia bancaria..."></textarea>
                  </div>
                </div>
                <div class="col-lg-5">
                   <app-factura-recurrente-config
                     [mode]="mode"
                     [parentForm]="facturaForm">
                   </app-factura-recurrente-config>

                   <app-factura-totales-panel
                     [totals]="totals">
                   </app-factura-totales-panel>
                </div>
              </div>

            </form>
          </div>

          <!-- 3. FOOTER: BOTONES DE ACCION -->
          <div class="modal-footer border-0 p-4 bg-light-soft">
             <button type="button" class="btn-cancel-lux" (click)="close()">{{ isViewOnly ? 'Cerrar' : 'Cancelar' }}</button>
             <button type="button" class="btn-save-lux ms-3"
                     *ngIf="!isViewOnly"
                     [disabled]="facturaForm.invalid || isSaving || detalles.length === 0 || isLoadingData || !canSave"
                     [title]="!canSave ? 'No tienes permisos para ' + (facturaId ? 'editar' : 'crear') + ' facturas' : ''"
                     (click)="save()">
               <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
               <i *ngIf="!isSaving" class="bi bi-check-circle-fill me-2"></i>
               {{ facturaId ? 'Actualizar Factura' : 'Guardar Factura' }}
             </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal Cliente Nuevo/Edición -->
    <app-create-cliente-modal
      *ngIf="showCreateClienteModal"
      [cliente]="clienteParaEditar"
      [loading]="isCreatingCliente"
      (onSave)="handleClienteSave($event)"
      (onClose)="closeClienteModal()"
    ></app-create-cliente-modal>

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

    /* SEARCH SELECT STYLES */
    .search-select-lux-wrapper { position: relative; }
    .search-results-lux {
      position: absolute; top: 100%; left: 0; width: 100%;
      background: white; border: 1px solid #f1f5f9; border-radius: 12px;
      margin-top: 5px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      max-height: 250px; overflow-y: auto; z-index: 1000;
    }
    .search-item-lux {
      padding: 0.75rem 1rem; cursor: pointer; transition: all 0.2s;
    }
    .search-item-lux:hover { background: #f8fafc; }
    .search-item-lux .small-info { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }
    .btn-clear-search {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: #94a3b8; font-size: 1.1rem;
    }
    .btn-create-client-lux {
      background: white; border: 1.5px solid #f1f5f9; border-radius: 12px;
      padding: 0.45rem 0.85rem; height: 38px; display: flex; align-items: center; gap: 0.5rem;
      color: #161d35; font-weight: 700; font-size: 0.75rem; transition: all 0.2s;
    }
    .btn-create-client-lux:hover { background: #f1f5f9; transform: translateY(-2px); border-color: #cbd5e1; }
    .btn-create-client-lux i { font-size: 1rem; color: #161d35; }

    .btn-edit-client-small {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-edit-client-small:hover {
      background: #f1f5f9;
      color: #161d35;
      border-color: #cbd5e1;
    }

    .border-dashed {
      border-style: dashed !important;
      border-width: 2px !important;
    }
    .bg-white-10 { background: rgba(255,255,255,0.1) !important; }
    .text-white-50 { color: rgba(255,255,255,0.7) !important; }
    .border-white-10 { border-color: rgba(255,255,255,0.1) !important; }
  `]
})
export class CreateFacturaModalComponent implements OnInit, OnChanges {
  @Input() facturaId?: string;
  @Input() mode: 'NORMAL' | 'RECURRENTE' = 'NORMAL';
  @Input() programacionId?: string;
  @Input() isViewOnly: boolean = false;
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
    subtotal_no_objeto_iva: 0,
    subtotal_exento_iva: 0,
    descuento: 0,
    iva: 0,
    ice: 0,
    total: 0
  };


  // Cliente Modal properties
  showCreateClienteModal = false;
  isCreatingCliente = false;
  clienteParaEditar: Cliente | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private establecimientosService: EstablecimientosService,
    private puntosEmisionService: PuntosEmisionService,
    private programacionService: FacturacionProgramadaService,
    private sriConfigService: SriConfigService,
    private uiService: UiService,
    private permissionsService: PermissionsService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.facturaForm = this.fb.group({
      establecimiento_id: [null, Validators.required],
      punto_emision_id: [{ value: null, disabled: true }, Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      cliente_id: [null, Validators.required],
      forma_pago_sri: ['01', Validators.required],
      estado_pago: ['PENDIENTE', Validators.required],
      guia_remision: [null, [Validators.pattern(/^\d{3}-\d{3}-\d{9}$/)]],
      plazo: [0],
      unidad_tiempo: ['DIAS'],
      observaciones: [''],
      ice: [0],
      // Campos extra para recurrencia
      tipo_frecuencia: ['MENSUAL'],
      dia_emision: [new Date().getDate(), [Validators.min(1), Validators.max(31)]],
      fecha_inicio: [new Date().toISOString().split('T')[0]],
      fecha_fin: [null],
      detalles: this.fb.array([])
    });
  }

  ngOnInit() {
    // VALIDACIÓN 1: Guardia - Verificar permisos al abrir el modal
    if (!this.isViewOnly) {
      const isCreating = !this.facturaId;
      const requiredPermission = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;

      if (!this.permissionsService.hasPermission(requiredPermission)) {
        this.uiService.showToast(
          isCreating
            ? 'No tienes permisos para crear facturas'
            : 'No tienes permisos para editar facturas',
          'warning'
        );
        this.close();
        return;
      }
    }

    this.loadData();
    this.setupListeners();

    if (this.isViewOnly) {
      this.facturaForm.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si facturaId llega tarde (modal abierto antes de resolver la plantilla),
    // y los catálogos ya terminaron de cargar, recargar con el ID disponible.
    if (changes['facturaId'] && !changes['facturaId'].firstChange && changes['facturaId'].currentValue) {
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  get detalles() {
    return this.facturaForm.get('detalles') as FormArray;
  }

  // VALIDACIÓN 3: UX - Getter para deshabilitación de botón según permisos
  get canSave(): boolean {
    if (this.isViewOnly) return false;

    const isCreating = !this.facturaId;
    const requiredPermission = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;

    return this.permissionsService.hasPermission(requiredPermission);
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

    const reqs: any = {
      clientes: waitForData(this.clientesService.getActivos(), 'Clientes'),
      productos: waitForData(this.productosService.getActivos(), 'Productos'),
      establecimientos: waitForData(this.establecimientosService.getActivos(), 'Establecimientos'),
      puntos: waitForData(this.puntosEmisionService.getActivos(), 'Puntos Emision'),
      sri: this.sriConfigService.obtenerConfiguracion().pipe(take(1))
    };

    if (this.facturaId) {
      console.log('Solicitando datos de factura simultáneamente:', this.facturaId);
      reqs.factura = this.facturasService.obtenerFactura(this.facturaId);
      reqs.facturaDetalles = this.facturasService.obtenerDetalles(this.facturaId);
    }

    forkJoin(reqs).subscribe({
      next: (resp: any) => {
        console.log('Datos consolidados cargados', resp);
        this.clientes = resp.clientes;
        this.productos = resp.productos;
        this.establecimientos = resp.establecimientos;
        this.puntosEmision = resp.puntos;
        this.sriConfig = resp.sri;

        if (this.facturaId && resp.factura && resp.facturaDetalles) {
          this.processFacturaForEdit(resp.factura, resp.facturaDetalles);
        } else {
          // Modo creación: Autoseleccionar si solo hay 1 establecimiento
          if (this.establecimientos && this.establecimientos.length === 1) {
            this.facturaForm.patchValue({ establecimiento_id: this.establecimientos[0].id });
          }
          this.isLoadingData = false;
          this.cd.detectChanges();
        }

        // Si tenemos programacionId, cargar sus datos (frecuencia, etc)
        if (this.programacionId && this.mode === 'RECURRENTE') {
          this.loadProgramacionData(this.programacionId);
        }
      },
      error: (err) => {
        console.error('Error loading data', err);
        if (err.name !== 'EmptyError') {
          this.uiService.showError(err, 'Error cargando datos para el formulario');
        }
        this.isLoadingData = false;
        this.cd.detectChanges();
      }
    });
  }

  processFacturaForEdit(factura: any, detalles: FacturaDetalle[]) {
    console.log('Procesando Factura y detalles cargados', factura, detalles);
    this.originalDetalles = detalles;

    // Parchar cabecera
    this.facturaForm.patchValue({
      establecimiento_id: factura.establecimiento_id,
      // punto_emision: se setea despues al filtrar
      fecha_emision: factura.fecha_emision.split('T')[0],


          cliente_id: factura.cliente_id,
          forma_pago_sri: factura.forma_pago_sri,
          estado_pago: factura.estado_pago || 'PENDIENTE',
          guia_remision: factura.guia_remision,
          plazo: factura.plazo || 0,
          unidad_tiempo: factura.unidad_tiempo || 'DIAS',
          observaciones: factura.observaciones || '',
          ice: factura.ice || 0
        });


        // Trigger filtro puntos y setear punto
        this.filterPuntosEmision(factura.establecimiento_id);

        // Timeout pequeno para asegurar que el control se habilito
        setTimeout(() => {
          this.ngZone.run(() => {
            this.facturaForm.patchValue({ punto_emision_id: factura.punto_emision_id });
            this.cd.detectChanges();
          });
        }, 50);

        // Cargar detalles
        this.detalles.clear();
        detalles.forEach(d => this.addDetalle(d));

        // Calcular totales iniciales
        setTimeout(() => {
          this.ngZone.run(() => {
            this.calculateTotals();
            this.isLoadingData = false;
            this.cd.detectChanges();
          });
        }, 100);
      }


  loadProgramacionData(id: string) {
    this.programacionService.listar().subscribe(progs => {
      const prog = progs.find(p => p.id === id);
      if (prog) {
        this.facturaForm.patchValue({
          tipo_frecuencia: prog.tipo_frecuencia,
          dia_emision: prog.dia_emision,
          fecha_inicio: prog.fecha_inicio,
          fecha_fin: prog.fecha_fin
        });
        if (this.isViewOnly) this.facturaForm.disable();
        this.cd.detectChanges();
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





  // --- CLIENT MODAL LOGIC ---
  openCreateClienteModal() {
    this.clienteParaEditar = null;
    this.showCreateClienteModal = true;
  }

  openEditClienteModal(cliente: Cliente) {
    this.clienteParaEditar = { ...cliente };
    this.showCreateClienteModal = true;
  }

  closeClienteModal() {
    this.showCreateClienteModal = false;
    this.clienteParaEditar = null;
  }

  handleClienteSave(clienteData: any) {
    this.isCreatingCliente = true;

    if (this.clienteParaEditar) {
      this.clientesService.updateCliente(this.clienteParaEditar.id, clienteData).subscribe({
        next: (resp) => {
          const updated = resp.detalles;
          if (updated) {
            this.uiService.showToast('Cliente actualizado exitosamente', 'success');
            // Actualizar en la lista local y clonar para Change Detection
            const index = this.clientes.findIndex(c => c.id === updated.id);
            if (index !== -1) {
              const newClientes = [...this.clientes];
              newClientes[index] = updated;
              this.clientes = newClientes;
            }
            this.facturaForm.patchValue({ cliente_id: updated.id });
          }
          this.isCreatingCliente = false;
          this.showCreateClienteModal = false;
          this.clienteParaEditar = null;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al actualizar cliente');
          this.isCreatingCliente = false;
        }
      });
    } else {
      // MODO CREACIÓN
      this.clientesService.createCliente(clienteData).subscribe({
        next: (resp) => {
          const nuevoCliente = resp.detalles;
          if (nuevoCliente) {
            this.uiService.showToast('Cliente creado exitosamente', 'success');
            if (!this.clientes.find(c => c.id === nuevoCliente.id)) {
              this.clientes = [...this.clientes, nuevoCliente];
            }
            this.facturaForm.patchValue({ cliente_id: nuevoCliente.id });
          }
          this.isCreatingCliente = false;
          this.showCreateClienteModal = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al crear cliente');
          this.isCreatingCliente = false;
        }
      });
    }
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
      precio_unitario: [data?.precio_unitario || 0, [Validators.required, Validators.min(0.01)]],
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
    return '4'; // Default 15% (SRI Code '10')
  }

  getIvaRate(code: string): number {
    switch (code) {
      case '0': return 0;
      case '4': return 0.15;
      case '6': return 0; // No objeto
      case '7': return 0; // Exento
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
    let sub_no_objeto = 0;
    let sub_exento = 0;
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

      if (val.tipo_iva === '0') {
        sub_sin_iva += subtotal_linea_gross;
      } else if (val.tipo_iva === '4') {
        sub_con_iva += subtotal_linea_gross;
        total_iva += (base_imponible * ivaRate);
      } else if (val.tipo_iva === '6') {
        sub_no_objeto += subtotal_linea_gross;
      } else if (val.tipo_iva === '7') {
        sub_exento += subtotal_linea_gross;
      }

      total_desc += descuento_linea;
    });

    const ice_total = parseFloat(this.facturaForm.get('ice')?.value) || 0;

    this.totals.subtotal_sin_iva = Number(sub_sin_iva.toFixed(2));
    this.totals.subtotal_con_iva = Number(sub_con_iva.toFixed(2));
    this.totals.subtotal_no_objeto_iva = Number(sub_no_objeto.toFixed(2));
    this.totals.subtotal_exento_iva = Number(sub_exento.toFixed(2));
    this.totals.descuento = Number(total_desc.toFixed(2));
    this.totals.iva = Number(total_iva.toFixed(2));
    this.totals.ice = Number(ice_total.toFixed(2));

    // Total = bases + iva + ice + propina (0 por ahora) - descuento - retenciones (0 en creación)
    const grand_total = (
      this.totals.subtotal_sin_iva + 
      this.totals.subtotal_con_iva + 
      this.totals.subtotal_no_objeto_iva + 
      this.totals.subtotal_exento_iva + 
      this.totals.iva + 
      this.totals.ice
    ) - 0; // Menos descuento ya está implícito en el cálculo de las bases según lógica SRI a veces, 
           // pero aquí las bases sub_* son gross. 
           // La lógica de backend es: total = bases + iva + ice + propina - descuento - retenciones.
    
    this.totals.total = Number((grand_total - this.totals.descuento).toFixed(2));
  }

  save() {
    if (this.facturaForm.invalid) return;

    // VALIDACIÓN 2: Guardar - Doble verificación de permisos antes de POST
    const isCreating = !this.facturaId;
    const requiredPermission = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;

    if (!this.permissionsService.hasPermission(requiredPermission)) {
      this.uiService.showError(
        isCreating
          ? 'Permiso denegado: No puedes crear facturas'
          : 'Permiso denegado: No puedes editar facturas',
        'error'
      );
      return;
    }

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
      subtotal_no_objeto_iva: Number(this.totals.subtotal_no_objeto_iva.toFixed(2)),
      subtotal_exento_iva: Number(this.totals.subtotal_exento_iva.toFixed(2)),
      descuento: Number(this.totals.descuento.toFixed(2)),
      iva: Number(this.totals.iva.toFixed(2)),
      ice: Number(this.totals.ice.toFixed(2)),
      total: Number(this.totals.total.toFixed(2)),
      propina: 0,
      retencion_iva: 0,
      retencion_renta: 0,
      ambiente: 1, 
      tipo_emision: 1,
      forma_pago_sri: formVal.forma_pago_sri,
      guia_remision: formVal.guia_remision,
      plazo: formVal.forma_pago_sri !== '01' ? formVal.plazo : null,
      unidad_tiempo: formVal.forma_pago_sri !== '01' ? formVal.unidad_tiempo : null,
      origen: 'MANUAL',
      // Mapeamos los detalles para que incluyan campos obligatorios del backend
      detalles: (formVal.detalles || []).map((d: any) => {
        const prod = this.productos.find(p => p.id === d.producto_id);
        return {
          ...d,
          codigo_producto: prod?.codigo || '000',
          nombre: prod?.nombre || d.descripcion || 'Producto',
          descripcion: d.descripcion || prod?.nombre || ''
        };
      })
    };

    console.log('Payload de factura a enviar:', datosFactura);

    if (this.mode === 'RECURRENTE') {
      if (this.facturaId && this.programacionId) {
        // --- MODO RECURRENTE: EDICIÓN ---
        console.log('Modo RECURRENTE - EDICIÓN');
        
        const payloadProgramacion = {
          tipo_frecuencia: formVal.tipo_frecuencia,
          dia_emision: formVal.dia_emision,
          fecha_inicio: formVal.fecha_inicio,
          fecha_fin: formVal.fecha_fin,
          concepto: datosFactura.detalles.map((d: any) => d.nombre).join(', ')
        };

        // 1. Actualizar Programación + 2. Actualizar Factura (Cabecera y Detalles)
        forkJoin({
          prog: this.programacionService.actualizar(this.programacionId, payloadProgramacion),
          factura: this.facturasService.actualizarFactura(this.facturaId, datosFactura).pipe(
            switchMap(f => {
              // Borrar detalles viejos e insertar nuevos (estabilizado)
              const deleteObs = this.originalDetalles.map(d => this.facturasService.eliminarDetalle(d.id));
              const saveNewObs = formVal.detalles.map((d: any) => {
                const product = this.productos.find(p => p.id === d.producto_id);
                return this.facturasService.agregarDetalle(f.id, {
                  producto_id: d.producto_id,
                  codigo_producto: product?.codigo || 'GENERICO',
                  nombre: d.descripcion,
                  descripcion: d.descripcion,
                  cantidad: d.cantidad,
                  precio_unitario: d.precio_unitario,
                  descuento: d.descuento || 0,
                  tipo_iva: d.tipo_iva
                });
              });
              return (deleteObs.length > 0 ? forkJoin(deleteObs) : of([])).pipe(
                switchMap(() => saveNewObs.length > 0 ? forkJoin(saveNewObs) : of([]))
              );
            })
          )
        }).subscribe({
          next: () => {
            this.uiService.showToast('Configuración y factura actualizadas correctamente', 'success');
            this.isSaving = false;
            this.onClose.emit(true);
          },
          error: (err) => {
            this.isSaving = false;
            this.uiService.showError(err, 'Error al actualizar programación recurrente');
          }
        });
      } else {
        // --- MODO RECURRENTE: CREACIÓN ---
        const payloadUnificado = {
          programacion: {
            cliente_id: formVal.cliente_id,
            tipo_frecuencia: formVal.tipo_frecuencia,
            dia_emision: formVal.dia_emision,
            monto: this.totals.total,
            concepto: datosFactura.detalles.map((d: any) => d.nombre).join(', '),
            fecha_inicio: formVal.fecha_inicio,
            fecha_fin: formVal.fecha_fin,
            activo: true
          },
          factura_plantilla: datosFactura
        };

        this.programacionService.crearUnificada(payloadUnificado).subscribe({
          next: () => {
            this.uiService.showToast('Programación recurrente creada exitosamente', 'success');
            this.isSaving = false;
            this.onClose.emit(true);
          },
          error: (err) => {
            this.isSaving = false;
            this.uiService.showError(err, 'Error al crear programación');
          }
        });
      }
      return;
    }

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
        // IMPORTANTE: Si es una creación nueva (!facturaId), el backend ya guardó los detalles
        // que enviamos en el payload inicial. Guardarlos aquí de nuevo causaría duplicidad.
        if (!this.facturaId) {
          return of(factura);
        }

        // Si es una EDICIÓN, el backend actual solo actualiza la cabecera, así que 
        // aquí guardamos los "nuevos" detalles (luego de haber borrado los anteriores arriba)
        console.log('Procesando nuevos detalles para edición:', formVal.detalles.length);
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

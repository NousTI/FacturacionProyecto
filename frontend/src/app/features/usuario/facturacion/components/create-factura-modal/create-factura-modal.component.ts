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
import { FACTURAS_PERMISSIONS, FACTURACION_PROGRAMADA_PERMISSIONS } from '../../../../../constants/permission-codes';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { Producto } from '../../../../../domain/models/producto.model';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';
import { FacturaCreacion, FacturaDetalleCreacion, Factura, FacturaDetalle } from '../../../../../domain/models/factura.model';
import { ConfigSRI } from '../../../certificado-sri/models/sri-config.model';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { forkJoin, switchMap, tap, catchError, of, filter, take, map, Observable, fromEvent, Subject, takeUntil } from 'rxjs';
import { ClienteFormModalComponent } from '../../../clientes/components/modals/cliente-form-modal.component';
import { ProductoFormModalComponent } from '../../../productos/components/modals/producto-form-modal.component';
import { FacturaCalculationService } from '../../services/factura-calculation.service';

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
    CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent, ClienteFormModalComponent,
    ProductoFormModalComponent,
    FacturaClienteHeaderComponent, FacturaEmisionHeaderComponent, FacturaDetallesTableComponent,
    FacturaRecurrenteConfigComponent, FacturaTotalesPanelComponent
  ],
  templateUrl: './create-factura-modal.component.html',
  styleUrl: './create-factura-modal.component.css'
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

  // Producto Modal properties
  showCreateProductoModal = false;
  isCreatingProducto = false;
  productoParaEditar: Producto | null = null;

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
    public permissionsService: PermissionsService,
    private calculationService: FacturaCalculationService,
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
      
      // Permisos de Facturación Normal
      const hasFacturaPerm = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;
      
      // Permisos de Facturación Programada (Recurrente)
      const hasRecurrentePerm = isCreating ? FACTURACION_PROGRAMADA_PERMISSIONS.CREAR : FACTURACION_PROGRAMADA_PERMISSIONS.EDITAR;

      // Se permite el acceso si tiene el permiso de factura normal 
      // O si está en modo recurrente y tiene el permiso de programación
      const canAccess = this.permissionsService.hasPermission(hasFacturaPerm) || 
                       (this.mode === 'RECURRENTE' && this.permissionsService.hasPermission(hasRecurrentePerm));

      if (!canAccess) {
        this.uiService.showToast(
          'No tienes permisos suficientes para realizar esta acción',
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
    
    // Permisos Normales vs Recurrentes
    const hasFacturaPerm = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;
    const hasRecurrentePerm = isCreating ? FACTURACION_PROGRAMADA_PERMISSIONS.CREAR : FACTURACION_PROGRAMADA_PERMISSIONS.EDITAR;

    const hasValidPermission = this.permissionsService.hasPermission(hasFacturaPerm) || 
                              (this.mode === 'RECURRENTE' && this.permissionsService.hasPermission(hasRecurrentePerm));
    
    const hasPositiveTotal = this.totals.total > 0;

    return hasValidPermission && hasPositiveTotal;
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

  openCreateProductoModal() {
    this.productoParaEditar = null;
    this.showCreateProductoModal = true;
  }

  openEditProductoModal(producto: Producto | undefined) {
    if (!producto) return;
    this.productoParaEditar = { ...producto };
    this.showCreateProductoModal = true;
  }

  closeProductoModal() {
    this.showCreateProductoModal = false;
    this.productoParaEditar = null;
  }

  handleProductoSave(productoData: any) {
    this.isCreatingProducto = true;
    const op = this.productoParaEditar
      ? this.productosService.updateProducto(this.productoParaEditar.id, productoData)
      : this.productosService.createProducto(productoData);

    op.subscribe({
      next: (resp: any) => {
        const saved = resp?.detalles ?? resp;
        this.uiService.showToast(this.productoParaEditar ? 'Producto actualizado' : 'Producto creado exitosamente', 'success');
        if (saved) {
          if (this.productoParaEditar) {
            const idx = this.productos.findIndex(p => p.id === saved.id);
            if (idx !== -1) { const arr = [...this.productos]; arr[idx] = saved; this.productos = arr; }
          } else {
            if (!this.productos.find(p => p.id === saved.id)) this.productos = [...this.productos, saved];
          }
        }
        this.isCreatingProducto = false;
        this.showCreateProductoModal = false;
        this.productoParaEditar = null;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.uiService.showError(err, 'Error al guardar producto');
        this.isCreatingProducto = false;
      }
    });
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
    const decimalPattern = '^[0-9]+(\\.[0-9]{1,2})?$';
    const detailMax = 1000000;
    
    const detalleGroup = this.fb.group({
      producto_id: [data?.producto_id || null],
      descripcion: [data?.descripcion || '', Validators.required],
      cantidad: [data?.cantidad || 1, [
        Validators.required, 
        Validators.min(0.01),
        Validators.max(detailMax),
        Validators.pattern(decimalPattern)
      ]],
      precio_unitario: [data?.precio_unitario || 0, [
        Validators.required, 
        Validators.min(0.01),
        Validators.max(detailMax),
        Validators.pattern(decimalPattern)
      ]],
      descuento: [data?.descuento || 0, [
        Validators.min(0),
        Validators.max(detailMax),
        Validators.pattern(decimalPattern)
      ]],
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
    const map: Record<number, string> = { 0: '0', 5: '5', 8: '8', 12: '2', 13: '10', 14: '3', 15: '4' };
    return map[percent] ?? '4';
  }

  calculateTotals() {
    const iceValue = parseFloat(this.facturaForm.get('ice')?.value) || 0;
    this.totals = this.calculationService.calculateTotals(this.detalles.value, iceValue);
  }

  save() {
    if (this.facturaForm.invalid) return;

    // VALIDACIÓN 2: Guardar - Doble verificación de permisos antes de POST
    const isCreating = !this.facturaId;
    
    // Permisos de Facturación Normal
    const hasFacturaPerm = isCreating ? FACTURAS_PERMISSIONS.CREAR : FACTURAS_PERMISSIONS.EDITAR;
    
    // Permisos de Facturación Programada (Recurrente)
    const hasRecurrentePerm = isCreating ? FACTURACION_PROGRAMADA_PERMISSIONS.CREAR : FACTURACION_PROGRAMADA_PERMISSIONS.EDITAR;

    // Se permite guardar si tiene el permiso de factura normal 
    // O si está en modo recurrente y tiene el permiso de programación
    const canSave = this.permissionsService.hasPermission(hasFacturaPerm) || 
                   (this.mode === 'RECURRENTE' && this.permissionsService.hasPermission(hasRecurrentePerm));

    if (!canSave) {
      this.uiService.showError(
        isCreating
          ? 'Permiso denegado: No tienes permisos suficientes para crear este registro'
          : 'Permiso denegado: No tienes permisos suficientes para editar este registro',
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

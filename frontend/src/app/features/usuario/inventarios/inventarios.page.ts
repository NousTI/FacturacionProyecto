import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { InventariosService } from './services/inventarios.service';
import { TipoMovimientoService } from './services/tipo-movimiento.service';
import { UnidadMedidaService } from './services/unidad-medida.service';
import { UiService } from '../../../shared/services/ui.service';
import { MovimientoInventario, TipoMovimiento, UnidadMedida } from '../../../domain/models/inventario.model';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-inventarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastComponent, ConfirmModalComponent],
  template: `
    <div class="page-container">
      <div class="tabs-wrapper">
        <button class="tab-btn" [class.active]="activeTab === 'movimientos'" (click)="activeTab = 'movimientos'">
          <i class="bi bi-arrow-left-right"></i> Movimientos
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'tipos'" (click)="activeTab = 'tipos'">
          <i class="bi bi-list"></i> Tipos de Movimiento
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'unidades'" (click)="activeTab = 'unidades'">
          <i class="bi bi-ruler"></i> Unidades de Medida
        </button>
      </div>

      <!-- TAB: MOVIMIENTOS -->
      <div *ngIf="activeTab === 'movimientos'" class="tab-content">
        <div class="toolbar-minimal">
          <button class="btn-primary" (click)="openCreateMovimientoModal()" *appHasPermission="'INVENTARIO_CREAR'">
            <i class="bi bi-plus-lg"></i> Nuevo Movimiento
          </button>
          <button class="btn-refresh-minimal" (click)="refreshMovimientos()" [disabled]="isLoading">
            <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
          </button>
        </div>

        <div class="table-minimal">
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th *appHasPermission="'INVENTARIO_ELIMINAR'">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let mov of movimientos$ | async">
                <td>{{ mov.producto_id }}</td>
                <td>{{ getTipoNombre(mov.tipo_movimiento_id) }}</td>
                <td>{{ mov.cantidad }}</td>
                <td>{{ getUnidadNombre(mov.unidad_medida_id) }}</td>
                <td><span class="badge badge-info">{{ mov.estado }}</span></td>
                <td>{{ mov.fecha | date:'short' }}</td>
                <td *appHasPermission="'INVENTARIO_ELIMINAR'">
                  <button class="btn-sm btn-danger" (click)="handleDeleteMovimiento(mov)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!(movimientos$ | async)?.length">
                <td colspan="7" class="text-center text-muted">No hay movimientos registrados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: TIPOS DE MOVIMIENTO -->
      <div *ngIf="activeTab === 'tipos'" class="tab-content">
        <div class="toolbar-minimal">
          <button class="btn-primary" (click)="openCreateTipoModal()" *appHasPermission="'INVENTARIO_CREAR'">
            <i class="bi bi-plus-lg"></i> Nuevo Tipo
          </button>
          <button class="btn-refresh-minimal" (click)="refreshTipos()" [disabled]="isLoadingTipos">
            <i class="bi bi-arrow-clockwise" [class.spinning]="isLoadingTipos"></i>
          </button>
        </div>

        <div class="table-minimal">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Activo</th>
                <th *appHasPermission="'INVENTARIO_EDITAR'">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tipo of tipos$ | async">
                <td>{{ tipo.codigo }}</td>
                <td>{{ tipo.nombre }}</td>
                <td>{{ tipo.descripcion || '-' }}</td>
                <td><span class="badge" [ngClass]="tipo.activo ? 'badge-success' : 'badge-danger'">{{ tipo.activo ? 'Sí' : 'No' }}</span></td>
                <td *appHasPermission="'INVENTARIO_EDITAR'">
                  <button class="btn-sm btn-info" (click)="handleEditTipo(tipo)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="handleDeleteTipo(tipo)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!(tipos$ | async)?.length">
                <td colspan="5" class="text-center text-muted">No hay tipos de movimiento</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: UNIDADES DE MEDIDA -->
      <div *ngIf="activeTab === 'unidades'" class="tab-content">
        <div class="toolbar-minimal">
          <button class="btn-primary" (click)="openCreateUnidadModal()" *appHasPermission="'INVENTARIO_CREAR'">
            <i class="bi bi-plus-lg"></i> Nueva Unidad
          </button>
          <button class="btn-refresh-minimal" (click)="refreshUnidades()" [disabled]="isLoadingUnidades">
            <i class="bi bi-arrow-clockwise" [class.spinning]="isLoadingUnidades"></i>
          </button>
        </div>

        <div class="table-minimal">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Abreviatura</th>
                <th>Activo</th>
                <th *appHasPermission="'INVENTARIO_EDITAR'">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let unidad of unidades$ | async">
                <td>{{ unidad.codigo }}</td>
                <td>{{ unidad.nombre }}</td>
                <td>{{ unidad.abreviatura || '-' }}</td>
                <td><span class="badge" [ngClass]="unidad.activo ? 'badge-success' : 'badge-danger'">{{ unidad.activo ? 'Sí' : 'No' }}</span></td>
                <td *appHasPermission="'INVENTARIO_EDITAR'">
                  <button class="btn-sm btn-info" (click)="handleEditUnidad(unidad)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="handleDeleteUnidad(unidad)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!(unidades$ | async)?.length">
                <td colspan="5" class="text-center text-muted">No hay unidades de medida</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: MOVIMIENTO -->
      <div class="modal-overlay" *ngIf="showMovimientoModal" (click)="closeMovimientoModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>Nuevo Movimiento de Inventario</h5>
            <button class="btn-close" (click)="closeMovimientoModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="movimientoForm" *ngIf="movimientoForm">
              <div class="form-group">
                <label>Producto ID *</label>
                <input type="text" class="form-control" formControlName="producto_id" required>
              </div>
              <div class="form-group">
                <label>Tipo de Movimiento *</label>
                <select class="form-control" formControlName="tipo_movimiento_id" required>
                  <option value="">Selecciona un tipo</option>
                  <option *ngFor="let tipo of tipos$ | async" [value]="tipo.id">{{ tipo.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" class="form-control" formControlName="cantidad" step="0.01" required>
              </div>
              <div class="form-group">
                <label>Unidad de Medida *</label>
                <select class="form-control" formControlName="unidad_medida_id" required>
                  <option value="">Selecciona una unidad</option>
                  <option *ngFor="let unidad of unidades$ | async" [value]="unidad.id">{{ unidad.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Estado</label>
                <select class="form-control" formControlName="estado">
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="dañado">Dañado</option>
                  <option value="en_transito">En Tránsito</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeMovimientoModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="saveMovimiento()" [disabled]="isSaving || !movimientoForm?.valid">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: TIPO MOVIMIENTO -->
      <div class="modal-overlay" *ngIf="showTipoModal" (click)="closeTipoModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>{{ selectedTipo ? 'Editar Tipo' : 'Nuevo Tipo de Movimiento' }}</h5>
            <button class="btn-close" (click)="closeTipoModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="tipoForm" *ngIf="tipoForm">
              <div class="form-group">
                <label>Código *</label>
                <input type="text" class="form-control" formControlName="codigo" required>
              </div>
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" class="form-control" formControlName="nombre" required>
              </div>
              <div class="form-group">
                <label>Descripción</label>
                <textarea class="form-control" formControlName="descripcion" rows="3"></textarea>
              </div>
              <div class="form-check">
                <input type="checkbox" class="form-check-input" id="tipoActivo" formControlName="activo">
                <label class="form-check-label" for="tipoActivo">Activo</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeTipoModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="saveTipo()" [disabled]="isSaving || !tipoForm?.valid">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: UNIDAD MEDIDA -->
      <div class="modal-overlay" *ngIf="showUnidadModal" (click)="closeUnidadModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>{{ selectedUnidad ? 'Editar Unidad' : 'Nueva Unidad de Medida' }}</h5>
            <button class="btn-close" (click)="closeUnidadModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="unidadForm" *ngIf="unidadForm">
              <div class="form-group">
                <label>Código *</label>
                <input type="text" class="form-control" formControlName="codigo" required>
              </div>
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" class="form-control" formControlName="nombre" required>
              </div>
              <div class="form-group">
                <label>Abreviatura</label>
                <input type="text" class="form-control" formControlName="abreviatura" placeholder="Ej: kg, L, m">
              </div>
              <div class="form-check">
                <input type="checkbox" class="form-check-input" id="unidadActivo" formControlName="activo">
                <label class="form-check-label" for="unidadActivo">Activo</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeUnidadModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="saveUnidad()" [disabled]="isSaving || !unidadForm?.valid">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <app-confirm-modal
        *ngIf="showConfirmModal"
        [title]="confirmTitle"
        [message]="confirmMessage"
        confirmText="Eliminar"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="confirmDelete()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .tabs-wrapper { display: flex; gap: 1rem; border-bottom: 1px solid #e2e8f0; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-weight: 500; border-bottom: 3px solid transparent; transition: all 0.2s; color: #64748b; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .toolbar-minimal { display: flex; gap: 1rem; }
    .btn-primary, .btn-refresh-minimal { padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-refresh-minimal { background: white; border: 1px solid #e2e8f0; }
    .btn-refresh-minimal:hover { background: #f8fafc; }
    .btn-refresh-minimal.spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-minimal { background: white; border: 1px solid #e2e8f0; border-radius: 12px; }
    .table { margin: 0; width: 100%; }
    .table th { background: #f8fafc; padding: 1rem; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .btn-sm { padding: 0.25rem 0.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .btn-info { background: #e0f2fe; color: #0369a1; margin-right: 0.25rem; }
    .btn-danger { background: #fee2e2; color: #dc2626; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h5 { margin: 0; font-weight: 600; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .form-check { margin-top: 1rem; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn { padding: 0.5rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
    .btn-secondary { background: #e2e8f0; color: #333; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .text-center { text-align: center; }
    .text-muted { color: #999; }
  `]
})
export class InventariosPage implements OnInit, OnDestroy {
  movimientos$: Observable<MovimientoInventario[]>;
  tipos$: Observable<TipoMovimiento[]>;
  unidades$: Observable<UnidadMedida[]>;

  activeTab: 'movimientos' | 'tipos' | 'unidades' = 'movimientos';

  showMovimientoModal = false;
  showTipoModal = false;
  showUnidadModal = false;
  showConfirmModal = false;

  isLoading = false;
  isLoadingTipos = false;
  isLoadingUnidades = false;
  isSaving = false;
  isDeleting = false;

  movimientoForm: FormGroup | null = null;
  tipoForm: FormGroup | null = null;
  unidadForm: FormGroup | null = null;

  selectedMovimiento: MovimientoInventario | null = null;
  selectedTipo: TipoMovimiento | null = null;
  selectedUnidad: UnidadMedida | null = null;

  confirmTitle = '';
  confirmMessage = '';
  confirmAction: 'movimiento' | 'tipo' | 'unidad' | null = null;

  private destroy$ = new Subject<void>();
  private tipos: TipoMovimiento[] = [];
  private unidades: UnidadMedida[] = [];

  constructor(
    private inventariosService: InventariosService,
    private tiposService: TipoMovimientoService,
    private unidadesService: UnidadMedidaService,
    private uiService: UiService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.movimientos$ = this.inventariosService.movimientos$;
    this.tipos$ = this.tiposService.tipos$;
    this.unidades$ = this.unidadesService.unidades$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Inventarios', 'Gestiona movimientos, tipos de movimiento y unidades de medida');

    this.inventariosService.loadInitialData();
    this.tiposService.loadInitialData();
    this.unidadesService.loadInitialData();

    this.tipos$.pipe(takeUntil(this.destroy$)).subscribe(tipos => {
      this.tipos = tipos;
    });

    this.unidades$.pipe(takeUntil(this.destroy$)).subscribe(unidades => {
      this.unidades = unidades;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // MOVIMIENTOS
  openCreateMovimientoModal() {
    this.selectedMovimiento = null;
    this.movimientoForm = this.fb.group({
      producto_id: ['', Validators.required],
      tipo_movimiento_id: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      unidad_medida_id: ['', Validators.required],
      estado: ['disponible']
    });
    this.showMovimientoModal = true;
  }

  closeMovimientoModal() {
    this.showMovimientoModal = false;
    this.movimientoForm = null;
  }

  saveMovimiento() {
    if (!this.movimientoForm?.valid) return;

    this.isSaving = true;
    this.inventariosService.createMovimiento(this.movimientoForm.value)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Movimiento registrado', 'success');
          this.closeMovimientoModal();
        },
        error: (err) => this.uiService.showError(err, 'Error')
      });
  }

  handleDeleteMovimiento(mov: MovimientoInventario) {
    this.selectedMovimiento = mov;
    this.confirmTitle = 'Eliminar Movimiento';
    this.confirmMessage = '¿Estás seguro de eliminar este movimiento?';
    this.confirmAction = 'movimiento';
    this.showConfirmModal = true;
  }

  // TIPOS
  openCreateTipoModal() {
    this.selectedTipo = null;
    this.tipoForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      activo: [true]
    });
    this.showTipoModal = true;
  }

  handleEditTipo(tipo: TipoMovimiento) {
    this.selectedTipo = tipo;
    this.tipoForm = this.fb.group({
      codigo: [tipo.codigo, Validators.required],
      nombre: [tipo.nombre, Validators.required],
      descripcion: [tipo.descripcion || ''],
      activo: [tipo.activo]
    });
    this.showTipoModal = true;
  }

  closeTipoModal() {
    this.showTipoModal = false;
    this.tipoForm = null;
    this.selectedTipo = null;
  }

  saveTipo() {
    if (!this.tipoForm?.valid) return;

    this.isSaving = true;
    const operation = this.selectedTipo
      ? this.tiposService.updateTipo(this.selectedTipo.id, this.tipoForm.value)
      : this.tiposService.createTipo(this.tipoForm.value);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedTipo ? 'Tipo actualizado' : 'Tipo creado',
            'success'
          );
          this.closeTipoModal();
        },
        error: (err) => this.uiService.showError(err, 'Error')
      });
  }

  handleDeleteTipo(tipo: TipoMovimiento) {
    this.selectedTipo = tipo;
    this.confirmTitle = 'Eliminar Tipo';
    this.confirmMessage = `¿Estás seguro de eliminar el tipo "${tipo.nombre}"?`;
    this.confirmAction = 'tipo';
    this.showConfirmModal = true;
  }

  // UNIDADES
  openCreateUnidadModal() {
    this.selectedUnidad = null;
    this.unidadForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      abreviatura: [''],
      activo: [true]
    });
    this.showUnidadModal = true;
  }

  handleEditUnidad(unidad: UnidadMedida) {
    this.selectedUnidad = unidad;
    this.unidadForm = this.fb.group({
      codigo: [unidad.codigo, Validators.required],
      nombre: [unidad.nombre, Validators.required],
      abreviatura: [unidad.abreviatura || ''],
      activo: [unidad.activo]
    });
    this.showUnidadModal = true;
  }

  closeUnidadModal() {
    this.showUnidadModal = false;
    this.unidadForm = null;
    this.selectedUnidad = null;
  }

  saveUnidad() {
    if (!this.unidadForm?.valid) return;

    this.isSaving = true;
    const operation = this.selectedUnidad
      ? this.unidadesService.updateUnidad(this.selectedUnidad.id, this.unidadForm.value)
      : this.unidadesService.createUnidad(this.unidadForm.value);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedUnidad ? 'Unidad actualizada' : 'Unidad creada',
            'success'
          );
          this.closeUnidadModal();
        },
        error: (err) => this.uiService.showError(err, 'Error')
      });
  }

  handleDeleteUnidad(unidad: UnidadMedida) {
    this.selectedUnidad = unidad;
    this.confirmTitle = 'Eliminar Unidad';
    this.confirmMessage = `¿Estás seguro de eliminar la unidad "${unidad.nombre}"?`;
    this.confirmAction = 'unidad';
    this.showConfirmModal = true;
  }

  // DELETE CONFIRM
  confirmDelete() {
    this.isDeleting = true;
    let operation;

    if (this.confirmAction === 'movimiento' && this.selectedMovimiento) {
      operation = this.inventariosService.deleteMovimiento(this.selectedMovimiento.id);
    } else if (this.confirmAction === 'tipo' && this.selectedTipo) {
      operation = this.tiposService.deleteTipo(this.selectedTipo.id);
    } else if (this.confirmAction === 'unidad' && this.selectedUnidad) {
      operation = this.unidadesService.deleteUnidad(this.selectedUnidad.id);
    }

    if (!operation) return;

    operation
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Registro eliminado', 'success');
          this.showConfirmModal = false;
        },
        error: (err) => this.uiService.showError(err, 'Error')
      });
  }

  // HELPERS
  getTipoNombre(id: string): string {
    return this.tipos.find(t => t.id === id)?.nombre || 'N/A';
  }

  getUnidadNombre(id: string): string {
    return this.unidades.find(u => u.id === id)?.nombre || 'N/A';
  }

  // REFRESH
  refreshMovimientos() {
    this.isLoading = true;
    this.inventariosService.refresh();
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 800);
  }

  refreshTipos() {
    this.isLoadingTipos = true;
    this.tiposService.refresh();
    setTimeout(() => {
      this.isLoadingTipos = false;
      this.cd.detectChanges();
    }, 800);
  }

  refreshUnidades() {
    this.isLoadingUnidades = true;
    this.unidadesService.refresh();
    setTimeout(() => {
      this.isLoadingUnidades = false;
      this.cd.detectChanges();
    }, 800);
  }
}

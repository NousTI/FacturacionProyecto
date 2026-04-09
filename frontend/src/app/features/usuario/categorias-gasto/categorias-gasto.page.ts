import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { CategoriasGastoService } from './services/categorias-gasto.service';
import { UiService } from '../../../shared/services/ui.service';
import { CategoriaGasto, CategoriaGastoCreate, CategoriaGastoUpdate } from '../../../domain/models/categoria-gasto.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { AuthFacade } from '../../../core/auth/auth.facade';

@Component({
  selector: 'app-categorias-gasto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="page-container">
      <div class="toolbar-minimal">
        <button class="btn-primary" (click)="openCreateModal()" *appHasPermission="'CATEGORIA_GASTO_CREAR'">
          <i class="bi bi-plus-lg"></i> Nueva Categoría
        </button>
        <button class="btn-refresh-minimal" (click)="refreshData()" [disabled]="isLoading">
          <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
        </button>
      </div>

      <div class="table-minimal">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cat of categorias$ | async">
              <td>{{ cat.codigo }}</td>
              <td>{{ cat.nombre }}</td>
              <td><span class="badge" [ngClass]="'badge-' + getTipoBadge(cat.tipo)">{{ cat.tipo }}</span></td>
              <td>
                <span class="badge" [ngClass]="cat.activo ? 'badge-success' : 'badge-danger'">
                  {{ cat.activo ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-sm btn-info" (click)="handleEdit(cat)" *appHasPermission="'CATEGORIA_GASTO_EDITAR'" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="handleDelete(cat)" *appHasPermission="'CATEGORIA_GASTO_ELIMINAR'" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!(categorias$ | async)?.length">
              <td colspan="5" class="text-center text-muted">No hay categorías registradas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal crear/editar -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>{{ selectedCategoria ? 'Editar Categoría' : 'Nueva Categoría' }}</h5>
            <button class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" *ngIf="form">
              <div class="form-group">
                <label>Código</label>
                <input type="text" class="form-control" formControlName="codigo" required>
              </div>
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" class="form-control" formControlName="nombre" required>
              </div>
              <div class="form-group">
                <label>Descripción</label>
                <textarea class="form-control" formControlName="descripcion" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Tipo</label>
                <select class="form-control" formControlName="tipo" required>
                  <option value="fijo">Fijo</option>
                  <option value="variable">Variable</option>
                  <option value="operativo">Operativo</option>
                  <option value="financiero">Financiero</option>
                </select>
              </div>
              <div class="form-check">
                <input type="checkbox" class="form-check-input" id="activo" formControlName="activo">
                <label class="form-check-label" for="activo">Activo</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="saveCategoria()" [disabled]="isSaving || !form?.valid">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal eliminar -->
      <app-confirm-modal
        *ngIf="showConfirmModal && selectedCategoria"
        title="Eliminar Categoría"
        [message]="'¿Estás seguro de que deseas eliminar la categoría ' + selectedCategoria.nombre + '?'"
        confirmText="Eliminar"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="deleteCategoria()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .toolbar-minimal {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .btn-primary, .btn-refresh-minimal {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover { background: #2563eb; }

    .btn-refresh-minimal {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .btn-refresh-minimal:hover { background: #f8fafc; }

    .btn-refresh-minimal.spinning i { animation: spin 1s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .table-minimal {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      overflow: hidden;
    }

    .table {
      margin: 0;
      width: 100%;
    }

    .table th {
      background: #f8fafc;
      padding: 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-info {
      background: #e0f2fe;
      color: #0369a1;
    }

    .btn-info:hover { background: #cffafe; }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-danger:hover { background: #fecaca; }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-fijo { background: #dbeafe; color: #1e40af; }
    .badge-variable { background: #fef3c7; color: #92400e; }
    .badge-operativo { background: #e0e7ff; color: #3730a3; }
    .badge-financiero { background: #f3e8ff; color: #6b21a8; }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h5 { margin: 0; font-weight: 600; }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .form-check {
      margin-top: 1rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-secondary { background: #e2e8f0; color: #333; }
    .btn-secondary:hover { background: #cbd5e1; }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .text-center { text-align: center; }
    .text-muted { color: #999; }
  `]
})
export class CategoriasGastoPage implements OnInit, OnDestroy {
  categorias$: Observable<CategoriaGasto[]>;

  showModal = false;
  showConfirmModal = false;
  selectedCategoria: CategoriaGasto | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  form: FormGroup | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private service: CategoriasGastoService,
    private uiService: UiService,
    private authFacade: AuthFacade,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.categorias$ = this.service.categorias$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Categorías de Gasto', 'Gestiona las categorías de gastos de tu empresa');
    this.service.loadInitialData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCreateModal() {
    this.selectedCategoria = null;
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      tipo: ['operativo', Validators.required],
      activo: [true]
    });
    this.showModal = true;
  }

  handleEdit(cat: CategoriaGasto) {
    this.openCreateModal();
    this.selectedCategoria = cat;
    this.form!.patchValue(cat);
    this.showModal = true;
  }

  handleDelete(cat: CategoriaGasto) {
    this.selectedCategoria = cat;
    this.showConfirmModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form = null;
  }

  saveCategoria() {
    if (!this.form) return;

    this.isSaving = true;
    const operation = this.selectedCategoria
      ? this.service.updateCategoria(this.selectedCategoria.id, this.form.value)
      : this.service.createCategoria(this.form.value);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedCategoria ? 'Categoría actualizada' : 'Categoría creada',
            'success'
          );
          this.closeModal();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al guardar');
        }
      });
  }

  deleteCategoria() {
    if (!this.selectedCategoria) return;

    this.isDeleting = true;
    this.service.deleteCategoria(this.selectedCategoria.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Categoría eliminada', 'success');
          this.showConfirmModal = false;
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al eliminar');
        }
      });
  }

  refreshData() {
    this.isLoading = true;
    this.service.refresh();
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 800);
  }

  getTipoBadge(tipo: string): string {
    const badges: { [key: string]: string } = {
      fijo: 'fijo',
      variable: 'variable',
      operativo: 'operativo',
      financiero: 'financiero'
    };
    return badges[tipo] || 'secondary';
  }
}

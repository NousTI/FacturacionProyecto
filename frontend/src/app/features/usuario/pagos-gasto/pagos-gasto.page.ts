import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { PagosGastoService } from './services/pagos-gasto.service';
import { UiService } from '../../../shared/services/ui.service';
import { PagoGasto } from '../../../domain/models/pago-gasto.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-pagos-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent, ToastComponent],
  template: `
    <div class="page-container">
      <div class="toolbar-minimal">
        <button class="btn-primary" (click)="openCreateModal()" *appHasPermission="'PAGO_GASTO_CREAR'">
          <i class="bi bi-plus-lg"></i> Nuevo Pago
        </button>
        <button class="btn-refresh-minimal" (click)="refreshData()" [disabled]="isLoading">
          <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
        </button>
      </div>

      <div class="table-minimal">
        <table class="table">
          <thead>
            <tr>
              <th>Gasto</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pago of pagos$ | async">
              <td>{{ pago.gasto_id }}</td>
              <td>\${{ pago.monto | number:'1.2-2' }}</td>
              <td>{{ pago.metodo_pago }}</td>
              <td>{{ pago.numero_referencia || '-' }}</td>
              <td>{{ pago.fecha_pago | date:'short' }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-sm btn-info" (click)="handleEdit(pago)" *appHasPermission="'PAGO_GASTO_EDITAR'">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="handleDelete(pago)" *appHasPermission="'PAGO_GASTO_ELIMINAR'">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!(pagos$ | async)?.length">
              <td colspan="6" class="text-center text-muted">No hay pagos registrados</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>{{ selectedPago ? 'Editar Pago' : 'Nuevo Pago' }}</h5>
            <button class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" *ngIf="form">
              <div class="form-group">
                <label>Gasto ID</label>
                <input type="text" class="form-control" formControlName="gasto_id" required>
              </div>
              <div class="form-group">
                <label>Monto</label>
                <input type="number" class="form-control" formControlName="monto" step="0.01" required>
              </div>
              <div class="form-group">
                <label>Método de Pago</label>
                <select class="form-control" formControlName="metodo_pago" required>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fecha de Pago</label>
                <input type="date" class="form-control" formControlName="fecha_pago" required>
              </div>
              <div class="form-group">
                <label>Número de Referencia</label>
                <input type="text" class="form-control" formControlName="numero_referencia">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="savePago()" [disabled]="isSaving">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <app-confirm-modal
        *ngIf="showConfirmModal && selectedPago"
        title="Eliminar Pago"
        message="¿Estás seguro de eliminar este pago?"
        confirmText="Eliminar"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="deletePago()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .toolbar-minimal { display: flex; gap: 1rem; }
    .btn-primary, .btn-refresh-minimal { padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-refresh-minimal { background: white; border: 1px solid #e2e8f0; }
    .btn-refresh-minimal.spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-minimal { background: white; border: 1px solid #e2e8f0; border-radius: 12px; }
    .table { margin: 0; width: 100%; }
    .table th { background: #f8fafc; padding: 1rem; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-sm { padding: 0.25rem 0.5rem; border: none; border-radius: 6px; cursor: pointer; }
    .btn-info { background: #e0f2fe; color: #0369a1; }
    .btn-danger { background: #fee2e2; color: #dc2626; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; max-width: 500px; width: 90%; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
    .modal-header h5 { margin: 0; }
    .btn-close { background: none; border: none; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn { padding: 0.5rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; }
    .btn-secondary { background: #e2e8f0; }
    .btn-primary { background: #3b82f6; color: white; }
    .text-center { text-align: center; }
    .text-muted { color: #999; }
  `]
})
export class PagosGastoPage implements OnInit, OnDestroy {
  pagos$: Observable<PagoGasto[]>;

  showModal = false;
  showConfirmModal = false;
  selectedPago: PagoGasto | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  form: FormGroup | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private service: PagosGastoService,
    private uiService: UiService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.pagos$ = this.service.pagos$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Pagos de Gastos', 'Registra los pagos realizados de tus gastos');
    this.service.loadInitialData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCreateModal() {
    this.selectedPago = null;
    this.form = this.fb.group({
      gasto_id: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      metodo_pago: ['transferencia', Validators.required],
      fecha_pago: [new Date().toISOString().split('T')[0], Validators.required],
      numero_referencia: ['']
    });
    this.showModal = true;
  }

  handleEdit(pago: PagoGasto) {
    this.openCreateModal();
    this.selectedPago = pago;
    this.form!.patchValue(pago);
    this.showModal = true;
  }

  handleDelete(pago: PagoGasto) {
    this.selectedPago = pago;
    this.showConfirmModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form = null;
  }

  savePago() {
    if (!this.form) return;

    this.isSaving = true;
    const operation = this.selectedPago
      ? this.service.updatePago(this.selectedPago.id, this.form.value)
      : this.service.createPago(this.form.value);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedPago ? 'Pago actualizado' : 'Pago registrado',
            'success'
          );
          this.closeModal();
        },
        error: (err) => this.uiService.showError(err, 'Error al guardar')
      });
  }

  deletePago() {
    if (!this.selectedPago) return;

    this.isDeleting = true;
    this.service.deletePago(this.selectedPago.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Pago eliminado', 'success');
          this.showConfirmModal = false;
        },
        error: (err) => this.uiService.showError(err, 'Error')
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
}

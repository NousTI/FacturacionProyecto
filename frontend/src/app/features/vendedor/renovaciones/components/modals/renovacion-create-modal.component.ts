import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-renovacion-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn" (click)="onClose.emit()">
      <div class="modal-card animate__animated animate__zoomIn animate__faster" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div>
            <span class="editorial-label mb-1 d-block" style="color: var(--primary-color);">Solicitud de Renovación</span>
            <h2 class="modal-title">Tramitar Renovación</h2>
          </div>
          <button class="close-pill" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <p class="text-muted mb-4 small">Como vendedor, puedes solicitar la renovación de una empresa que gestionas.</p>
          
          <form [formGroup]="renovacionForm">
            <div class="row g-4">
              <!-- Empresa -->
              <div class="col-12">
                <label class="editorial-label">1. Seleccionar Empresa *</label>
                <select 
                  class="editorial-input"
                  formControlName="empresa_id"
                  (change)="onEmpresaChange()"
                  [class.is-invalid]="renovacionForm.get('empresa_id')?.invalid && renovacionForm.get('empresa_id')?.touched"
                >
                  <option [value]="''" disabled selected>Seleccione una empresa...</option>
                  <option *ngFor="let e of empresas" [value]="e.id">
                    {{ e.razonSocial }} ({{ e.ruc }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="renovacionForm.get('empresa_id')?.invalid && renovacionForm.get('empresa_id')?.touched">
                  Debe seleccionar una empresa
                </div>
              </div>
              
              <!-- Plan -->
              <div class="col-12">
                <label class="editorial-label">2. Seleccionar Plan de Renovación *</label>
                <select 
                  class="editorial-input"
                  formControlName="plan_id"
                  [disabled]="!renovacionForm.get('empresa_id')?.value"
                  [class.is-invalid]="renovacionForm.get('plan_id')?.invalid && renovacionForm.get('plan_id')?.touched"
                >
                  <option [value]="''" disabled selected>
                    {{ !renovacionForm.get('empresa_id')?.value ? 'Primero selecciona una empresa...' : 'Selecciona un plan...' }}
                  </option>
                  <option *ngFor="let p of planes" 
                          [value]="p.id" 
                          [disabled]="p.id === selectedEmpresaPlanId">
                    {{ p.nombre }} - {{ p.precio_anual | currency }}/año
                    <span *ngIf="p.id === selectedEmpresaPlanId"> (Plan Actual)</span>
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="renovacionForm.get('plan_id')?.invalid && renovacionForm.get('plan_id')?.touched">
                  Debe seleccionar un plan
                </div>
              </div>

              <!-- Comprobante URL (Oculto temporalmente) -->
              <div class="col-12" *ngIf="false">
                <label class="editorial-label">3. URL Comprobante de Pago</label>
                <input 
                  type="text"
                  class="editorial-input"
                  formControlName="comprobante_url"
                  placeholder="Enlace al comprobante (Ej: Google Drive, PDF, etc.)"
                  [class.is-invalid]="renovacionForm.get('comprobante_url')?.invalid && renovacionForm.get('comprobante_url')?.touched"
                >
                <div class="invalid-feedback" *ngIf="renovacionForm.get('comprobante_url')?.invalid && renovacionForm.get('comprobante_url')?.touched">
                  Debe proporcionar un enlace al comprobante
                </div>
              </div>

              <!-- Info Alert -->
              <div class="col-12">
                <div class="info-editorial-card bg-warning-subtle border-warning-subtle">
                  <div class="d-flex align-items-center gap-3">
                    <div class="icon-indicator bg-white text-warning">
                      <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div>
                      <span class="editorial-label mb-0" style="color: #92400e;">Revisión Administrativa</span>
                      <p class="m-0 text-muted" style="font-size: 0.8rem;">
                        La solicitud será revisada por el Superadmin para su activación definitiva.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" (click)="onClose.emit()">
            Cancelar
          </button>
          <button 
            class="btn-editorial py-2" 
            style="min-width: 180px; font-size: 0.8rem;"
            [disabled]="renovacionForm.invalid || loading"
            (click)="onSubmit()"
          >
            <span *ngIf="!loading">Enviar Solicitud</span>
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <span *ngIf="loading">Enviando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1.5rem;
    }
    .modal-card {
      background: white; border-radius: 32px; width: 100%; max-width: 580px;
      max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }
    .modal-header { padding: 2.5rem 3rem 1.5rem 3rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.03em; }
    .close-pill {
      background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 100px;
      display: flex; align-items: center; justify-content: center; color: #64748b;
      transition: all 0.2s; cursor: pointer;
    }
    .close-pill:hover { background: var(--primary-color); color: white; transform: rotate(90deg); }
    .modal-body { padding: 0.5rem 3rem 2rem 3rem; overflow-y: auto; flex: 1; }
    .info-editorial-card { background: #f8fafc; padding: 1.25rem; border-radius: 20px; border: 1.5px solid #f1f5f9; }
    .icon-indicator {
      width: 44px; height: 44px; background: white; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      color: var(--primary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }
    .modal-footer { padding: 1.5rem 3rem 2.5rem 3rem; display: flex; justify-content: space-between; align-items: center; }
    .btn-cancel { background: transparent; color: #94a3b8; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
    .invalid-feedback { font-size: 0.65rem; font-weight: 700; color: var(--status-danger); margin-top: 0.4rem; text-transform: uppercase; }
    .is-invalid { border-color: var(--status-danger) !important; background-color: #fffafa !important; }
    .bg-warning-subtle { background-color: #fef9c3 !important; }
    .border-warning-subtle { border-color: #fde68a !important; }
  `]
})
export class RenovacionCreateModalComponent implements OnInit {
  @Input() empresas: any[] = [];
  @Input() planes: any[] = [];
  @Input() loading = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  renovacionForm: FormGroup;
  selectedEmpresaPlanId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.renovacionForm = this.fb.group({
      empresa_id: ['', Validators.required],
      plan_id: ['', Validators.required],
      comprobante_url: ['', [Validators.minLength(5)]]
    });
  }

  ngOnInit() {}

  onEmpresaChange() {
    const empresaId = this.renovacionForm.get('empresa_id')?.value;
    const emp = this.empresas.find(e => e.id === empresaId);
    this.selectedEmpresaPlanId = emp ? emp.planId : null;
    this.renovacionForm.get('plan_id')?.setValue('');
  }

  onSubmit() {
    if (this.renovacionForm.valid) {
      this.onSave.emit(this.renovacionForm.value);
    } else {
      this.renovacionForm.markAllAsTouched();
    }
  }
}

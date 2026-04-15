import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-renovacion-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
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
              
              <!-- Tipo de Solicitud -->
              <div class="col-12">
                <label class="editorial-label">2. Tipo de Gestión *</label>
                <div class="d-flex gap-3">
                  <div class="flex-grow-1" *ngIf="estadoActual !== 'CANCELADA'">
                    <input type="radio" id="tipo_renovacion" formControlName="tipo" value="RENOVACION" class="btn-check">
                    <label 
                      class="btn btn-outline-premium w-100 py-3" 
                      for="tipo_renovacion"
                      [class.disabled]="selectedEmpresaPlanId && !esTiempoDeRenovacion"
                      [title]="!esTiempoDeRenovacion ? 'Solo disponible 30 días antes del vencimiento' : ''"
                    >
                      <i class="bi bi-arrow-repeat me-2"></i>
                      Renovación
                    </label>
                  </div>
                  <div class="flex-grow-1">
                    <input type="radio" id="tipo_upgrade" formControlName="tipo" value="UPGRADE" class="btn-check">
                    <label class="btn btn-outline-premium w-100 py-3" for="tipo_upgrade">
                      <i class="bi bi-arrow-up-circle me-2"></i>
                      Upgrade
                    </label>
                  </div>
                </div>
                <!-- Alertas de tipo y estado -->
                <div *ngIf="empresaInactiva" class="mt-2 alert alert-dark border-0 rounded-4 p-3 animate__animated animate__headShake">
                  <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-slash-circle-fill fs-4"></i>
                    <div>
                      <strong class="d-block">Empresa INACTIVA</strong>
                      <span class="smallest">Esta empresa está deshabilitada globalmente. Debe activarse antes de renovar.</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'CANCELADA'" class="mt-2 alert alert-warning border-0 rounded-4 p-3 animate__animated animate__fadeIn">
                  <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-info-circle-fill fs-4 text-warning"></i>
                    <div>
                      <strong class="d-block text-dark">Suscripción CANCELADA</strong>
                      <span class="smallest text-muted">Para reactivar esta cuenta, selecciona un nuevo plan mediante la opción de <strong>Upgrade</strong>.</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'SUSPENDIDA'" class="mt-2 alert alert-warning border-0 rounded-4 p-3 animate__animated animate__fadeIn">
                  <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                    <div>
                      <strong class="d-block text-dark">Suscripción SUSPENDIDA</strong>
                      <span class="smallest text-muted">La cuenta está suspendida. Debes procesar una renovación o pago para regularizar el acceso.</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'VENCIDA'" class="mt-2 alert alert-info border-0 rounded-4 p-3 animate__animated animate__fadeIn">
                  <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-clock-history fs-4 text-primary"></i>
                    <div>
                      <strong class="d-block text-dark">Suscripción VENCIDA</strong>
                      <span class="smallest text-muted">El periodo de uso ha finalizado. Puedes renovar ahora mismo ignorando la regla de los 30 días.</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="selectedEmpresaId && estadoActual === 'ACTIVA' && !esTiempoDeRenovacion && renovacionForm.get('tipo')?.value === 'RENOVACION'" class="mt-2 text-danger smallest fw-bold animate__animated animate__shakeX">
                  <i class="bi bi-exclamation-octagon-fill me-1"></i>
                  La renovación solo está disponible 30 días antes del vencimiento.
                </div>
                <div *ngIf="selectedEmpresaId && estadoActual === 'ACTIVA' && !esTiempoDeRenovacion" class="mt-2 text-muted smallest italic">
                  <i class="bi bi-info-circle me-1"></i>
                  Faltan {{ diasRestantesParaVencer }} días para el vencimiento. 
                  Solo puedes solicitar un <strong>Upgrade</strong> por ahora.
                </div>
              </div>

              <!-- Plan -->
              <div class="col-12" [class.opacity-50]="renovacionForm.get('tipo')?.value === 'RENOVACION'">
                <label class="editorial-label">3. Seleccionar Plan *</label>
                <select 
                  class="editorial-input"
                  formControlName="plan_id"
                  [disabled]="!renovacionForm.get('empresa_id')?.value || renovacionForm.get('tipo')?.value === 'RENOVACION'"
                  [class.is-invalid]="renovacionForm.get('plan_id')?.invalid && renovacionForm.get('plan_id')?.touched"
                >
                  <option [value]="''" disabled selected>
                    {{ !renovacionForm.get('empresa_id')?.value ? 'Primero selecciona una empresa...' : 'Selecciona un plan...' }}
                  </option>
                  <option *ngFor="let p of planes" 
                          [value]="p.id" 
                          [disabled]="p.id === selectedEmpresaPlanId && renovacionForm.get('tipo')?.value === 'UPGRADE' && estadoActual !== 'CANCELADA'">
                    {{ p.nombre }} - {{ p.precio_anual | currency }}/año
                    <span *ngIf="p.id === selectedEmpresaPlanId"> (Plan Actual)</span>
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="renovacionForm.get('plan_id')?.invalid && renovacionForm.get('plan_id')?.touched">
                  Debe seleccionar un plan
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
                        La solicitud será enviada al Superadmin. Él se encargará de gestionar el cobro y activar tu renovación.
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
            [disabled]="renovacionForm.invalid || loading || bloqueadaPorEstado"
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
    .bg-soft-primary { background-color: #eef2ff; color: #4f46e5; }
    .btn-outline-premium {
      border: 2.5px solid #f1f5f9; background: white; color: #64748b;
      font-weight: 700; font-size: 0.8rem; border-radius: 18px; transition: all 0.3s;
    }
    .btn-outline-premium:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-check:checked + .btn-outline-premium {
      background: #4f46e5; border-color: #4f46e5; color: white;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
    }
    .btn-outline-premium.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
    .italic { font-style: italic; }
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
  esTiempoDeRenovacion: boolean = false;
  diasRestantesParaVencer: number = 0;
  bloqueadaPorEstado: boolean = false;
  empresaInactiva: boolean = false;
  estadoActual: string = 'ACTIVA';

  constructor(private fb: FormBuilder) {
    this.renovacionForm = this.fb.group({
      empresa_id: ['', Validators.required],
      tipo: ['RENOVACION', Validators.required],
      plan_id: ['', Validators.required]
    });

    // Escuchar cambios de tipo para ajustar plan
    this.renovacionForm.get('tipo')?.valueChanges.subscribe(v => {
      this.syncPlanWithType(v);
    });
  }

  ngOnInit() {}

  selectedEmpresaId: string | null = null;
  onEmpresaChange() {
    const empresaId = this.renovacionForm.get('empresa_id')?.value;
    this.selectedEmpresaId = empresaId;
    const emp = this.empresas.find(e => e.id === empresaId);
    
    this.selectedEmpresaPlanId = emp ? emp.planId : null;
    this.estadoActual = emp ? emp.suscripcionEstado : 'ACTIVA';
    this.empresaInactiva = emp ? emp.estado === 'INACTIVO' : false;
    
    this.esTiempoDeRenovacion = false;
    this.diasRestantesParaVencer = 0;
    
    // Solo bloqueamos si la empresa está inactiva globalmente
    this.bloqueadaPorEstado = this.empresaInactiva;

    // Si está cancelada, forzamos Upgrade
    if (this.estadoActual === 'CANCELADA') {
      this.renovacionForm.get('tipo')?.setValue('UPGRADE');
    }

    if (emp && emp.fechaVencimiento) {
      const hoy = new Date();
      const vencimiento = new Date(emp.fechaVencimiento);
      
      const diffTime = vencimiento.getTime() - hoy.getTime();
      this.diasRestantesParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Regla de los 30 días: Solo aplica si está ACTIVA
      if (this.estadoActual === 'ACTIVA') {
        this.esTiempoDeRenovacion = this.diasRestantesParaVencer <= 30;
      } else {
        // Si está VENCIDA o SUSPENDIDA (o cualquier otro no ACTIVA), 
        // permitimos renovar siempre para regularizar.
        this.esTiempoDeRenovacion = true;
      }
    } else {
        this.esTiempoDeRenovacion = true; 
    }

    if (!this.esTiempoDeRenovacion) {
      this.renovacionForm.get('tipo')?.setValue('UPGRADE');
    } else {
      this.renovacionForm.get('tipo')?.setValue('RENOVACION');
    }

    this.syncPlanWithType(this.renovacionForm.get('tipo')?.value);
  }

  syncPlanWithType(tipo: string) {
    if (tipo === 'RENOVACION' && this.selectedEmpresaPlanId) {
      this.renovacionForm.get('plan_id')?.setValue(this.selectedEmpresaPlanId);
    } else if (tipo === 'UPGRADE') {
      const currentPlan = this.renovacionForm.get('plan_id')?.value;
      if (currentPlan === this.selectedEmpresaPlanId) {
        this.renovacionForm.get('plan_id')?.setValue('');
      }
    }
  }

  onSubmit() {
    if (this.renovacionForm.valid) {
      this.onSave.emit(this.renovacionForm.value);
    } else {
      this.renovacionForm.markAllAsTouched();
    }
  }
}

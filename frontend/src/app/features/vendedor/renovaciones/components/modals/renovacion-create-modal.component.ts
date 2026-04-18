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
          <p class="text-muted mb-4 smallest fw-600">Como vendedor, puedes solicitar la renovación de una empresa que gestionas.</p>
          
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
                <ng-container *ngIf="!bloqueadaPorEstado">
                  <label class="editorial-label">2. Tipo de Gestión *</label>
                  <div class="d-flex gap-3" [class.opacity-50]="!selectedEmpresaId" [style.pointer-events]="!selectedEmpresaId ? 'none' : 'auto'">
                    <div class="flex-grow-1" *ngIf="estadoActual !== 'CANCELADA'">
                      <input type="radio" id="tipo_renovacion" formControlName="tipo" value="RENOVACION" class="btn-check" [attr.disabled]="!selectedEmpresaId ? true : null">
                      <label
                        class="btn btn-outline-premium w-100 py-3"
                        for="tipo_renovacion"
                        [class.disabled]="!selectedEmpresaId || (selectedEmpresaPlanId && !esTiempoDeRenovacion)"
                        [title]="!selectedEmpresaId ? 'Primero selecciona una empresa' : (!esTiempoDeRenovacion ? 'Solo disponible 30 días antes del vencimiento' : '')"
                      >
                        <i class="bi bi-arrow-repeat me-2"></i>
                        Renovación
                      </label>
                    </div>
                    <div class="flex-grow-1">
                      <input type="radio" id="tipo_upgrade" formControlName="tipo" value="UPGRADE" class="btn-check" [attr.disabled]="!selectedEmpresaId ? true : null">
                      <label class="btn btn-outline-premium w-100 py-3" for="tipo_upgrade" [class.disabled]="!selectedEmpresaId">
                        <i class="bi bi-arrow-up-circle me-2"></i>
                        Upgrade
                      </label>
                    </div>
                  </div>
                </ng-container>

                <!-- Alertas de tipo y estado con patrón Soft Background -->
                <div *ngIf="tieneSolicitudPendiente" class="soft-alert soft-alert-warning animate__animated animate__headShake">
                  <div class="icon-indicator text-warning">
                    <i class="bi bi-hourglass-split"></i>
                  </div>
                  <div>
                    <strong class="d-block text-dark small">Solicitud en proceso</strong>
                    <span class="smallest">Esta empresa ya tiene una solicitud <strong>PENDIENTE</strong>. No puedes enviar otra hasta que sea procesada.</span>
                  </div>
                </div>

                <div *ngIf="empresaInactiva" class="soft-alert soft-alert-danger animate__animated animate__headShake">
                  <div class="icon-indicator text-danger">
                    <i class="bi bi-slash-circle-fill"></i>
                  </div>
                  <div>
                    <strong class="d-block small">Empresa INACTIVA</strong>
                    <span class="smallest">Esta empresa está deshabilitada globalmente. Debe activarse antes de renovar.</span>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'CANCELADA'" class="soft-alert soft-alert-warning animate__animated animate__fadeIn">
                  <div class="icon-indicator text-warning">
                    <i class="bi bi-info-circle-fill"></i>
                  </div>
                  <div>
                    <strong class="d-block text-dark small">Suscripción CANCELADA</strong>
                    <span class="smallest">Para reactivar esta cuenta, selecciona un nuevo plan mediante la opción de <strong>Upgrade</strong>.</span>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'SUSPENDIDA'" class="soft-alert soft-alert-warning animate__animated animate__fadeIn">
                  <div class="icon-indicator text-warning">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <div>
                    <strong class="d-block text-dark small">Suscripción SUSPENDIDA</strong>
                    <span class="smallest">La cuenta está suspendida. Debes procesar una renovación para regularizar el acceso.</span>
                  </div>
                </div>

                <div *ngIf="estadoActual === 'VENCIDA'" class="soft-alert soft-alert-info animate__animated animate__fadeIn">
                  <div class="icon-indicator text-primary">
                    <i class="bi bi-clock-history"></i>
                  </div>
                  <div>
                    <strong class="d-block text-dark small">Suscripción VENCIDA</strong>
                    <span class="smallest">El periodo de uso ha finalizado. Puedes renovar ahora mismo ignorando la regla de los 30 días.</span>
                  </div>
                </div>

                <div *ngIf="selectedEmpresaId && estadoActual === 'ACTIVA' && !esTiempoDeRenovacion && renovacionForm.get('tipo')?.value === 'RENOVACION'" class="mt-2 text-danger smallest fw-800 animate__animated animate__shakeX">
                  <i class="bi bi-exclamation-octagon-fill me-1"></i>
                  La renovación solo está disponible 30 días antes del vencimiento.
                </div>
                <div *ngIf="selectedEmpresaId && estadoActual === 'ACTIVA' && !esTiempoDeRenovacion && !bloqueadaPorEstado" class="mt-2 text-muted smallest italic">
                  <i class="bi bi-info-circle me-1"></i>
                  Faltan {{ diasRestantesParaVencer }} días para el vencimiento. 
                  Solo puedes solicitar un <strong>Upgrade</strong> por ahora.
                </div>
              </div>

              <!-- Plan -->
              <div class="col-12" [class.opacity-50]="renovacionForm.get('tipo')?.value === 'RENOVACION'" *ngIf="!bloqueadaPorEstado">
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
              <div class="col-12" *ngIf="!bloqueadaPorEstado">
                <div class="soft-alert soft-alert-natural">
                  <div class="icon-indicator text-warning">
                    <i class="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <span class="editorial-label mb-0">Revisión Administrativa</span>
                    <p class="m-0 text-muted smallest fw-600">
                      La solicitud será enviada al Superadmin para gestionar el cobro y activar la renovación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button (click)="onClose.emit()" [disabled]="loading" class="btn-cancel-final">Cancelar</button>
          <button (click)="onSubmit()" 
                  [disabled]="renovacionForm.invalid || loading || bloqueadaPorEstado" 
                  class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Enviando...' : 'Enviar Solicitud' }}
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
      background: var(--bg-main); border-radius: 32px; width: 100%; max-width: 580px;
      max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }
    .modal-header { padding: 2.5rem 3rem 1.5rem 3rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.03em; }
    .close-pill {
      background: var(--status-natural-bg); border: none; width: 36px; height: 36px; border-radius: 100px;
      display: flex; align-items: center; justify-content: center; color: var(--text-muted);
      transition: all 0.2s; cursor: pointer;
    }
    .close-pill:hover { background: var(--status-danger-bg); color: var(--status-danger-text); transform: rotate(90deg); }
    .modal-body { padding: 0.5rem 3rem 2rem 3rem; overflow-y: auto; flex: 1; }
    
    .soft-alert {
      padding: 1.25rem; border-radius: 20px; border: 1px solid transparent;
      display: flex; align-items: center; gap: 1rem; margin-top: 1rem;
    }
    .soft-alert-warning { background: var(--status-warning-bg); border-color: var(--status-warning-bg); color: var(--status-warning-text); }
    .soft-alert-danger { background: var(--status-danger-bg); border-color: var(--status-danger-bg); color: var(--status-danger-text); }
    .soft-alert-info { background: var(--status-info-bg); border-color: var(--status-info-bg); color: var(--status-info-text); }
    .soft-alert-natural { background: var(--status-natural-bg); border-color: var(--border-color); color: var(--text-main); }

    .icon-indicator {
      width: 44px; height: 44px; background: white; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }
    .modal-footer { padding: 1.5rem 3rem 2.5rem 3rem; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-submit-final {
      background: var(--primary-color); color: white; border: none;
      padding: 0.85rem 2rem; border-radius: 16px; font-weight: 800;
      transition: all 0.2s; cursor: pointer;
    }
    .btn-submit-final:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px); }
    .btn-submit-final:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel-final { background: transparent; color: var(--text-muted); border: 2px solid var(--border-color); padding: 0.85rem 2rem; border-radius: 16px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
    .btn-cancel-final:hover { background: #f8fafc; color: var(--text-main); border-color: var(--text-muted); }

    .invalid-feedback { font-size: 0.65rem; font-weight: 800; color: var(--status-danger); margin-top: 0.4rem; text-transform: uppercase; }
    .is-invalid { border-color: var(--status-danger) !important; background-color: var(--status-danger-bg) !important; }
    
    .btn-outline-premium {
      border: 2.5px solid var(--border-color); background: var(--bg-main); color: var(--text-muted);
      font-weight: 800; font-size: 0.8rem; border-radius: 18px; transition: all 0.3s;
    }
    .btn-outline-premium:hover { background: var(--status-info-bg); border-color: var(--status-info-bg); color: var(--status-info-text); }
    
    /* Colores específicos para Tipo de Gestión */
    #tipo_renovacion:checked + .btn-outline-premium {
      background: var(--status-info-text); border-color: var(--status-info-text); color: white;
    }
    #tipo_upgrade:checked + .btn-outline-premium {
      background: var(--status-success-text); border-color: var(--status-success-text); color: white;
    }
    
    .btn-outline-premium.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
    .italic { font-style: italic; }
    
    .editorial-input {
      width: 100%; padding: 0.85rem 1.25rem; border-radius: 16px;
      background: var(--bg-main); border: 2px solid var(--border-color);
      color: var(--text-main); font-weight: 600; font-size: 0.95rem;
      transition: all 0.2s; appearance: none;
    }
    .editorial-input:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg);
    }
    .editorial-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; display: block; }
  `]
})
export class RenovacionCreateModalComponent implements OnInit {
  @Input() empresas: any[] = [];
  @Input() planes: any[] = [];
  @Input() loading = false;
  @Input() solicitudesPendientes: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  renovacionForm: FormGroup;
  selectedEmpresaPlanId: string | null = null;
  esTiempoDeRenovacion: boolean = false;
  diasRestantesParaVencer: number = 0;
  bloqueadaPorEstado: boolean = false;
  empresaInactiva: boolean = false;
  estadoActual: string = 'ACTIVA';
  tieneSolicitudPendiente: boolean = false;

  constructor(private fb: FormBuilder) {
    this.renovacionForm = this.fb.group({
      empresa_id: ['', Validators.required],
      tipo: ['', Validators.required],
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
    this.tieneSolicitudPendiente = this.solicitudesPendientes.some(
      s => s.empresa_id === empresaId && s.estado === 'PENDIENTE'
    );

    this.esTiempoDeRenovacion = false;
    this.diasRestantesParaVencer = 0;

    // Solo bloqueamos si la empresa está inactiva globalmente o tiene solicitud pendiente
    this.bloqueadaPorEstado = this.empresaInactiva || this.tieneSolicitudPendiente;

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

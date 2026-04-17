import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../../domain/models/empresa.model';
import { SRI_TIPOS_PERSONA, SRI_TIPOS_CONTRIBUYENTE } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-edit-empresa-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay animate-fade-in" (click)="onClose.emit()">
      <div class="modal-container-lux shadow-premium-lg" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-lux">
          <div class="d-flex align-items-center gap-3">
            <div class="header-icon bg-primary-subtle text-primary">
              <i class="bi bi-building"></i>
            </div>
            <div>
              <h2 class="modal-title-lux">Editar Información de Empresa</h2>
              <p class="modal-subtitle-lux">Actualiza los datos legales y comerciales</p>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-lux" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-lux scroll-custom">
          <form #empForm="ngForm" id="empresaForm" (ngSubmit)="handleSave(empForm)">
            
            <!-- DATOS BÁSICOS -->
            <div class="form-section-lux">
              <h3 class="section-header-lux">Información General</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-lux">RUC / Identificación (Solo lectura)</label>
                  <input type="text" 
                         [(ngModel)]="formData.ruc" 
                         name="ruc" 
                         #ruc="ngModel"
                         class="input-lux opacity-75" 
                         readonly
                         title="El RUC no es editable manualmente. Se actualiza automáticamente basado en el certificado digital del SRI.">
                </div>
                <div class="col-md-6">
                  <label class="label-lux">Razón Social *</label>
                  <input type="text" 
                         [(ngModel)]="formData.razon_social" 
                         name="razon_social" 
                         #razon="ngModel"
                         class="input-lux" 
                         required 
                         minlength="3"
                         placeholder="Nombre Legal S.A."
                         [class.is-invalid-lux]="razon.invalid && razon.touched">
                  <div *ngIf="razon.invalid && razon.touched" class="error-msg-lux">
                    <span *ngIf="razon.errors?.['required']">La razón social es requerida</span>
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="label-lux">Nombre Comercial</label>
                  <input type="text" [(ngModel)]="formData.nombre_comercial" name="nombre_comercial" class="input-lux" placeholder="Nombre Fantasía">
                </div>
              </div>
            </div>

            <!-- CONTACTO Y UBICACIÓN -->
            <div class="form-section-lux">
              <h3 class="section-header-lux">Contacto y Ubicación</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-lux">Correo Electrónico *</label>
                  <input type="email" 
                         [(ngModel)]="formData.email" 
                         name="email" 
                         #email="ngModel"
                         class="input-lux" 
                         required 
                         email
                         placeholder="contacto@empresa.com"
                         [class.is-invalid-lux]="email.invalid && email.touched">
                  <div *ngIf="email.invalid && email.touched" class="error-msg-lux">
                    <span *ngIf="email.errors?.['required']">El correo es requerido</span>
                    <span *ngIf="email.errors?.['email']">Formato de correo inválido</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-lux">Teléfono Celular *</label>
                  <input type="text" 
                         [(ngModel)]="formData.telefono" 
                         name="telefono" 
                         #tel="ngModel"
                         class="input-lux" 
                         required
                         pattern="^[0-9]{10}$"
                         maxlength="10"
                         (keypress)="validateNumbers($event)"
                         placeholder="0999999999"
                         title="El teléfono debe tener 10 dígitos numéricos"
                         [class.is-invalid-lux]="tel.invalid && tel.touched">
                  <div *ngIf="tel.invalid && tel.touched" class="error-msg-lux">
                    <span *ngIf="tel.errors?.['required']">El teléfono es requerido</span>
                    <span *ngIf="tel.errors?.['pattern']">Debe tener exactamente 10 números</span>
                  </div>
                </div>
                <div class="col-12">
                  <label class="label-lux">Dirección Matriz *</label>
                  <textarea [(ngModel)]="formData.direccion" 
                            name="direccion" 
                            #dir="ngModel"
                            class="input-lux" 
                            rows="2" 
                            required 
                            placeholder="Calle Principal y Secundaria..."
                            [class.is-invalid-lux]="dir.invalid && dir.touched"></textarea>
                  <div *ngIf="dir.invalid && dir.touched" class="error-msg-lux">
                    <span>La dirección es requerida</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CONFIGURACIÓN SRI -->
            <div class="form-section-lux border-0 mb-0 pb-0">
              <h3 class="section-header-lux">Configuración Tributaria</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-lux">Tipo de Persona</label>
                  <select [(ngModel)]="formData.tipo_persona" name="tipo_persona" class="select-lux">
                    <option *ngFor="let t of tiposPersona" [value]="t.code">{{ t.label }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="label-lux">Régimen Tributario</label>
                  <select [(ngModel)]="formData.tipo_contribuyente" name="tipo_contribuyente" class="select-lux">
                    <option *ngFor="let t of tiposContribuyente" [value]="t.code">{{ t.label }}</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-center pt-3">
                  <div class="form-check form-switch switch-lux">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="formData.obligado_contabilidad" name="obligado_contabilidad" id="obligadoCheck">
                    <label class="form-check-label label-lux ms-2 mb-0" for="obligadoCheck">Obligado a llevar Contabilidad</label>
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="label-lux">URL del Logo (Opcional)</label>
                  <input type="text" [(ngModel)]="formData.logo_url" name="logo_url" class="input-lux" placeholder="https://ejemplo.com/logo.png">
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-lux">
          <button type="button" class="btn-cancel-lux" (click)="onClose.emit()" [disabled]="loading">Cancelar</button>
          <button type="submit" 
                  form="empresaForm"
                  class="btn-submit-lux shadow-sm"
                  [disabled]="loading || !empForm.valid || !hasChanges()">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Actualizando...' : 'Guardar Cambios' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-lux {
      background: #ffffff; width: 680px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      animation: modalSlideUp 0.3s ease-out;
    }
    .modal-header-lux {
      padding: 2rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
      background: var(--status-info-bg); color: var(--status-info-text);
    }
    .modal-title-lux {
      font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0;
    }
    .modal-subtitle-lux {
      font-size: 0.85rem; color: #64748b; margin: 2px 0 0 0; font-weight: 500;
    }
    .btn-close-lux {
      background: #f8fafc; border: none; width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.2s;
    }
    .btn-close-lux:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .modal-body-lux {
      padding: 2rem 2.5rem; overflow-y: auto; flex: 1;
    }
    .form-section-lux {
      margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #f8fafc;
    }
    .section-header-lux {
      font-size: 0.95rem; font-weight: 800; color: #334155; margin-bottom: 1.25rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .label-lux {
      font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; display: block;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .input-lux, .select-lux {
      width: 100%; border: 1.5px solid #e2e8f0; border-radius: 14px;
      padding: 0.75rem 1rem; font-size: 0.9rem; color: #1e293b; font-weight: 600;
      transition: all 0.2s;
    }
    .input-lux:focus, .select-lux:focus {
      border-color: #161d35; outline: none; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .modal-footer-lux {
      padding: 1.5rem 2.5rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-lux {
      background: var(--secondary-color, #161d35); color: #ffffff; border: none; padding: 0.85rem 2.5rem; border-radius: 14px;
      font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-lux:hover:not(:disabled) { background: var(--neutral-700); transform: translateY(-1px); }
    .btn-submit-lux:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-cancel-lux {
      background: white; color: #64748b; border: 1.5px solid #e2e8f0; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-cancel-lux:hover { background: #f8fafc; }

    .switch-lux .form-check-input:checked { background-color: #161d35; border-color: #161d35; }

    .is-invalid-lux {
      border-color: #ef4444 !important;
      background-color: #fef2f2;
    }
    .error-msg-lux {
      color: var(--status-danger-text);
      font-size: 0.7rem;
      font-weight: 700;
      margin-top: 4px;
      text-transform: uppercase;
    }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class EditEmpresaModalComponent implements OnInit, OnDestroy {
  @Input() empresa!: Empresa;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  formData: any = {};
  tiposPersona = SRI_TIPOS_PERSONA;
  tiposContribuyente = SRI_TIPOS_CONTRIBUYENTE;

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.formData = { ...this.empresa };
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  validateNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  hasChanges(): boolean {
    if (!this.empresa || !this.formData) return false;

    const editableFields: (keyof Empresa)[] = [
      'razon_social', 'nombre_comercial', 'email', 'telefono',
      'direccion', 'tipo_persona', 'tipo_contribuyente', 'obligado_contabilidad', 'logo_url'
    ];

    return editableFields.some(field => {
      const original = this.empresa[field];
      const current = this.formData[field];

      // Para strings, normalizamos null/undefined a ''
      if (typeof original === 'string' || original === null || typeof current === 'string' || current === null) {
        return (original || '').toString().trim() !== (current || '').toString().trim();
      }

      return original !== current;
    });
  }

  handleSave(form: any) {
    if (form.valid) {
      this.onSave.emit(this.formData);
    }
  }
}

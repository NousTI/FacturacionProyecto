
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../../shared/components/modal/modal.component';
import { Empresa } from '../../../../../../core/services/empresa.service';
import { Vendedor } from '../../../../../../core/services/vendedor.service';

@Component({
    selector: 'app-empresa-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
    template: `
    @if (isOpen) {
    <app-modal [title]="isEdit ? 'Editar Empresa' : 'Nueva Empresa'" [size]="'lg'" (close)="close.emit()">
        <form [formGroup]="form">
            <div class="row g-3">
                <!-- Identity -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">RUC <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="ruc" 
                           [class.is-invalid]="form.get('ruc')?.invalid && form.get('ruc')?.touched"
                           maxlength="13"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           placeholder="1234567890001">
                    <div class="invalid-feedback">RUC debe tener exactamente 13 números.</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Razón Social <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="razon_social" placeholder="Nombre Legal">
                </div>
                <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">Nombre Comercial</label>
                    <input type="text" class="form-control" formControlName="nombre_comercial" placeholder="Nombre de Marca">
                </div>
                @if (!isEdit) {
                 <!-- Vendor Assignment (Create Only - Edit has separate modal usually, but can be here too) -->
                 <div class="col-md-12">
                     <label class="form-label small fw-bold text-secondary">Vendedor Asignado</label>
                     <select class="form-select" formControlName="vendedor_id">
                          <option value="">-- Sin Asignar (Superadmin) --</option>
                          @for (vendedor of vendedores || []; track vendedor.id) {
                             <option [value]="vendedor.id">{{ vendedor.nombres }} {{ vendedor.apellidos }}</option>
                         }
                     </select>
                 </div>
                }
                
                @if (isEdit) {
                 <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">URL del Logo</label>
                    <input type="text" class="form-control" formControlName="logo_url" placeholder="https://ejemplo.com/logo.png">
                 </div>
                }

                <!-- Contact -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Correo Electrónico <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" formControlName="email" 
                           [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
                           placeholder="empresa@ejemplo.com">
                    <div class="invalid-feedback">Ingrese un correo válido.</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Teléfono</label>
                    <input type="text" class="form-control" formControlName="telefono" 
                           [class.is-invalid]="form.get('telefono')?.invalid && form.get('telefono')?.touched"
                           maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           placeholder="0991234567">
                    <div class="invalid-feedback">Teléfono debe tener exactamente 10 números.</div>
                </div>
                <div class="col-12">
                    <label class="form-label small fw-bold text-secondary">Dirección</label>
                    <input type="text" class="form-control" formControlName="direccion" placeholder="Av. Principal 123">
                </div>
                
                <!-- Tax Info -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Tipo Contribuyente</label>
                    <select class="form-select" formControlName="tipo_contribuyente">
                        <option value="Persona Natural">Persona Natural</option>
                        <option value="Sociedad">Sociedad</option>
                        <option value="Contribuyente Especial">Contribuyente Especial</option>
                    </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="obligadoContabilidad" formControlName="obligado_contabilidad">
                        <label class="form-check-label" for="obligadoContabilidad">
                            Obligado a Llevar Contabilidad
                        </label>
                    </div>
                </div>
            </div>
        </form>

        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="close.emit()">Cancelar</button>
            <button class="btn rounded-3 px-4" 
                [ngClass]="isEdit ? 'btn-primary' : 'btn-success'"
                [disabled]="form.invalid || saving"
                (click)="onSubmit()">
                @if (saving) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {{ isEdit ? 'Guardando...' : 'Creando...' }}
                } @else {
                    {{ isEdit ? 'Guardar Cambios' : 'Crear Empresa' }}
                }
            </button>
        </ng-container>
    </app-modal>
    }
  `
})
export class EmpresaFormComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() isEdit = false;
    @Input() empresa: Empresa | null = null;
    @Input() vendedores: Vendedor[] = [];
    @Input() saving = false;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    private fb = inject(FormBuilder);

    form: FormGroup = this.fb.group({
        ruc: ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
        razon_social: ['', Validators.required],
        nombre_comercial: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.pattern('^[0-9]{10}$')]],
        direccion: [''],
        tipo_contribuyente: ['Persona Natural'],
        obligado_contabilidad: [false],
        vendedor_id: [''],
        logo_url: ['']
    });

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen'] && this.isOpen) {
            this.form.reset({
                tipo_contribuyente: 'Persona Natural',
                obligado_contabilidad: false,
                vendedor_id: ''
            });

            if (this.isEdit && this.empresa) {
                this.form.patchValue({
                    ruc: this.empresa.ruc,
                    razon_social: this.empresa.razon_social,
                    nombre_comercial: this.empresa.nombre_comercial,
                    email: this.empresa.email,
                    telefono: this.empresa.telefono,
                    direccion: this.empresa.direccion,
                    tipo_contribuyente: this.empresa.tipo_contribuyente || 'Persona Natural',
                    obligado_contabilidad: this.empresa.obligado_contabilidad || false,
                    logo_url: this.empresa.logo_url
                });
            }
        }
    }

    onSubmit() {
        if (this.form.invalid) return;
        this.save.emit(this.form.value);
    }
}

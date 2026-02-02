import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteUsuario } from '../services/clientes.service';

interface Rol {
    id: string;
    nombre: string;
}

@Component({
    selector: 'app-cliente-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- HEADER -->
        <div class="modal-header-premium">
          <div>
            <h3 class="modal-title">Editar Cliente</h3>
            <p class="modal-subtitle">Actualiza la información del cliente</p>
          </div>
          <button class="btn-close-premium" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <!-- BODY -->
        <div class="modal-body-premium">
          <form #form="ngForm">
            <div class="row g-3">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="form-label">Nombres *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.nombres" 
                  name="nombres" 
                  required
                  placeholder="Ingrese nombres"
                >
              </div>
              
              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="form-label">Apellidos *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.apellidos" 
                  name="apellidos" 
                  required
                  placeholder="Ingrese apellidos"
                >
              </div>
              
              <!-- Email -->
              <div class="col-md-6">
                <label class="form-label">Email *</label>
                <input 
                  type="email"
                  class="form-control-premium"
                  [(ngModel)]="formData.email" 
                  name="email" 
                  required
                  placeholder="correo@ejemplo.com"
                >
              </div>
              
              <!-- Teléfono -->
              <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.telefono" 
                  name="telefono"
                  placeholder="0999999999"
                >
              </div>
              
              <!-- Rol -->
              <div class="col-12">
                <label class="form-label">Rol en la Empresa</label>
                <select 
                  class="form-select-premium"
                  [(ngModel)]="formData.empresa_rol_id" 
                  name="rol"
                >
                  <option [value]="null">Seleccionar rol...</option>
                  <option *ngFor="let rol of roles" [value]="rol.id">
                    {{ rol.nombre }}
                  </option>
                </select>
              </div>
            </div>
          </form>
        </div>
        
        <!-- FOOTER -->
        <div class="modal-footer-premium">
          <button class="btn-secondary-premium" (click)="onClose.emit()">
            Cancelar
          </button>
          <button 
            class="btn-primary-premium" 
            [disabled]="!form.valid || saving"
            (click)="save()"
          >
            <i class="bi" [class]="saving ? 'bi-hourglass-split' : 'bi-check-lg'"></i>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-container {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header-premium {
      padding: 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .modal-subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin: 0.25rem 0 0 0;
    }

    .btn-close-premium {
      background: #f8fafc;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-close-premium:hover {
      background: #161d35;
      color: white;
    }

    .modal-body-premium {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }

    .form-control-premium,
    .form-select-premium {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium:focus,
    .form-select-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }

    .modal-footer-premium {
      padding: 1.5rem 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-secondary-premium {
      background: #f8fafc;
      color: #475569;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-secondary-premium:hover {
      background: #e2e8f0;
    }

    .btn-primary-premium {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
      cursor: pointer;
    }
    .btn-primary-premium:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
      background: #232d4d;
    }
    .btn-primary-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ClienteEditModalComponent implements OnInit {
    @Input() cliente!: ClienteUsuario;
    @Input() roles: Rol[] = [];
    @Output() onClose = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<any>();

    formData: any = {};
    saving = false;

    ngOnInit() {
        this.formData = {
            nombres: this.cliente.nombres,
            apellidos: this.cliente.apellidos,
            email: this.cliente.email,
            telefono: this.cliente.telefono,
            empresa_rol_id: this.cliente.empresa_rol_id
        };
    }

    save() {
        this.saving = true;
        this.onSave.emit(this.formData);
    }
}

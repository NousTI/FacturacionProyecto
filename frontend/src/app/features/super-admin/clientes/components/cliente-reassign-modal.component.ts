import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteUsuario } from '../services/clientes.service';

@Component({
  selector: 'app-cliente-reassign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- HEADER -->
        <div class="modal-header-premium">
          <div class="header-content">
            <div class="icon-wrapper">
              <i class="bi bi-arrow-repeat"></i>
            </div>
            <div>
              <h3 class="modal-title">Reasignar Empresa</h3>
              <p class="modal-subtitle">Cambia la empresa del cliente</p>
            </div>
          </div>
          <button class="btn-close-premium" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <!-- BODY -->
        <div class="modal-body-premium">
          <!-- Cliente Info -->
          <div class="cliente-info-card">
            <div class="cliente-avatar">
              {{ cliente.nombres[0] }}{{ cliente.apellidos[0] }}
            </div>
            <div class="cliente-details">
              <div class="cliente-name">{{ cliente.nombres }} {{ cliente.apellidos }}</div>
              <div class="cliente-email">{{ cliente.email }}</div>
              <div class="current-company">
                <i class="bi bi-building"></i>
                <span>Empresa actual: <strong>{{ cliente.empresa_nombre }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Empresa Selector -->
          <div class="form-group">
            <label class="form-label">Nueva Empresa *</label>
            <select 
              class="form-select-premium"
              [(ngModel)]="selectedEmpresaId"
              [disabled]="saving"
            >
              <option [value]="null">Seleccionar empresa...</option>
              <option 
                *ngFor="let emp of empresas" 
                [value]="emp.id"
                [disabled]="emp.id === cliente.empresa_id"
              >
                {{ emp.nombre_comercial }}
                <span *ngIf="emp.id === cliente.empresa_id"> (Actual)</span>
              </option>
            </select>
          </div>

          <!-- Info Alert -->
          <div class="info-alert">
            <i class="bi bi-info-circle"></i>
            <div>
              <strong>Nota importante:</strong> Al reasignar, el cliente recibirá automáticamente el rol de 
              <strong>Administrador de Empresa</strong> en la nueva empresa.
            </div>
          </div>
        </div>
        
        <!-- FOOTER -->
        <div class="modal-footer-premium">
          <button class="btn-secondary-premium" (click)="onClose.emit()" [disabled]="saving">
            Cancelar
          </button>
          <button 
            class="btn-primary-premium" 
            [disabled]="!isValidSelection() || saving"
            (click)="reasignar()"
          >
            <i class="bi" [class]="saving ? 'bi-hourglass-split' : 'bi-arrow-repeat'"></i>
            {{ saving ? 'Reasignando...' : 'Reasignar Empresa' }}
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
      max-width: 550px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header-premium {
      padding: 2rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-content {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: #161d35;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .modal-subtitle {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0.25rem 0 0 0;
    }

    .btn-close-premium {
      background: #f3f4f6;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s;
      cursor: pointer;
      flex-shrink: 0;
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

    .cliente-info-card {
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .cliente-avatar {
      width: 56px;
      height: 56px;
      background: #161d35;
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .cliente-details {
      flex: 1;
    }

    .cliente-name {
      font-size: 1rem;
      font-weight: 700;
      color: #161d35;
      margin-bottom: 0.25rem;
    }

    .cliente-email {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .current-company {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #374151;
      padding: 0.5rem 0.75rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .current-company i {
      color: #161d35;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }

    .form-select-premium {
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-select-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.1);
      outline: none;
    }
    .form-select-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .info-alert {
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #374151;
      line-height: 1.5;
    }

    .info-alert i {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 2px;
      color: #6b7280;
    }

    .modal-footer-premium {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-secondary-premium {
      background: #f3f4f6;
      color: #374151;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-secondary-premium:hover:not(:disabled) {
      background: #e5e7eb;
    }
    .btn-secondary-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `]
})
export class ClienteReassignModalComponent implements OnInit {
  @Input() cliente!: ClienteUsuario;
  @Input() empresas: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onReasignar = new EventEmitter<string>();

  selectedEmpresaId: string | null = null;
  saving = false;

  ngOnInit() {
    // Don't pre-select - force user to choose a different company
    this.selectedEmpresaId = null;
  }

  isValidSelection(): boolean {
    // Only valid if a company is selected AND it's different from current
    return !!this.selectedEmpresaId && this.selectedEmpresaId !== this.cliente.empresa_id;
  }

  reasignar() {
    if (!this.isValidSelection()) return;

    this.saving = true;
    this.onReasignar.emit(this.selectedEmpresaId!);
  }
}

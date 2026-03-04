import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../../../../domain/models/factura.model';

@Component({
  selector: 'app-email-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop fade show" style="display: block; background-color: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          
          <!-- Gradient Header -->
          <div class="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-start">
            <div>
              <h5 class="fw-900 mb-1 text-dark" style="letter-spacing: -0.5px;">Enviar Comprobante</h5>
              <p class="text-muted small mb-0">Se enviará el RIDE (PDF) y el XML autorizado.</p>
            </div>
            <button type="button" class="btn-close-lux" (click)="close.emit(null)">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body p-4">
            <div class="invoice-summary-card mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="d-block text-muted tiny-cap">Factura</span>
                  <span class="fw-bold text-dark">{{ factura.numero_factura || 'BORRADOR' }}</span>
                </div>
                <div class="text-end">
                  <span class="d-block text-muted tiny-cap">Monto Total</span>
                  <span class="fw-bold text-primary">{{ factura.total | currency:'USD' }}</span>
                </div>
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label-lux">Correo Electrónico</label>
              <div class="input-lux-wrapper">
                <i class="bi bi-envelope"></i>
                <input 
                  type="email" 
                  class="input-lux" 
                  [(ngModel)]="email" 
                  placeholder="ejemplo@correo.com"
                  autofocus
                  (keyup.enter)="isValidEmail() && send()"
                >
              </div>
              <small class="text-muted mt-2 d-block" style="font-size: 0.75rem;">
                <i class="bi bi-info-circle me-1"></i>
                Por defecto se envió la factura al correo registrado del cliente.
              </small>
            </div>

            <button 
              class="btn-send-lux w-100" 
              [disabled]="!isValidEmail()"
              (click)="send()"
            >
              <i class="bi bi-send-fill me-2"></i>
              Enviar Ahora
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-900 { font-weight: 900; }
    .tiny-cap { text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.5px; font-weight: 700; }
    
    .btn-close-lux {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }
    .btn-close-lux:hover { background: #e2e8f0; color: #1e293b; }

    .invoice-summary-card {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 1rem 1.25rem;
    }

    .form-label-lux {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }

    .input-lux-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-lux-wrapper i {
      position: absolute;
      left: 1rem;
      color: #94a3b8;
    }
    .input-lux {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      transition: all 0.2s;
    }
    .input-lux:focus {
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .btn-send-lux {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.85rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .btn-send-lux:hover:not(:disabled) {
      background: #232d4b;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15);
    }
    .btn-send-lux:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }
  `]
})
export class EmailFacturaModalComponent implements OnInit {
  @Input() factura!: Factura;
  @Output() close = new EventEmitter<string | null>();

  email: string = '';

  ngOnInit() {
    this.email = this.factura.snapshot_cliente?.email || '';
  }

  isValidEmail(): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(this.email);
  }

  send() {
    if (this.isValidEmail()) {
      this.close.emit(this.email);
    }
  }
}

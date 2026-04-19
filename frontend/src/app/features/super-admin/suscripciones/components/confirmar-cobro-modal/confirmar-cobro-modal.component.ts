import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Suscripcion } from '../../services/suscripcion.service';

@Component({
  selector: 'app-confirmar-cobro-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final pt-2" (click)="$event.stopPropagation()" style="width: 450px;">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">Confirmar Cobro</h2>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final pb-4">
          <div class="alert-info-premium mb-4">
             <i class="bi bi-info-circle-fill me-2 fs-5"></i>
             <div>
                Confirmando recepción de <strong class="text-primary">{{ pago?.monto | currency }}</strong> para <strong>{{ suscripcion?.empresa_nombre }}</strong>.
             </div>
          </div>

          <div class="form-group-final mb-3">
            <label class="label-final">Método de Pago Real</label>
            <select [(ngModel)]="confirmarData.metodo_pago" class="input-final">
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TARJETA">TARJETA</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          <div class="form-group-final" *ngIf="confirmarData.metodo_pago !== 'EFECTIVO' && confirmarData.metodo_pago !== 'OTRO'">
            <label class="label-final">Número de Comprobante / Referencia *</label>
            <input 
              type="text" 
              [(ngModel)]="confirmarData.numero_comprobante" 
              class="input-final" 
              placeholder="Ej: TR-000123"
              #comprobanteInput>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" [disabled]="processing" class="btn-cancel-final">Cancelar</button>
          <button 
            (click)="submit()" 
            [disabled]="(!confirmarData.numero_comprobante && confirmarData.metodo_pago !== 'EFECTIVO' && confirmarData.metodo_pago !== 'OTRO') || processing" 
            class="btn-submit-final d-flex align-items-center gap-2"
          >
            <span *ngIf="processing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ processing ? 'Procesando...' : 'Confirmar Cobro' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-container-final {
      background: var(--bg-main); border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .modal-body-final { padding: 0 2.5rem; }
    
    .alert-info-premium {
      background: var(--status-info-bg); border: 1px solid var(--status-info); border-radius: 16px; padding: 1rem 1.25rem;
      display: flex; align-items: center; color: var(--status-info-text); font-size: 0.9rem; line-height: 1.5;
    }

    .label-final { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.6rem; display: block; }
    .input-final {
      width: 100%; border: 1px solid var(--border-color); border-radius: 12px;
      padding: 0.75rem 1.25rem; font-size: 0.95rem; color: var(--text-main); font-weight: 600; transition: all 0.2s;
    }
    .input-final:focus { border-color: var(--status-info); outline: none; box-shadow: 0 0 0 4px var(--status-info-bg); }

    .modal-footer-final { padding: 1.5rem 2.5rem; background: var(--bg-main); display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--border-color); }
    .btn-submit-final {
      background: var(--status-success-text); color: #ffffff; border: none; padding: 0.75rem 2rem;
      border-radius: 12px; font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) { background: var(--status-success); transform: translateY(-1px); }
    .btn-submit-final:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-cancel-final { background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; }
    .btn-cancel-final:hover { background: var(--status-neutral-bg); color: var(--text-main); }
  `]
})
export class ConfirmarCobroModalComponent implements OnInit, OnDestroy {
  @Input() suscripcion: Suscripcion | null = null;
  @Input() pago: any = null;
  @Input() processing: boolean = false;
  
  @Output() onConfirm = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  confirmarData = { 
    numero_comprobante: '', 
    metodo_pago: 'TRANSFERENCIA' 
  };

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  submit() {
    const isNoVoucherRequired = this.confirmarData.metodo_pago === 'EFECTIVO' || this.confirmarData.metodo_pago === 'OTRO';
    
    if (this.confirmarData.numero_comprobante || isNoVoucherRequired) {
      // Limpiar comprobante si no es requerido (por si acaso había basura)
      if (isNoVoucherRequired) {
        this.confirmarData.numero_comprobante = '';
      }
      this.onConfirm.emit(this.confirmarData);
    }
  }

  close() {
    this.onClose.emit();
  }
}

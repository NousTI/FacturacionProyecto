import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryComponent } from '../history/history.component';

@Component({
    selector: 'app-suscripcion-history-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div>
            <h2 class="modal-title-final">Historial de Pagos y Suscripciones</h2>
            <p class="text-muted mb-0" style="font-size: 0.85rem;">Registro detallado por empresa</p>
          </div>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final">
            <!-- Reuse History Component -->
            <app-payment-history></app-payment-history>
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
      background: #ffffff; width: 95vw; max-width: 1200px; height: 90vh; /* Increased size */
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; }
    .modal-title-final { font-size: 1.15rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    
    /* Remove padding for the body to let the component fill it */
    .modal-body-final { padding: 0; overflow: hidden; flex: 1; display: flex; flex-direction: column; }
  `],
    standalone: true,
    imports: [CommonModule, HistoryComponent]
})
export class SuscripcionHistoryModalComponent implements OnInit, OnDestroy {
    @Output() onClose = new EventEmitter<void>();

    constructor() { }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() { document.body.style.overflow = 'auto'; }
    close() { this.onClose.emit(); }
}

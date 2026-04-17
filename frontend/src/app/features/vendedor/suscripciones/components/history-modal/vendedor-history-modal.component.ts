import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorHistoryComponent } from '../history/vendedor-history.component';

@Component({
    selector: 'app-vendedor-history-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div>
            <h2 class="modal-title-final">Historial General de Pagos</h2>
            <p class="text-muted mb-0" style="font-size: 0.85rem;">Consulta el historial pagos de todas tus empresas</p>
          </div>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final">
            <app-vendedor-payment-history></app-vendedor-payment-history>
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
      background: var(--bg-main); width: 95vw; max-width: 1200px; height: 90vh;
      border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.25);
    }
    .modal-header-final { 
      padding: 1.5rem 2.5rem; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-bottom: 1px solid var(--border-color);
    }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0; }
    .btn-close-final { 
      background: var(--status-neutral-bg); border: none; 
      width: 36px; height: 36px; border-radius: 10px;
      font-size: 1.5rem; color: var(--text-muted); cursor: pointer; 
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-final:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }
    
    .modal-body-final { padding: 0; overflow: hidden; flex: 1; display: flex; flex-direction: column; }
  `],
    standalone: true,
    imports: [CommonModule, VendedorHistoryComponent]
})
export class VendedorHistoryModalComponent implements OnInit, OnDestroy {
    @Output() onClose = new EventEmitter<void>();

    constructor() { }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() { document.body.style.overflow = 'auto'; }
    close() { this.onClose.emit(); }
}

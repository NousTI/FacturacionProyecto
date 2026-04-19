import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-clientes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-content-container shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <i class="bi bi-cloud-download"></i>
          </div>
          <div class="header-text">
            <h5>Exportar Clientes</h5>
            <span>Elige el periodo de datos a descargar</span>
          </div>
          <button class="btn-close-custom" (click)="onClose.emit()" [disabled]="loading">
             <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="selection-grid">
            <!-- TODO EL TIEMPO -->
            <div class="option-card" [class.active]="exportType === 'ALL'" (click)="exportType = 'ALL'">
              <div class="card-check">
                <i class="bi" [class.bi-circle]="exportType !== 'ALL'" [class.bi-check-circle-fill]="exportType === 'ALL'"></i>
              </div>
              <div class="card-content">
                <span class="card-title">Todo el directorio</span>
                <span class="card-desc">Exportar la base de datos completa a Excel</span>
              </div>
            </div>

            <!-- POR RANGO -->
            <div class="option-card" [class.active]="exportType === 'RANGE'" (click)="exportType = 'RANGE'">
              <div class="card-check">
                <i class="bi" [class.bi-circle]="exportType !== 'RANGE'" [class.bi-check-circle-fill]="exportType === 'RANGE'"></i>
              </div>
              <div class="card-content">
                <span class="card-title">Por rango de fechas</span>
                <span class="card-desc">Filtrar clientes por su fecha de registro</span>
              </div>
            </div>
          </div>

          <!-- Date Range Form -->
          <div class="date-selector" *ngIf="exportType === 'RANGE'">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Desde</label>
                <div class="input-wrapper">
                  <i class="bi bi-calendar"></i>
                  <input type="date" [(ngModel)]="startDate" class="form-input-premium">
                </div>
              </div>
              <div class="col-6">
                <label class="form-label">Hasta</label>
                <div class="input-wrapper">
                  <i class="bi bi-calendar"></i>
                  <input type="date" [(ngModel)]="endDate" class="form-input-premium">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="onClose.emit()" [disabled]="loading">Cancelar</button>
          <button class="btn-primary-premium" (click)="handleExport()" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i class="bi bi-file-earmark-excel me-2" *ngIf="!loading"></i>
            {{ loading ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px); display: flex; align-items: center;
      justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-content-container {
      background: white; border-radius: 24px;
      width: 100%; max-width: 520px; overflow: hidden;
      border: 1px solid #f1f5f9;
    }

    /* Header */
    .modal-header {
      padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; align-items: center; gap: 1rem; position: relative;
    }
    .header-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: #eff6ff; color: #2563eb;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .header-text h5 { margin: 0; font-weight: 800; color: black; font-size: 1.15rem; }
    .header-text span { font-size: 0.8rem; color: #64748b; font-weight: 500; }
    
    .btn-close-custom {
      position: absolute; right: 1.5rem; top: 1.5rem;
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #f1f5f9; color: #64748b; display: flex;
      align-items: center; justify-content: center;
    }

    /* Body */
    .modal-body { padding: 2rem; }
    .selection-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    
    .option-card {
      display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem;
      border: 2px solid #f1f5f9; border-radius: 18px; cursor: pointer;
      transition: all 0.2s;
    }
    .option-card:hover { border-color: #e2e8f0; background: #f8fafc; }
    .option-card.active { border-color: black; background: #eff6ff; }
    
    .card-check { font-size: 1.25rem; color: #cbd5e1; }
    .option-card.active .card-check { color: black; }
    
    .card-content { display: flex; flex-direction: column; }
    .card-title { font-weight: 800; color: black; font-size: 0.95rem; }
    .card-desc { font-size: 0.8rem; color: #64748b; font-weight: 500; }

    /* Date Selector */
    .date-selector { background: #f8fafc; padding: 1.5rem; border-radius: 18px; border: 1px solid #f1f5f9; }
    .form-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
    
    .input-wrapper { position: relative; }
    .input-wrapper i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .form-input-premium {
      width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; border-radius: 10px;
      border: 1px solid #e2e8f0; background: white; font-size: 0.9rem; font-weight: 600;
    }

    /* Footer */
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 12px; border: none; background: #f1f5f9; color: #64748b; font-weight: 700; }
    .btn-primary-premium {
      padding: 0.75rem 1.5rem; border-radius: 12px; border: none;
      background: var(--primary-color); color: white; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-primary-premium:hover:not(:disabled) { background: var(--primary-color); transform: translateY(-2px); }
  `]
})
export class ExportClientesModalComponent {
  @Input() loading = false;
  @Output() onExport = new EventEmitter<{ startDate?: string, endDate?: string }>();
  @Output() onClose = new EventEmitter<void>();

  exportType: 'ALL' | 'RANGE' = 'ALL';
  startDate: string = '';
  endDate: string = '';

  handleExport() {
    if (this.exportType === 'ALL') {
      this.onExport.emit({});
    } else {
      this.onExport.emit({ startDate: this.startDate, endDate: this.endDate });
    }
  }
}



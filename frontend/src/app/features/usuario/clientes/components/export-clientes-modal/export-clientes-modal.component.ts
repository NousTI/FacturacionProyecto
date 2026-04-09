import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-clientes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-content-container glass-modal shadow-lg" (click)="$event.stopPropagation()" style="max-width: 500px;">
        
        <!-- HEADER -->
        <div class="modal-header border-0 pb-0">
          <div>
            <h5 class="fw-bold mb-0">Exportar Clientes</h5>
            <small class="text-muted">Elige el periodo de datos a descargar</small>
          </div>
          <button class="btn-close" (click)="onClose.emit()" [disabled]="loading"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body py-4">
          <div class="export-options mb-4">
            <!-- TODO EL TIEMPO -->
            <div class="selection-card" [class.active]="exportType === 'ALL'" (click)="exportType = 'ALL'">
              <div class="selection-check">
                 <i class="bi" [class.bi-circle]="exportType !== 'ALL'" [class.bi-check-circle-fill]="exportType === 'ALL'"></i>
              </div>
              <div class="selection-info">
                <span class="selection-title">Todo el directorio</span>
                <span class="selection-desc">Exportar la base de datos completa</span>
              </div>
            </div>

            <!-- POR RANGO -->
            <div class="selection-card mt-3" [class.active]="exportType === 'RANGE'" (click)="exportType = 'RANGE'">
               <div class="selection-check">
                 <i class="bi" [class.bi-circle]="exportType !== 'RANGE'" [class.bi-check-circle-fill]="exportType === 'RANGE'"></i>
              </div>
              <div class="selection-info">
                <span class="selection-title">Rango de fechas</span>
                <span class="selection-desc">Filtrar por fecha de registro</span>
              </div>
            </div>
          </div>

          <!-- DATE RANGE FORM -->
          <div class="date-range-form animate__animated animate__fadeIn" *ngIf="exportType === 'RANGE'">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Desde</label>
                <input type="date" [(ngModel)]="startDate" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Hasta</label>
                <input type="date" [(ngModel)]="endDate" class="form-control">
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer border-0 pt-0 pb-4 px-4">
          <button class="btn btn-light px-4" (click)="onClose.emit()" [disabled]="loading">
             Cancelar
          </button>
          <button class="btn btn-primary px-4" (click)="handleExport()" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Exportando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow: hidden; width: 100%; position: relative; display: flex; flex-direction: column; }
    
    .modal-body { padding: 1.5rem 2rem; }
    
    .selection-card {
      display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 2px solid #f1f5f9;
      border-radius: 16px; cursor: pointer; transition: all 0.2s;
    }
    .selection-card:hover { background: #f8fafc; border-color: #e2e8f0; }
    .selection-card.active { border-color: #2563eb; background: #eff6ff; }
    
    .selection-check { font-size: 1.25rem; color: #cbd5e1; }
    .selection-card.active .selection-check { color: #2563eb; }
    
    .selection-info { display: flex; flex-direction: column; }
    .selection-title { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .selection-desc { font-size: 0.75rem; color: #64748b; }
    
    .form-label { font-size: 0.8rem; font-weight: 600; color: #4b5563; margin-bottom: 0.3rem; }
    .form-control { border-radius: 10px; border: 1px solid #e2e8f0; padding: 0.6rem; font-size: 0.9rem; }
    
    .btn { border-radius: 12px; font-weight: 700; padding: 0.7rem 1.25rem; }
    .btn-primary { background: #2563eb; border: none; }
    .btn-light { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
,
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

import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-clientes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container scroll-premium shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- HEADER -->
        <div class="modal-header-lux">
          <div class="header-icon-box">
            <i class="bi bi-file-earmark-spreadsheet-fill"></i>
          </div>
          <div class="header-content">
            <h3>Exportar Clientes</h3>
            <p>Selecciona el rango de fechas para el reporte</p>
          </div>
          <button class="btn-close-lux" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- BODY -->
        <div class="modal-body-lux p-4">
          <div class="export-options mb-4">
            <div class="option-card" [class.active]="exportType === 'ALL'" (click)="exportType = 'ALL'">
              <div class="option-check">
                 <i class="bi" [class.bi-circle]="exportType !== 'ALL'" [class.bi-check-circle-fill]="exportType === 'ALL'"></i>
              </div>
              <div class="option-info">
                <span class="option-title">Todo el tiempo</span>
                <span class="option-desc">Exportar la base de datos completa de clientes</span>
              </div>
            </div>

            <div class="option-card" [class.active]="exportType === 'RANGE'" (click)="exportType = 'RANGE'">
               <div class="option-check">
                 <i class="bi" [class.bi-circle]="exportType !== 'RANGE'" [class.bi-check-circle-fill]="exportType === 'RANGE'"></i>
              </div>
              <div class="option-info">
                <span class="option-title">Rango de fechas</span>
                <span class="option-desc">Filtrar clientes por fecha de registro</span>
              </div>
            </div>
          </div>

          <!-- DATE RANGE FORM -->
          <div class="date-range-form" *ngIf="exportType === 'RANGE'">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label-lux">Desde</label>
                <div class="input-group-lux">
                  <i class="bi bi-calendar-date"></i>
                  <input type="date" [(ngModel)]="startDate" class="form-control-lux">
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label-lux">Hasta</label>
                <div class="input-group-lux">
                  <i class="bi bi-calendar-date"></i>
                  <input type="date" [(ngModel)]="endDate" class="form-control-lux">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer-lux p-4 bg-light bg-opacity-50">
          <button class="btn-secondary-lux" (click)="onClose.emit()" [disabled]="loading">
             Cancelar
          </button>
          <button class="btn-primary-lux" (click)="handleExport()" [disabled]="loading">
            <i class="bi bi-download me-2" *ngIf="!loading"></i>
            <span *ngIf="!loading">Descargar Excel</span>
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <span *ngIf="loading">Procesando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-container {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 500px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .modal-header-lux {
      padding: 1.5rem 2rem;
      background: #161d35;
      color: white;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      position: relative;
    }
    
    .header-icon-box {
        width: 48px;
        height: 48px;
        background: rgba(255,255,255,0.1);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }

    .header-content h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
    }
    
    .header-content p {
        margin: 0;
        font-size: 0.85rem;
        opacity: 0.7;
    }

    .btn-close-lux {
        position: absolute;
        top: 1.5rem; right: 1.5rem;
        background: none; border: none;
        color: white; opacity: 0.5;
        transition: 0.2s;
    }
    .btn-close-lux:hover { opacity: 1; transform: rotate(90deg); }

    .option-card {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.25rem;
        border: 2px solid #f1f5f9;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 0.75rem;
    }
    .option-card:hover {
        background: #f8fafc;
        border-color: #e2e8f0;
    }
    .option-card.active {
        border-color: #161d35;
        background: #f1f5f9;
    }
    .option-check { font-size: 1.2rem; color: #cbd5e1; transition: 0.2s; }
    .option-card.active .option-check { color: #161d35; }

    .option-info { display: flex; flex-direction: column; }
    .option-title { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .option-desc { font-size: 0.8rem; color: #64748b; }

    .form-label-lux {
        font-size: 0.8rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 0.5rem;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .input-group-lux {
        position: relative;
        display: flex;
        align-items: center;
    }
    .input-group-lux i {
        position: absolute;
        left: 1rem;
        color: #94a3b8;
    }
    .form-control-lux {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.8rem;
        border-radius: 12px;
        border: 2px solid #f1f5f9;
        font-size: 0.9rem;
        font-weight: 600;
        transition: 0.2s;
    }
    .form-control-lux:focus {
        border-color: #161d35;
        outline: none;
        background: white;
    }

    .modal-footer-lux {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        border-top: 1px solid #f1f5f9;
    }
    
    .btn-secondary-lux {
        padding: 0.75rem 1.75rem;
        border-radius: 12px;
        border: 2px solid #f1f5f9;
        background: white;
        font-weight: 700;
        color: #64748b;
        transition: 0.2s;
    }
    .btn-secondary-lux:hover { background: #f8fafc; color: #1e293b; }

    .btn-primary-lux {
        padding: 0.75rem 1.75rem;
        border-radius: 12px;
        border: none;
        background: #161d35;
        color: white;
        font-weight: 800;
        transition: 0.2s;
        display: flex;
        align-items: center;
    }
    .btn-primary-lux:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(22, 29, 53, 0.2);
    }
    .btn-primary-lux:disabled { opacity: 0.7; cursor: not-allowed; }
  `],
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

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturacionProgramadaService } from '../../services/facturacion-programada.service';
import { HistorialProgramacion } from '../../../../../domain/models/facturacion-programada.model';
import { finalize, timeout, catchError, of } from 'rxjs';

@Component({
  selector: 'app-recurrente-history-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn">
      <div class="modal-container animate__animated animate__zoomIn">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle bg-premium">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="header-text">
              <h3>Historial de Emisiones</h3>
              <p>Programación: {{ programacionNombre }}</p>
            </div>
          </div>
          <button class="btn-close-modal" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body custom-scrollbar">
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="premium-spinner"></div>
            <p class="mt-3 text-muted">Cargando historial...</p>
          </div>

          <div *ngIf="!isLoading && historial.length === 0" class="text-center py-5">
            <i class="bi bi-info-circle text-muted fs-1 mb-3"></i>
            <h5>Sin emisiones todavía</h5>
            <p class="text-muted">No se han encontrado facturas generadas por esta programación.</p>
          </div>

          <table *ngIf="!isLoading && historial.length > 0" class="table custom-table-mini">
            <thead>
              <tr>
                <th>Fecha Emisión</th>
                <th>Número Factura</th>
                <th>Monto</th>
                <th>Estado</th>
                <th class="text-end">Info SRI</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of historial">
                <td>
                  <div class="fw-bold">{{ item.fecha_emision | date:'dd/MM/yyyy' }}</div>
                  <div class="text-muted small">{{ item.fecha_emision | date:'HH:mm' }}</div>
                </td>
                <td>{{ item.numero_factura || 'BORRADOR' }}</td>
                <td class="fw-bold text-dark">{{ item.monto | currency:'USD' }}</td>
                <td>
                  <span class="status-badge" [ngClass]="item.estado.toLowerCase()">
                    {{ item.estado }}
                  </span>
                </td>
                <td class="text-end">
                  <div *ngIf="item.estado_sri" class="text-muted smallest text-truncate" style="max-width: 150px;" [title]="item.estado_sri">
                    Clave: {{ item.estado_sri }}
                  </div>
                  <div *ngIf="item.errores" class="text-danger smallest">
                    <i class="bi bi-exclamation-circle pe-1"></i> {{ item.errores }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary-premium" (click)="onClose.emit()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1100;
      display: flex;
      align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-container {
      background: white;
      width: 100%;
      max-width: 900px;
      max-height: 85vh;
      border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .modal-header {
      padding: 1.75rem 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .header-content { display: flex; align-items: center; gap: 1.25rem; }
    .icon-circle {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; color: white;
    }
    .bg-premium { background: #161d35; }
    .header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .header-text p { margin: 0; font-size: 0.85rem; color: #64748b; }
    .btn-close-modal {
      width: 36px; height: 36px;
      border-radius: 10px;
      border: none; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #64748b;
      transition: all 0.2s;
    }
    .btn-close-modal:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }

    .modal-body { padding: 1.5rem 2rem; overflow-y: auto; }
    .modal-footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end;
      background: #f8fafc;
    }

    .custom-table-mini { width: 100%; }
    .custom-table-mini th {
      font-size: 0.7rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; padding: 1rem 0.5rem;
      border-bottom: 2px solid #f1f5f9;
    }
    .custom-table-mini td { padding: 1.15rem 0.5rem; border-bottom: 1px solid #f8fafc; font-size: 0.9rem; }

    .status-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 800;
      display: inline-block;
    }
    .status-badge.autorizada { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .status-badge.borrador { background: #f1f5f9; color: #64748b; }
    .status-badge.error_tecnico, .status-badge.devuelta { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0;
      color: #64748b; font-weight: 600; padding: 0.6rem 1.5rem;
      border-radius: 12px; transition: all 0.2s;
    }
    .btn-secondary-premium:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

    .premium-spinner {
      width: 40px; height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #161d35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .smallest { font-size: 0.7rem; }
  `]
})
export class RecurrenteHistoryModalComponent implements OnInit {
  @Input() programacionId: string = '';
  @Input() programacionNombre: string = '';
  @Output() onClose = new EventEmitter<void>();

  historial: HistorialProgramacion[] = [];
  isLoading: boolean = true;

  constructor(private service: FacturacionProgramadaService) {}

  ngOnInit() {
    this.showDebug();
    this.loadHistory();
  }

  showDebug() {
    console.log("Cargando historial para:", this.programacionId);
  }

  loadHistory() {
    if (!this.programacionId) {
       this.isLoading = false;
       return;
    }

    this.isLoading = true;
    this.service.obtenerHistorial(this.programacionId).pipe(
      timeout(10000), // 10 segundos de máximo
      catchError(err => {
        console.error("Error en historial:", err);
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => this.historial = data
    });
  }
}

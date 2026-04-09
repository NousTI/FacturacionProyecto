import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vencidas-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="alert alert-danger-custom d-flex align-items-center mb-4">
        <i class="bi bi-clock-history fs-3 me-3"></i>
        <div>
          <h6 class="mb-1 fw-bold">Gestión de Cobro Requerida</h6>
          <p class="mb-0 small opacity-75">Las siguientes empresas tienen el servicio suspendido por falta de pago.</p>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Cliente / Razón Social</th>
              <th>RUC</th>
              <th>Contacto</th>
              <th>Plan</th>
              <th>Vencimiento</th>
              <th class="text-end">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of data">
              <td><span class="fw-bold">{{ s.razon_social }}</span></td>
              <td><span class="small text-muted">{{ s.ruc }}</span></td>
              <td>
                <div class="small">{{ s.email }}</div>
                <div class="small text-muted">{{ s.telefono }}</div>
              </td>
              <td><span class="badge bg-light text-dark">{{ s.plan_nombre }}</span></td>
              <td><span class="text-danger fw-bold">{{ s.fecha_fin }}</span></td>
              <td class="text-end">
                <span class="status-pill text-danger">SUSPENDIDO</span>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="6" class="text-center py-5">
                <i class="bi bi-check2-circle fs-1 d-block mb-2 text-success"></i>
                <p class="text-muted">¡Excelente! No hay suscripciones vencidas en este momento.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; }
    
    .alert-danger-custom { 
      background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; border-radius: 12px; 
    }
    
    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .status-pill {
      font-size: 0.65rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 6px; 
      background: #fef2f2;
    }
  `]
})
export class VencidasListComponent {
  @Input() data: any[] = [];
}

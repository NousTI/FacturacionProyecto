import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-proximas-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="alert alert-info-custom d-flex align-items-center mb-4">
        <i class="bi bi-calendar-event fs-3 me-3"></i>
        <div>
          <h6 class="mb-1 fw-bold">Oportunidades de Renovación</h6>
          <p class="mb-0 small opacity-75">Clientes activos que vencerán en los próximos días. Momento ideal para contacto comercial.</p>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>RUC</th>
              <th>Contacto Directo</th>
              <th>Plan Actual</th>
              <th>Fecha Vencimiento</th>
              <th class="text-end">Prioridad</th>
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
              <td><span class="badge bg-blue-100 text-blue-700">{{ s.plan_nombre }}</span></td>
              <td><span class="text-primary fw-bold">{{ s.fecha_fin }}</span></td>
              <td class="text-end">
                <span class="priority-badge" [class.high]="isHighPriority(s.fecha_fin)">
                  {{ isHighPriority(s.fecha_fin) ? 'ALTA' : 'MEDIA' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="6" class="text-center py-5">
                <i class="bi bi-calendar-check fs-1 d-block mb-2 text-muted"></i>
                <p class="text-muted">No se encontraron renovaciones próximas en este periodo.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; }
    
    .alert-info-custom { 
      background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af; border-radius: 12px; 
    }
    
    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .bg-blue-100 { background: #dbeafe; }
    .text-blue-700 { color: #1e40af; }

    .priority-badge {
      font-size: 0.65rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 6px; 
      background: #f1f5f9; color: #64748b;
    }
    .priority-badge.high { background: #fef2f2; color: #dc2626; }
  `]
})
export class ProximasListComponent {
  @Input() data: any[] = [];

  isHighPriority(fecha: string): boolean {
    if (!fecha) return false;
    const vDate = new Date(fecha).getTime();
    const today = new Date().getTime();
    const diffDays = (vDate - today) / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }
}

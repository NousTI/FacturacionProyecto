import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comisiones-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="table-header-info mb-3">
        <h5 class="mb-0">Historial de Comisiones</h5>
        <span class="badge bg-primary-light text-primary">{{ data?.length || 0 }} Registros</span>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Fecha de la Venta</th>
              <th>Plan</th>
              <th class="text-end">Mi Comisión</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of data">
              <td><span class="fw-bold">{{ c.empresa }}</span></td>
              <td><span class="text-muted">{{ c.fecha_venta | date:'yyyy-MM-dd' }}</span></td>
              <td><span class="plan-badge">{{ c.plan }}</span></td>
              <td class="text-end fw-bold text-success">{{ c.mi_comision | currency }}</td>
              <td class="text-center">
                <div class="d-flex align-items-center justify-content-center">
                  <span class="badge-status" 
                        [class.pagada]="c.estado === 'PAGADA'"
                        [class.aprobada]="c.estado === 'APROBADA'"
                        [class.pendiente]="c.estado === 'PENDIENTE'">
                    {{ c.estado }}
                  </span>
                  <i *ngIf="c.estado === 'PENDIENTE'" 
                     class="bi bi-info-circle ms-2 text-warning cursor-pointer"
                     title="en espera de ciclo de pago"></i>
                </div>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-cash-stack fs-1 d-block mb-2"></i>
                No hay registros de comisiones para este periodo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; }
    .table-header-info { display: flex; justify-content: space-between; align-items: center; }
    
    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .plan-badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
    
    .badge-status {
      padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
      background: #f1f5f9; color: #64748b;
    }
    .badge-status.pagada { background: #dcfce7; color: #16a34a; }
    .badge-status.aprobada { background: #eff6ff; color: #2563eb; }
    .badge-status.pendiente { background: #fef9c3; color: #854d0e; }
    
    .bg-primary-light { background: #eff6ff; }
    .cursor-pointer { cursor: pointer; }
  `]
})
export class ComisionesListComponent {
  @Input() data: any[] = [];
}

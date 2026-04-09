import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comisiones-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="summary-ribbon mb-4">
        <div class="ribbon-item">
          <span class="label">Total Comisiones</span>
          <span class="value">{{ totalComisiones | currency }}</span>
        </div>
        <div class="ribbon-item text-end">
          <span class="label">Transacciones</span>
          <span class="value">{{ data?.length || 0 }}</span>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente / Empresa</th>
              <th>Plan</th>
              <th class="text-center">% Com.</th>
              <th class="text-center">Estado</th>
              <th class="text-end">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of data">
              <td><span class="small">{{ c.fecha_generacion }}</span></td>
              <td><span class="fw-bold">{{ c.razon_social }}</span></td>
              <td><span class="badge bg-light text-dark">{{ c.plan_nombre }}</span></td>
              <td class="text-center font-monospace">{{ c.porcentaje_aplicado }}%</td>
              <td class="text-center">
                <span class="badge" [class.bg-success-light]="c.estado === 'PAGADA'" [class.bg-warning-light]="c.estado !== 'PAGADA'">
                  {{ c.estado }}
                </span>
              </td>
              <td class="text-end fw-bold text-success">{{ c.monto | currency }}</td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">
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
    
    .summary-ribbon {
      background: #111827; color: white; border-radius: 16px; padding: 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .ribbon-item .label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.25rem; }
    .ribbon-item .value { font-size: 1.5rem; font-weight: 800; }

    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .bg-success-light { background: #dcfce7; color: #166534; }
    .bg-warning-light { background: #fef9c3; color: #854d0e; }
  `]
})
export class ComisionesListComponent {
  @Input() data: any[] = [];

  get totalComisiones(): number {
    return this.data?.reduce((acc, curr) => acc + (curr.monto || 0), 0) || 0;
  }
}

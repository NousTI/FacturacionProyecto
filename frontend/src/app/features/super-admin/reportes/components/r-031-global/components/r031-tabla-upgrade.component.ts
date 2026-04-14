import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaZonaUpgrade } from '../../../services/reportes.service';

@Component({
  selector: 'app-r031-tabla-upgrade',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-tabla shadow-sm">
      <div class="tabla-header d-flex justify-content-between align-items-center p-3">
        <h6 class="mb-0"><i class="bi bi-graph-up text-success me-2"></i>Zona de Upgrade (Uso Crítico de Plan)</h6>
        <span class="badge bg-success-subtle text-success">{{ empresas.length }} empresas</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan Actual</th>
              <th class="text-center">Límite Facturas</th>
              <th class="text-center">Uso Mes</th>
              <th>Progreso de Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of empresas">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-sm bg-success-subtle text-success">{{ e.nombre_empresa.charAt(0) }}</div>
                  <span class="fw-bold text-dark">{{ e.nombre_empresa }}</span>
                </div>
              </td>
              <td><span class="badge bg-light text-dark border">{{ e.plan_nombre }}</span></td>
              <td class="text-center"><span class="fw-medium">{{ e.max_facturas_mes }}</span></td>
              <td class="text-center text-primary-emphasis fw-bold">{{ e.facturas_mes }}</td>
              <td>
                <div class="progress-container">
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar" 
                      [ngClass]="getProgressClass(e.porcentaje_uso)"
                      role="progressbar" 
                      [style.width.%]="e.porcentaje_uso > 100 ? 100 : e.porcentaje_uso"
                      [attr.aria-valuenow]="e.porcentaje_uso" 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                    </div>
                  </div>
                  <small class="ms-2 fw-bold" [ngClass]="getTextClass(e.porcentaje_uso)">{{ e.porcentaje_uso }}%</small>
                </div>
              </td>
            </tr>
            <tr *ngIf="empresas.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-bar-chart fs-1 d-block mb-2 text-muted opacity-50"></i>
                No hay empresas identificadas con uso crítico en este periodo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
    .tabla-header { background: #f0fdf4; border-bottom: 1px solid #dcfce7; }
    
    th { background: #f8fafc; padding: 0.75rem 1rem; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .avatar-sm { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    
    .progress-container { display: flex; align-items: center; min-width: 150px; }
    .progress { flex: 1; background-color: #f1f5f9; border-radius: 10px; }
    
    .bg-success-subtle { background-color: #dcfce7 !important; }
    .text-success { color: #166534 !important; }
  `]
})
export class R031TablaUpgradeComponent {
  @Input() empresas: EmpresaZonaUpgrade[] = [];

  getProgressClass(pct: number): string {
    if (pct >= 95) return 'bg-danger';
    if (pct >= 80) return 'bg-warning';
    return 'bg-success';
  }

  getTextClass(pct: number): string {
    if (pct >= 95) return 'text-danger';
    if (pct >= 80) return 'text-warning';
    return 'text-success';
  }
}

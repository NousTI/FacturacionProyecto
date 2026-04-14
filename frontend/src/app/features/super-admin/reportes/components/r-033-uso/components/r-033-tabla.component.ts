import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-r-033-tabla',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-tabla">
      <div class="tabla-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-table me-2"></i>Uso por empresa ({{ empresas.length }} empresas)</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Empresa</th>
              <th class="text-center">Usuarios</th>
              <th class="text-center">Fact. Periodo</th>
              <th>% de uso</th>
              <th class="text-center">Módulos</th>
              <th>Último acceso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of empresas">
              <td>
                <div class="d-flex flex-column">
                  <span class="fw-bold text-dark">{{ e.empresa }}</span>
                  <span class="text-muted small badge bg-light text-dark border align-self-start">{{ e.plan_nombre || 'Sin plan' }}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="fw-semibold">{{ e.usuarios_activos }}</span><span class="text-muted small">/{{ e.total_usuarios }}</span>
              </td>
              <td class="text-center">
                <span class="fw-semibold">{{ e.facturas_mes }}</span><span class="text-muted small">/{{ e.max_facturas_mes || '∞' }}</span>
              </td>
              <td>
                <div class="progress-container">
                  <div class="progress-bar-stack">
                    <div class="progress-fill"
                      [style.width.%]="e.porcentaje_uso > 100 ? 100 : e.porcentaje_uso"
                      [ngClass]="getUsoClass(e.porcentaje_uso)">
                    </div>
                  </div>
                  <span class="progress-text fw-bold" [ngClass]="getUsoTextClass(e.porcentaje_uso)">{{ e.porcentaje_uso }}%</span>
                </div>
              </td>
              <td class="text-center">
                <div class="modulos-indicator">
                   <span class="indicator-val">{{ e.modulos_usados }}</span>
                   <span class="indicator-sep">/</span>
                   <span class="indicator-total">{{ e.modulos_total }}</span>
                </div>
              </td>
              <td class="text-muted small">{{ e.ultimo_acceso_fmt || 'Sin acceso' }}</td>
            </tr>
            <tr *ngIf="empresas.length === 0">
              <td colspan="6" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                Sin datos disponibles para los filtros seleccionados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .tabla-header { background: #f8fafc; padding: 1rem 1.25rem; font-weight: 700; font-size: 0.9rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; }
    
    th { background: #f8fafc; padding: 0.75rem 1rem; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    tbody tr:hover td { background: #f1f5f9; }
    
    .progress-container { display: flex; align-items: center; gap: 0.5rem; width: 140px; }
    .progress-bar-stack { flex: 1; height: 0.5rem; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
    .progress-text { font-size: 0.75rem; width: 45px; }
    
    .modulos-indicator { display: inline-flex; align-items: center; background: #eff6ff; color: #1e40af; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 700; font-size: 0.75rem; border: 1px solid #dbeafe; }
    .indicator-sep { margin: 0 2px; opacity: 0.5; font-weight: 400; }
    
    .bg-success { background-color: #10b981 !important; }
    .bg-warning { background-color: #f59e0b !important; }
    .bg-danger { background-color: #ef4444 !important; }
    .text-success { color: #059669 !important; }
    .text-warning { color: #d97706 !important; }
    .text-danger { color: #dc2626 !important; }
  `]
})
export class R033TablaComponent {
  private _empresas: any[] = [];
  
  @Input() set empresas(val: any[]) {
    this._empresas = val;
    console.log('R033Tabla: Recibidas empresas:', val?.length ? val[0] : 'Vacio');
  }
  
  get empresas(): any[] {
    return this._empresas;
  }

  getUsoClass(pct: number): string {
    if (pct >= 90) return 'bg-danger';
    if (pct >= 70) return 'bg-warning';
    return 'bg-success';
  }

  getUsoTextClass(pct: number): string {
    if (pct >= 90) return 'text-danger';
    if (pct >= 70) return 'text-warning';
    return 'text-success';
  }
}

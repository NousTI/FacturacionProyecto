import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editorial-card p-4">
      <div class="card-header-minimal mb-3 border-0 bg-transparent p-0">
        <i class="bi bi-graph-up-arrow me-2 text-primary"></i> Resumen de Negocio
      </div>
      <div class="row g-3">
        <div class="col-6">
          <div class="info-row mb-0">
            <label class="editorial-label">Empresas Asignadas</label>
            <div class="value-highlight">{{ empresasAsignadas }}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="info-row mb-0">
            <label class="editorial-label">Total Ganado</label>
            <div class="value-highlight text-success">{{ ingresosGenerados | currency }}</div>
          </div>
        </div>
        <div class="col-12 mt-3 pt-3 border-top">
           <div class="info-row mb-0">
            <label class="editorial-label">Fecha de Registro</label>
            <div class="value-small">{{ fechaRegistro | date:'longDate' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { max-width: none !important; margin: 0 !important; padding: 1.5rem !important; }
    .card-header-minimal {
      font-weight: 800; font-size: 0.9rem; color: var(--primary-color);
    }
    .info-row label { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; display: block; }
    .value-highlight { font-size: 1.5rem; font-weight: 800; color: var(--primary-color); line-height: 1.2; }
    .value-small { font-size: 0.9rem; font-weight: 600; color: #64748b; }
    .border-top { border-top: 1px solid var(--border-color) !important; }
  `]
})
export class BusinessSummaryCardComponent {
  @Input() empresasAsignadas: number = 0;
  @Input() ingresosGenerados: number = 0;
  @Input() fechaRegistro: string = '';
}

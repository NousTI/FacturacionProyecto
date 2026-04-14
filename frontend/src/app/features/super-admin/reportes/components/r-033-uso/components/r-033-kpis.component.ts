import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-r-033-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid mb-4">
      <div class="kpi-card">
        <span class="kpi-label">Promedio usuarios/empresa</span>
        <span class="kpi-value">{{ promedioUsuarios ?? 0 | number:'1.1-1' }}</span>
        <span class="kpi-sub text-muted">usuarios por empresa</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Máx. usuarios en una empresa</span>
        <span class="kpi-value">{{ maxUsuarios ?? 0 }}</span>
        <span class="kpi-sub text-muted">usuarios</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Mín. usuarios en una empresa</span>
        <span class="kpi-value">{{ minUsuarios ?? 0 }}</span>
        <span class="kpi-sub text-muted">usuarios</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Empresas activas analizadas</span>
        <span class="kpi-value">{{ totalEmpresas }}</span>
        <span class="kpi-sub text-muted">en el sistema</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; background: #f8fafc; }
    .kpi-label { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #161d35; display: block; }
    .kpi-sub { font-size: 0.7rem; color: #64748b; }
  `]
})
export class R033KpisComponent {
  @Input() promedioUsuarios: number | null = 0;
  @Input() maxUsuarios: number | null = 0;
  @Input() minUsuarios: number | null = 0;
  @Input() totalEmpresas: number = 0;
}

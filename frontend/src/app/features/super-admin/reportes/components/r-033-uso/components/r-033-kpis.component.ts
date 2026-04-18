import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-r-033-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid mb-4">
      <div class="kpi-card highlight">
        <span class="kpi-label">Total empresas en el sistema</span>
        <span class="kpi-value">{{ totalEmpresas }}</span>
        <span class="kpi-sub">en el sistema</span>
      </div>
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
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      min-height: 95px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e2e8f0; }
    .kpi-card.highlight {
      background: var(--gradient-highlight);
      border-color: transparent;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .kpi-card.highlight .kpi-label { color: rgba(255,255,255,0.8); }
    .kpi-card.highlight .kpi-value { color: #fff; }
    .kpi-card.highlight .kpi-sub   { color: rgba(255,255,255,0.75); }
    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #0f172a; display: block; line-height: 1.2; }
    .kpi-sub { font-size: 0.72rem; font-weight: 600; color: #64748b; }
  `]
})
export class R033KpisComponent {
  @Input() promedioUsuarios: number | null = 0;
  @Input() maxUsuarios: number | null = 0;
  @Input() minUsuarios: number | null = 0;
  @Input() totalEmpresas: number = 0;
}

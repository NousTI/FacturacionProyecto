import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoStats } from '../../../../domain/models/gasto.model';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-egresos-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="stats-grid" *ngIf="stats">
      <app-stat-card
        title="Total de Egresos"
        [value]="stats.total_monto"
        icon="bi-cash-coin"
        iconColor="#2563eb"
        [isCurrency]="true"
      ></app-stat-card>

      <app-stat-card
        title="Gastos Pagados"
        [value]="stats.pagados"
        icon="bi-check-circle-fill"
        iconColor="#059669"
      >
        <span class="text-xs text-muted ms-1">completados</span>
      </app-stat-card>

      <app-stat-card
        title="Gastos Pendientes"
        [value]="stats.pendientes"
        icon="bi-clock-history"
        iconColor="#d97706"
      >
        <span class="text-xs text-muted ms-1">requieren acción</span>
      </app-stat-card>

      <app-stat-card
        title="Total Registros"
        [value]="stats.total"
        icon="bi-journal-text"
        iconColor="#7c3aed"
      ></app-stat-card>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .text-xs { font-size: 0.75rem; }
  `]
})
export class EgresosStatsComponent {
  @Input() stats: GastoStats | null = null;
}

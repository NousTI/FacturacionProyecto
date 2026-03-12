import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="period-selector d-flex p-1 bg-white border rounded-pill shadow-sm">
      <button (click)="onPeriodChange.emit('day')" 
              [class.active]="selectedPeriod === 'day'"
              class="btn btn-sm rounded-pill px-3 border-0 py-1 transition-all">Hoy</button>
      <button (click)="onPeriodChange.emit('week')" 
              [class.active]="selectedPeriod === 'week'"
              class="btn btn-sm rounded-pill px-3 border-0 py-1 transition-all">Semana</button>
      <button (click)="onPeriodChange.emit('month')" 
              [class.active]="selectedPeriod === 'month'"
              class="btn btn-sm rounded-pill px-3 border-0 py-1 transition-all">Mes</button>
    </div>
  `,
  styles: [`
    .period-selector .btn {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      background: transparent;
    }
    .period-selector .btn.active {
      background: #6366f1 !important;
      color: white !important;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
    }
    .transition-all {
        transition: all 0.2s ease-in-out;
    }
  `]
})
export class PeriodSelectorComponent {
  @Input() selectedPeriod: 'day' | 'week' | 'month' = 'month';
  @Output() onPeriodChange = new EventEmitter<'day' | 'week' | 'month'>();
}

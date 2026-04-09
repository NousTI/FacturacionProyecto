import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporte-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reporte-card" [class.actionable-card]="isActionable">
      <div class="reporte-info">
        <div class="reporte-icon" [ngClass]="iconBgClass">
          <i class="bi" [ngClass]="iconClass"></i>
        </div>
        <div>
          <h4 class="reporte-title">{{ title }}</h4>
          <p class="reporte-desc">{{ description }}</p>
        </div>
      </div>

      <div class="reporte-content">
        <ng-content></ng-content>
      </div>

      <button 
        class="btn-generar mt-auto" 
        [ngClass]="buttonClass"
        [disabled]="disabled || loading" 
        (click)="onAction()">
        <i class="bi" [class]="loading ? 'bi-hourglass-split' : buttonIcon"></i>
        {{ loading ? loadingText : buttonText }}
      </button>
    </div>
  `,
  styles: [`
    .reporte-card {
      background: white;
      border: 1.5px solid #f1f5f9;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      transition: all 0.3s ease;
      height: 100%;
    }

    .reporte-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 10px 20px -5px rgba(0,0,0,0.04);
    }
    
    .actionable-card {
        border-left: 4px solid #0ea5e9;
    }

    .reporte-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .reporte-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .bg-info-light { background: #e0f2fe; color: #0369a1; }
    .bg-danger-light { background: #fee2e2; color: #b91c1c; }
    .bg-warning-light { background: #fef3c7; color: #b45309; }
    .bg-blue-light { background: #eff6ff; color: #1d4ed8; }

    .reporte-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.1rem;
    }

    .reporte-desc {
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.3;
      margin: 0;
    }

    .btn-generar {
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      background: #161d35;
      color: white;
      border: none;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-generar:hover:not(:disabled) {
      background: #232d4d;
      transform: translateY(-1px);
    }

    .btn-info-custom { background: #0ea5e9; }
    .btn-danger-custom { background: #ef4444; }
    .btn-warning-custom { background: #f59e0b; }
    .btn-secondary-custom { background: #475569; }

    .btn-generar:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      border: 1px dashed #cbd5e1;
    }
  `]
})
export class ReporteCardComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() iconClass: string = '';
  @Input() iconBgClass: string = 'bg-blue-light';
  @Input() buttonClass: string = '';
  @Input() buttonText: string = 'Generar';
  @Input() buttonIcon: string = 'bi-download';
  @Input() loadingText: string = 'Generando...';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() isActionable: boolean = false;

  @Output() actionClick = new EventEmitter<void>();

  onAction() {
    this.actionClick.emit();
  }
}

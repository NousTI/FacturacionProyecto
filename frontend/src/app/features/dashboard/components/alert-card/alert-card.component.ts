import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardAlert {
    type: 'danger' | 'warning' | 'info';
    message: string;
    count?: number;
}

@Component({
    selector: 'app-alert-card',
    template: `
    <div class="soft-card h-100">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h5 class="fw-bold mb-0 text-dark">ALERTAS CRÍTICAS</h5>
        <span class="badge bg-danger rounded-pill">{{ alerts.length }}</span>
      </div>
      
      <div class="alert-list">
        <div *ngFor="let alert of alerts" class="alert-item d-flex align-items-center p-3 mb-2 rounded-4" 
             [ngClass]="getAlertClass(alert)">
          <div class="alert-icon me-3">
            <i class="bi" [ngClass]="getAlertIcon(alert)"></i>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <span class="alert-message fw-medium">{{ alert.message }}</span>
              <span *ngIf="alert.count" class="alert-count fw-bold">{{ alert.count }}</span>
            </div>
          </div>
        </div>
        <div *ngIf="alerts.length === 0" class="text-center py-4">
          <i class="bi bi-check-circle-fill text-success mb-2 d-inline-block" style="font-size: 2rem;"></i>
          <p class="text-muted mb-0">Todo bajo control</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .alert-item {
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .alert-danger {
      background: #fef2f2;
      color: #991b1b;
    }
    .alert-warning {
      background: #fffbeb;
      color: #92400e;
    }
    .alert-info {
      background: #eff6ff;
      color: #1e40af;
    }
    .alert-icon i {
      font-size: 1.25rem;
    }
    .alert-message {
      font-size: 0.9rem;
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class AlertCardComponent {
    @Input() alerts: DashboardAlert[] = [];

    getAlertClass(alert: DashboardAlert) {
        return {
            'alert-danger': alert.type === 'danger',
            'alert-warning': alert.type === 'warning',
            'alert-info': alert.type === 'info'
        };
    }

    getAlertIcon(alert: DashboardAlert) {
        return {
            'bi-exclamation-octagon-fill': alert.type === 'danger',
            'bi-exclamation-triangle-fill': alert.type === 'warning',
            'bi-info-circle-fill': alert.type === 'info'
        };
    }
}

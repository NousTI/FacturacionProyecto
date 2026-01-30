import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-premium-alert',
    template: `
    <div class="premium-alert-container h-100">
      <div class="d-flex flex-column align-items-center justify-content-center text-center p-4">
        <!-- Icon Context -->
        <div class="icon-premium-container mb-3" [ngClass]="type">
          <i class="bi" [ngClass]="icon"></i>
        </div>

        <h3 class="premium-title mb-2">{{ title }}</h3>
        <p class="premium-message mb-3">{{ message }}</p>
        
        <div class="premium-badge mb-0" *ngIf="count !== undefined" [ngClass]="type">
          <span class="fw-bold fs-5">{{ count }}</span>
          <span class="ms-2 small opacity-75">Pendientes</span>
        </div>

        <div class="premium-badge mb-0 success" *ngIf="count === undefined && type === 'success'">
           <i class="bi bi-check-lg me-2"></i>
           <span>Todo en orden</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .premium-alert-container {
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.08); /* Lighter shadow for widget */
      transition: all 0.3s ease;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .premium-alert-container:hover {
      transform: translateY(-5px);
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.15);
    }

    .icon-premium-container {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      transition: all 0.3s ease;
    }
    .icon-premium-container.danger { background: #fef2f2; color: #ef4444; }
    .icon-premium-container.success { background: #ecfdf5; color: #10b981; }
    .icon-premium-container.warning { background: #fffbeb; color: #f59e0b; }
    .icon-premium-container.info { background: #eff6ff; color: #3b82f6; }
    .icon-premium-container.primary { background: #f8fafc; color: #161d35; }

    .premium-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.01em;
    }
    .premium-message {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
      max-width: 90%;
    }

    .premium-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1.25rem;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .premium-badge.danger { background: #fef2f2; color: #ef4444; }
    .premium-badge.success { background: #ecfdf5; color: #10b981; }
    .premium-badge.warning { background: #fffbeb; color: #f59e0b; }
    .premium-badge.info { background: #eff6ff; color: #3b82f6; }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class PremiumAlertComponent {
    @Input() title: string = 'Estado del Sistema';
    @Input() message: string = 'Resumen de alertas';
    @Input() count?: number;
    @Input() type: 'danger' | 'success' | 'warning' | 'info' | 'primary' = 'primary';
    @Input() icon: string = 'bi-shield-check';
}

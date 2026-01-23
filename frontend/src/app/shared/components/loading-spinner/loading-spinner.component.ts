import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-spinner',
    template: `
    <div *ngIf="visible" class="spinner-overlay" [class.full-page]="fullPage">
      <div class="spinner-container">
        <div class="premium-spinner"></div>
        <p *ngIf="message" class="loading-message mt-3">{{ message }}</p>
      </div>
    </div>
  `,
    styles: [`
    .spinner-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .spinner-overlay.full-page {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      z-index: 10005;
    }
    .premium-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #161d35;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-message {
      font-size: 0.9rem;
      font-weight: 700;
      color: #161d35;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class LoadingSpinnerComponent {
    @Input() visible: boolean = false;
    @Input() fullPage: boolean = false;
    @Input() message: string = '';
}

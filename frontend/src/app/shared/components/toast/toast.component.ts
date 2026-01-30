import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, Toast } from '../../services/ui.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  template: `
    <div *ngIf="toast$ | async as toast" 
         class="toast-wrapper animate__animated animate__fadeInRight">
      
      <div class="premium-toast shadow-premium">
        <!-- Icon Container -->
        <div class="icon-toast-container" [ngClass]="toast.type">
          <i class="bi" [ngClass]="getIcon(toast.type)"></i>
        </div>

        <!-- Content -->
        <div class="toast-content">
          <h6 class="toast-title">{{ toast.message }}</h6>
          <p *ngIf="toast.description" class="toast-desc">{{ toast.description }}</p>
        </div>

        <!-- Close -->
        <button (click)="close()" class="btn-close-toast">
          <i class="bi bi-x"></i>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 20000;
      min-width: 320px;
      max-width: 400px;
    }
    
    .premium-toast {
      background: #ffffff;
      border-radius: 20px;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 20px 40px -10px rgba(22, 29, 53, 0.15);
      border: 1px solid rgba(226, 232, 240, 0.6);
      position: relative;
    }

    .icon-toast-container {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .icon-toast-container.success { background: #ecfdf5; color: #10b981; }
    .icon-toast-container.danger { background: #fef2f2; color: #ef4444; }
    .icon-toast-container.warning { background: #fffbeb; color: #f59e0b; }
    .icon-toast-container.info { background: #eff6ff; color: #3b82f6; }

    .toast-content {
      flex: 1;
      padding-top: 0.15rem;
    }

    .toast-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
      line-height: 1.3;
    }

    .toast-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    .btn-close-toast {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      padding: 0;
      line-height: 1;
      cursor: pointer;
      transition: color 0.2s;
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
    }
    .btn-close-toast:hover {
      color: #64748b;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ToastComponent implements OnInit {
  toast$: Observable<Toast | null>;

  constructor(private uiService: UiService) {
    this.toast$ = this.uiService.toast$;
  }

  ngOnInit(): void { }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'danger': return 'bi-exclamation-octagon-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  close() {
    this.uiService.hideToast();
  }
}

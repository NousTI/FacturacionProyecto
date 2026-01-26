import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { notify, Notification } from './notify';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 10000">
      <div *ngFor="let n of notifications" 
           class="custom-toast show animate__animated animate__fadeInRight" 
           [ngClass]="getToastClass(n.type)"
           role="alert">
        <div class="d-flex align-items-center p-3">
          <div class="toast-icon me-3">
             <i class="bi" [ngClass]="getIcon(n.type)"></i>
          </div>
          <div class="toast-content flex-grow-1">
            <div class="toast-message fw-bold">{{ n.message }}</div>
            <div *ngIf="n.description" class="toast-description small opacity-80">{{ n.description }}</div>
          </div>
          <button type="button" class="btn-close-custom ms-2" 
                  (click)="remove(n.id)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
    }
    .custom-toast {
        background: white;
        border-radius: 16px;
        min-width: 320px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border: 1px solid rgba(0,0,0,0.05);
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .toast-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    .toast-message {
        color: #1a1a1a;
        font-size: 0.95rem;
        line-height: 1.4;
    }
    .toast-description {
        color: #666;
        margin-top: 2px;
    }
    .btn-close-custom {
        background: none;
        border: none;
        color: #999;
        font-size: 0.9rem;
        padding: 4px;
        cursor: pointer;
        transition: color 0.2s;
        display: flex;
        align-items: center;
    }
    .btn-close-custom:hover {
        color: #333;
    }

    /* Types Styling */
    .toast-success .toast-icon {
        background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
        color: white;
    }
    .toast-error .toast-icon {
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        color: white;
    }
    .toast-warning .toast-icon {
        background: linear-gradient(135deg, #f2994a 0%, #f2c94c 100%);
        color: white;
    }
    .toast-info .toast-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
    }

    /* Left Accent */
    .custom-toast::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
    }
    .toast-success::before { background: #00b09b; }
    .toast-error::before { background: #ff416c; }
    .toast-warning::before { background: #f2994a; }
    .toast-info::before { background: #4facfe; }
  `]
})
export class ToastsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    notify.notifications$.subscribe(list => {
      this.notifications = list;
      this.cdr.detectChanges();
    });
  }

  remove(id: number) {
    notify.remove(id);
  }

  getToastClass(type: string) {
    return `toast-${type}`;
  }

  getIcon(type: string) {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-bell-fill';
    }
  }
}

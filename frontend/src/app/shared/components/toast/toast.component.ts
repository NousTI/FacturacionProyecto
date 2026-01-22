import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, Toast } from '../../services/ui.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  template: `
    <div *ngIf="toast$ | async as toast" 
         class="toast-wrapper animate__animated animate__fadeInRight"
         [ngClass]="'bg-' + toast.type">
      <div class="d-flex align-items-start gap-3 px-4 py-3 text-white shadow-lg rounded-4">
        <i class="bi" [ngClass]="getIcon(toast.type)" style="font-size: 1.25rem; margin-top: 0.2rem;"></i>
        <div class="d-flex flex-column">
          <span class="fw-bold">{{ toast.message }}</span>
          <span *ngIf="toast.description" class="small opacity-75 mt-1" style="font-size: 0.9em;">
            {{ toast.description }}
          </span>
        </div>
        <button (click)="close()" class="btn-close btn-close-white ms-auto shadow-none"></button>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 20000;
      min-width: 300px;
    }
    .bg-success { background-color: #10b981 !important; }
    .bg-danger { background-color: #ef4444 !important; }
    .bg-warning { background-color: #f59e0b !important; }
    .bg-info { background-color: #3b82f6 !important; }
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
      case 'danger': return 'bi-exclamation-triangle-fill';
      case 'warning': return 'bi-exclamation-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  close() {
    this.uiService.hideToast();
  }
}

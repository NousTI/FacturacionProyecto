import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, take } from 'rxjs';
import { LockStatusService, LockInfo } from '../../../core/services/lock-status.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lock-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="lock$ | async as lock" class="lock-overlay animate__animated animate__fadeIn">
      <div class="lock-panel text-center shadow-lg p-5">
        <div class="icon-wrap mb-4 pulse-animation">
          <i class="bi" [ngClass]="lock.icon"></i>
        </div>
        
        <h2 class="fw-bold mb-3 text-dark">{{ lock.title }}</h2>
        <p class="text-secondary mb-4 px-3" style="font-size: 1.1rem; line-height: 1.6;">
          {{ lock.message }}
        </p>
        
        <div class="d-grid gap-3 px-4">
          <button *ngIf="lock.showPayments" 
                  class="btn btn-primary fw-bold py-3 shadow-sm border-0"
                  style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"
                  (click)="goToPayments()">
            <i class="bi bi-whatsapp me-2"></i>Renovar Plan ahora
          </button>
          
          <button *ngIf="lock.showSupport" 
                  class="btn btn-outline-secondary fw-bold py-2 border-0 bg-light-subtle"
                  (click)="goToSupport()">
            <i class="bi bi-chat-left-dots me-2"></i>Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lock-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
    }

    .lock-panel {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 32px;
      max-width: 480px;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .icon-wrap {
      width: 90px; height: 90px;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
      font-size: 3rem;
    }

    .pulse-animation {
      animation: icon-pulse 2s infinite ease-in-out;
    }

    @keyframes icon-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .btn { border-radius: 16px; transition: all 0.3s ease; }
    .btn:hover { transform: translateY(-2px); }
  `]
})
export class LockOverlayComponent {
  lock$: Observable<LockInfo | null>;

  constructor(
    private lockService: LockStatusService,
    private router: Router
  ) {
    this.lock$ = this.lockService.lock$;
  }

  goToPayments() {
    this.lockService.lock$.pipe(take(1)).subscribe(lock => {
      if (lock?.phone && lock?.whatsappMessage) {
        const url = `https://wa.me/${lock.phone}?text=${encodeURIComponent(lock.whatsappMessage)}`;
        window.open(url, '_blank');
      } else {
        this.lockService.clearLock();
        this.router.navigate(['/usuario/empresa']);
      }
    });
  }

  goToSupport() {
    this.lockService.lock$.pipe(take(1)).subscribe(lock => {
      if (lock?.phone && lock?.whatsappMessage) {
        const url = `https://wa.me/${lock.phone}?text=${encodeURIComponent(lock.whatsappMessage)}`;
        window.open(url, '_blank');
      } else {
        window.open('mailto:soporte@tuempresa.com', '_blank');
      }
    });
  }

  logout() {
    this.lockService.clearLock();
    this.router.navigate(['/auth/logout']);
  }
}

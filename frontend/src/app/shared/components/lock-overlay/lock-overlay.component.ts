import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, take, retry, catchError, of } from 'rxjs';
import { LockStatusService, LockInfo } from '../../../core/services/lock-status.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-lock-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!(isLoggingOut$ | async)">
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
          <a *ngIf="whatsappUrl"
             [href]="whatsappUrl"
             target="_blank"
             class="btn btn-success fw-bold py-3 shadow-sm border-0"
             style="background: #25d366; color: white; text-decoration: none;">
            <i class="bi bi-whatsapp me-2"></i>Contactar por WhatsApp
          </a>

          <button class="btn btn-outline-secondary fw-bold py-2 border-0 bg-light-subtle"
                  (click)="close()">
            <i class="bi bi-x-lg me-2"></i>Cerrar
          </button>
        </div>
      </div>
    </div>
    </ng-container>
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
export class LockOverlayComponent implements OnInit {
  lock$: Observable<LockInfo | null>;
  isLoggingOut$: Observable<boolean>;
  whatsappUrl: string | null = null;

  constructor(
    private lockService: LockStatusService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.lock$ = this.lockService.lock$;
    this.isLoggingOut$ = this.lockService.isLoggingOut$;
  }

  ngOnInit() {
    // Solo cargar teléfono si está autenticado para evitar 401 en login
    if (this.authService.isAuthenticated()) {
      this.loadSuperadminPhone();
    }
  }

  private loadSuperadminPhone() {
    this.http.get<any>(`${environment.apiUrl}/configuracion/contacto`)
      .pipe(
        retry(2),
        catchError(() => of(null))
      )
      .subscribe({
        next: (res: any) => {
          if (res && res.detalles && res.detalles.telefono) {
            const tel = res.detalles.telefono;
            const cleaned = tel.replace(/\D/g, '');
            if (cleaned) {
              this.whatsappUrl = `https://wa.me/${cleaned}`;
            }
          }
        }
      });
  }

  close() {
    this.lockService.clearLock();
  }
}

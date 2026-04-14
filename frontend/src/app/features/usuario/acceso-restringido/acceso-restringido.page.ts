import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { Observable, map, take } from 'rxjs';

@Component({
  selector: 'app-acceso-restringido',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="restriction-container animate__animated animate__fadeIn">
      <div class="restriction-card shadow-lg">
        <div class="icon-box">
          <i class="bi bi-shield-slash-fill text-danger"></i>
        </div>
        
        <h2 class="title">Acceso Restringido</h2>
        <div class="divider"></div>
        
        <div class="content">
          <p class="message">
            Tu acceso al sistema ha sido suspendido temporalmente.
          </p>
          
          <div class="reason-box" *ngIf="reason$ | async as reason">
            <i class="bi bi-info-circle me-2"></i>
            {{ reason }}
          </div>

          <p class="instruction">
            Por favor, contacta al administrador de tu empresa o al soporte técnico de la plataforma para regularizar tu situación.
          </p>
        </div>

        <div class="actions">
          <button (click)="logout()" class="btn-logout">
            <i class="bi bi-box-arrow-left me-2"></i>Cerrar Sesión
          </button>
        </div>
        
        <div class="footer">
          <span class="text-muted small">ID Sistema: {{ userId }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restriction-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1.5rem;
    }

    .restriction-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 480px;
      text-align: center;
      position: relative;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .icon-box {
      font-size: 4rem;
      line-height: 1;
      margin-bottom: 1.5rem;
      filter: drop-shadow(0 10px 8px rgba(239, 68, 68, 0.2));
    }

    .title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .divider {
      height: 4px;
      width: 50px;
      background: #ef4444;
      margin: 1rem auto 1.5rem;
      border-radius: 2px;
    }

    .content {
      margin-bottom: 2rem;
    }

    .message {
      font-size: 1.1rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 1rem;
    }

    .reason-box {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .instruction {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .actions {
      margin-bottom: 1.5rem;
    }

    .btn-logout {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-logout:hover {
      background: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }

    .footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
    }
  `]
})
export class AccesoRestringidoPage {
  userId: string = '';
  reason$: Observable<string | null>;

  constructor(
    private authFacade: AuthFacade,
    private router: Router
  ) {
    this.reason$ = this.authFacade.user$.pipe(
      map(user => {
        this.userId = user?.id?.substring(0, 8) || '---';
        if (user?.empresa_activa === false) return 'Empresa desactivada por el administrador.';
        if (user?.empresa_suscripcion_estado && user.empresa_suscripcion_estado !== 'ACTIVA') {
          return `Suscripción ${user.empresa_suscripcion_estado.toLowerCase()}.`;
        }
        return 'Restricciones de cuenta activas.';
      })
    );
  }

  logout() {
    this.authFacade.logout().subscribe();
  }
}

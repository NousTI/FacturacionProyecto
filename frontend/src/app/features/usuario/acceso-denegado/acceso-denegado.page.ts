import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { take } from 'rxjs';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="denied-container animate__animated animate__fadeIn">
      <div class="denied-card shadow-lg">
        
        <div class="icon-box">
          <i class="bi bi-shield-slash-fill"></i>
        </div>

        <h2 class="title">Acceso Denegado</h2>
        <div class="divider"></div>

        <div class="content">
          <p class="message">Tu usuario fue inhabilitado. Por favor, contáctate con un administrador de la empresa.</p>
          
          <div class="info-box">
            <i class="bi bi-info-circle me-2"></i>
            Esta restricción es gestionada por el personal administrativo de tu empresa.
          </div>
        </div>

        <div class="actions">
          <button (click)="logout()" class="btn-logout">
            <i class="bi bi-box-arrow-left me-2"></i>Cerrar Sesión
          </button>
        </div>

        <div class="footer">
          <span class="text-muted small">ID Usuario: {{ userId }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .denied-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 2rem;
      margin: 0;
      overflow-y: auto;
    }

    .denied-card {
      background: white;
      border-radius: 28px;
      padding: 3.5rem 2.5rem;
      width: 100%;
      max-width: 480px;
      text-align: center;
      position: relative;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 40px 80px -20px rgba(15, 23, 42, 0.15);
    }

    .icon-box {
      font-size: 4.5rem;
      line-height: 1;
      margin-bottom: 2rem;
      color: #f43f5e;
      filter: drop-shadow(0 10px 15px rgba(244, 63, 94, 0.2));
    }

    .title {
      font-size: 2rem;
      font-weight: 850;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .divider {
      height: 4px;
      width: 60px;
      background: #f43f5e;
      margin: 1.5rem auto 2rem;
      border-radius: 100px;
    }

    .message {
      font-size: 1.15rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      border-radius: 16px;
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 2.5rem;
      text-align: left;
      display: flex;
      align-items: center;
    }

    .actions {
      margin-bottom: 1.5rem;
    }

    .btn-logout {
      width: 100%;
      padding: 1rem 1.5rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 16px;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .btn-logout:hover {
      background: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -10px rgba(15, 23, 42, 0.4);
    }

    .footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 1.5rem;
      margin-top: 1rem;
    }
  `]
})
export class AccesoDenegadoPage implements OnInit {
  userId: string = '---';
  private authFacade = inject(AuthFacade);

  ngOnInit() {
    this.authFacade.user$.pipe(take(1)).subscribe(user => {
      this.userId = user?.id?.substring(0, 8) || '---';
    });
  }

  logout() {
    this.authFacade.logout().subscribe();
  }
}


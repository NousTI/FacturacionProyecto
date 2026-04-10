import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../../../core/auth/auth.facade';

@Component({
  selector: 'app-vendedor-bloqueado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bloqueado-container">
      <div class="bloqueado-content">
        <!-- Icono de candado -->
        <div class="lock-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C6.48 1 2 5.48 2 11v10c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V11c0-5.52-4.48-10-10-10zm0 3c1.66 0 3 1.34 3 3v4H9v-4c0-1.66 1.34-3 3-3zm5 15H7v-3h10v3zm0-5H7v-2h10v2z"/>
          </svg>
        </div>

        <!-- Título -->
        <h1>Tu cuenta ha sido bloqueada</h1>

        <!-- Descripción -->
        <p>Tu acceso ha sido restringido por un superadministrador. Para más información o resolver este problema, contacta con un superadministrador de la plataforma.</p>

        <!-- Botón de logout -->
        <button
          (click)="cerrarSesion()"
          class="logout-btn"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bloqueado-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      overflow: hidden;
    }

    .bloqueado-content {
      background: white;
      border-radius: 12px;
      padding: 3rem 2rem;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .lock-icon {
      margin-bottom: 2rem;
      color: #e74c3c;
    }

    .lock-icon svg {
      width: 80px;
      height: 80px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.75rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }

    p {
      font-size: 1rem;
      color: #7f8c8d;
      line-height: 1.6;
      margin: 0 0 2rem 0;
    }

    .logout-btn {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
    }

    .logout-btn:hover {
      background-color: #c0392b;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
    }

    .logout-btn:active {
      transform: translateY(0);
    }
  `]
})
export class VendedorBloqueadoComponent {
  constructor(private authFacade: AuthFacade) {}

  cerrarSesion(): void {
    this.authFacade.logout();
  }
}

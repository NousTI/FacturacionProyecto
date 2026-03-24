import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { UserRole } from '../../../domain/enums/role.enum';

@Component({
  selector: 'app-private-layout',
  template: `
    <div class="dashboard-wrapper">
      <app-sidebar class="sidebar-container"></app-sidebar>
      <div class="main-content">
        <app-navbar></app-navbar>
        
        <div *ngIf="isSubscriptionInactive" class="subscription-alert">
            <span class="icon">⚠️</span>
            <div class="message">
                <strong>Suscripción Inactiva:</strong> 
                Su cuenta se encuentra restringida por falta de pago o cancelación.
            </div>
            <button class="action-btn" (click)="goToSubscription()">Actualizar Plan</button>
        </div>

        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </div>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      height: 100vh;
      background-color: #f8f9fe;
      overflow: hidden;
    }
    .sidebar-container {
      width: 280px;
      flex-shrink: 0;
      background: white;
      border-right: 1px solid rgba(0,0,0,0.05);
    }
    .main-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .content-body {
      padding: 24px;
      flex-grow: 1;
      overflow-y: auto;
      background-color: var(--bg-main);
      display: flex;
      flex-direction: column;
    }
    .subscription-alert {
        background: #fff5f5;
        border-bottom: 2px solid #feb2b2;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        color: #c53030;
        animation: slideDown 0.3s ease-out;
    }
    .subscription-alert .icon { font-size: 1.2rem; }
    .subscription-alert .message { flex-grow: 1; font-size: 0.95rem; }
    .subscription-alert .action-btn {
        background: #c53030;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    .subscription-alert .action-btn:hover { background: #9b2c2c; }
    
    @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
    }
  `],
  standalone: false
})
export class PrivateLayoutComponent implements OnInit { 
    isSubscriptionInactive = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const user = this.authService.getUser();
        if (user) {
            const isUser = user.role === UserRole.USUARIO;
            const isNotActive = user.empresa_suscripcion_estado !== 'ACTIVA';
            // Solo mostrar banner si es usuario operativo y la suscripción no está activa
            this.isSubscriptionInactive = isUser && isNotActive;

            // No mostrar el banner si ya estamos en la página de empresa (opcional, pero suele ser mejor)
            if (this.router.url.includes('/usuario/empresa')) {
                // this.isSubscriptionInactive = false; // Comentado por si quieres que se vea siempre
            }
        }
    }

    goToSubscription(): void {
        this.router.navigate(['/usuario/empresa']);
    }
}

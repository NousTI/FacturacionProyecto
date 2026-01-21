import { Component } from '@angular/core';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UserRole } from '../../../domain/enums/role.enum';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="h-100 d-flex flex-column">
      <div class="p-4 mb-2">
        <div class="logo-text d-flex align-items-center">
            <div class="logo-icon me-2">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px;">
                    <path d="M7 14L12 9L17 14" stroke="#4facfe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 18L12 13L17 18" stroke="#4facfe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
                </svg>
            </div>
            <span class="fw-bold fs-5">NousTI</span>
        </div>
      </div>

      <div class="flex-grow-1 overflow-auto px-3">
        <div class="menu-section mb-4">
          <span class="menu-label px-3 text-muted mb-2 d-block">GENERAL</span>
          <div class="list-group list-group-flush border-0">
            <a *ngIf="isSuperadmin$ | async" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1">
              <i class="bi bi-grid-fill me-3"></i> Dashboard
            </a>
            
            <ng-container *ngIf="isSuperadmin$ | async">
              <a routerLink="/dashboard/empresas" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-building me-3"></i> Empresas
              </a>
              <a routerLink="/dashboard/suscripciones" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-credit-card me-3"></i> Suscripciones y Pagos
              </a>
              <a routerLink="/dashboard/finanzas" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-wallet2 me-3"></i> Finanzas
              </a>
              <a routerLink="/dashboard/vendedores" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-people me-3"></i> Vendedores
              </a>
            </ng-container>

            <ng-container *ngIf="isVendedor$ | async">
               <a routerLink="/dashboard/facturas" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-receipt me-3"></i> Facturación
              </a>
               <a routerLink="/dashboard/clientes" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-person-lines-fill me-3"></i> Clientes
              </a>
            </ng-container>
          </div>
        </div>

        <div class="menu-section mb-4" *ngIf="isSuperadmin$ | async">
          <span class="menu-label px-3 text-muted mb-2 d-block">SISTEMA</span>
          <div class="list-group list-group-flush border-0">
            <a routerLink="/dashboard/comisiones" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-percent me-3"></i> Comisiones
            </a>
            <a routerLink="/dashboard/planes" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-tags me-3"></i> Planes
            </a>
            <a routerLink="/dashboard/certificados" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-shield-check me-3"></i> Certificados SRI
            </a>
            <a routerLink="/dashboard/reportes" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-bar-chart me-3"></i> Reportes
            </a>
            <a routerLink="/dashboard/auditoria" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-journal-text me-3"></i> Auditoría
            </a>
          </div>
        </div>

        <div class="menu-section mb-4">
          <span class="menu-label px-3 text-muted mb-2 d-block">OTROS</span>
          <div class="list-group list-group-flush border-0">
            <a routerLink="/dashboard/soporte" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-headset me-3"></i> Soporte
            </a>
            <a routerLink="/dashboard/config" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-gear me-3"></i> Configuración
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-label {
      font-size: 0.65rem;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .menu-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 12px;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
    }
    .menu-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .menu-item.active {
      background: #4facfe;
      color: white;
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
    }
    .menu-item i {
      font-size: 1.1rem;
    }
    .premium-card {
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.03);
    }
    .logo-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border-radius: 8px;
    }
  `],
  standalone: false
})
export class SidebarComponent {
  role$: Observable<UserRole | null>;
  isSuperadmin$: Observable<boolean>;
  isVendedor$: Observable<boolean>;
  isUsuario$: Observable<boolean>;

  constructor(private authFacade: AuthFacade) {
    this.role$ = this.authFacade.user$.pipe(map(user => user?.role as UserRole));

    this.isSuperadmin$ = this.role$.pipe(map(role => role === UserRole.SUPERADMIN));
    this.isVendedor$ = this.role$.pipe(map(role => role === UserRole.VENDEDOR || role === UserRole.SUPERADMIN)); // Superadmin also sees seller stuff usually? Or strictly separated which is better.
    // Making it strict per prompts instructions "Sidebar con opciones de sistema" for superadmin, "Sidebar limitada" for vendedor.
    // I'll assume they stack permissions usually, but prompting said "UI de vendedor" vs "UI de superadmin".
    // I will keep them cumulative or separate?
    // "Si es SUPERADMIN: Sidebar con opciones de sistema (placeholder por ahora)"
    // "Si es VENDEDOR: Sidebar limitada a su rol"
    // I will use precise checks.

    this.isSuperadmin$ = this.role$.pipe(map(role => role === UserRole.SUPERADMIN));
    this.isVendedor$ = this.role$.pipe(map(role => role === UserRole.VENDEDOR));
    this.isUsuario$ = this.role$.pipe(map(role => role === UserRole.USUARIO));
  }
}

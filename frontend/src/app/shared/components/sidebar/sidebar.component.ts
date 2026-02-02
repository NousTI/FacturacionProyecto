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
                    <path d="M7 14L12 9L17 14" stroke="#161d35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 18L12 13L17 18" stroke="#161d35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
                </svg>
            </div>
            <span class="fw-bold fs-5">NousTI</span>
        </div>
      </div>

      <div class="flex-grow-1 overflow-auto px-3">
        <div class="menu-section mb-4">
          <span class="menu-label px-3 text-muted mb-2 d-block">GENERAL</span>
          <div class="list-group list-group-flush border-0">
            <!-- SuperAdmin Home -->
            <a *ngIf="isSuperadmin$ | async" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1">
              <i class="bi bi-grid-fill me-3"></i> Inicio
            </a>

            <!-- Vendedor Home -->
            <a *ngIf="isVendedor$ | async" routerLink="/vendedor" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1">
              <i class="bi bi-grid-fill me-3"></i> Inicio
            </a>
            
            <ng-container *ngIf="isSuperadmin$ | async">
              <a routerLink="/empresas" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-building me-3"></i> Empresas
              </a>
              <!-- More SuperAdmin links... (unchanged) -->
              <a routerLink="/clientes" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-person-badge me-3"></i> Clientes
              </a>
              <a routerLink="/vendedores" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-people me-3"></i> Vendedores
              </a>
              <a routerLink="/suscripciones" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-credit-card me-3"></i> Suscripciones y Pagos
              </a>
              <a routerLink="/finanzas" routerLinkActive="active" class="menu-item px-3 mb-1">
                <i class="bi bi-wallet2 me-3"></i> Finanzas
              </a>
            </ng-container>

            <!-- Vendedor Menu -->
            <ng-container *ngIf="isVendedor$ | async">
               <a *appHasPermission="['acceder_empresas', 'crear_empresas']" routerLink="/vendedor/empresas" routerLinkActive="active" class="menu-item px-3 mb-1">
                 <i class="bi bi-building me-3"></i> Empresas
               </a>
                <a routerLink="/vendedor/pagos" routerLinkActive="active" class="menu-item px-3 mb-1">
                  <i class="bi bi-credit-card me-3"></i> Suscripciones y Pagos
                </a>
                <a routerLink="/vendedor/clientes" routerLinkActive="active" class="menu-item px-3 mb-1">
                  <i class="bi bi-person-badge me-3"></i> Clientes
                </a>
               <a routerLink="/vendedor/comisiones" routerLinkActive="active" class="menu-item px-3 mb-1">
                 <i class="bi bi-percent me-3"></i> Comisiones
               </a>
               <a routerLink="/vendedor/planes" routerLinkActive="active" class="menu-item px-3 mb-1">
                 <i class="bi bi-tags me-3"></i> Planes y Límites
               </a>
               <a *appHasPermission="'ver_reportes'" routerLink="/vendedor/reportes" routerLinkActive="active" class="menu-item px-3 mb-1">
                 <i class="bi bi-bar-chart me-3"></i> Reportes
               </a>
            </ng-container>

            <!-- Removed vendor specific links for now as per "ONLY Dashboard" instruction -->
          </div>
        </div>

        <div class="menu-section mb-4" *ngIf="isSuperadmin$ | async">
          <span class="menu-label px-3 text-muted mb-2 d-block">SISTEMA</span>
          <div class="list-group list-group-flush border-0">
            <a routerLink="/comisiones" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-percent me-3"></i> Comisiones
            </a>
            <a routerLink="/planes" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-tags me-3"></i> Planes y Límites
            </a>
            <a routerLink="/certificados-sri" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-shield-check me-3"></i> Certificados SRI
            </a>
            <a routerLink="/reportes" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-bar-chart me-3"></i> Reportes
            </a>
            <a routerLink="/auditoria" routerLinkActive="active" class="menu-item px-3 mb-1">
              <i class="bi bi-journal-text me-3"></i> Auditoría
            </a>
          </div>
        </div>

        <div class="menu-section mb-4" *ngIf="isSuperadmin$ | async">
          <span class="menu-label px-3 text-muted mb-2 d-block">OTROS</span>
          <div class="list-group list-group-flush border-0">
            <a routerLink="/config" routerLinkActive="active" class="menu-item px-3 mb-1">
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
      background: #161d35;
      color: white;
      box-shadow: 0 4px 12px rgba(22, 29, 53, 0.2);
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
  dashboardRoleSuffix$: Observable<string>;
  role$: Observable<UserRole | null>;
  isSuperadmin$: Observable<boolean>;
  isVendedor$: Observable<boolean>;
  isUsuario$: Observable<boolean>;
  homeLink$: Observable<string>;

  constructor(private authFacade: AuthFacade) {
    this.role$ = this.authFacade.user$.pipe(map(user => user?.role as UserRole));

    this.isSuperadmin$ = this.role$.pipe(map(role => role === UserRole.SUPERADMIN));
    this.isVendedor$ = this.role$.pipe(map(role => role === UserRole.VENDEDOR));
    this.isUsuario$ = this.role$.pipe(map(role => role === UserRole.USUARIO));

    this.dashboardRoleSuffix$ = this.role$.pipe(
      map(role => {
        if (role === UserRole.SUPERADMIN) return '';
        if (role === UserRole.VENDEDOR) return '(Vendedor)';
        if (role === UserRole.USUARIO) return '(Usuario)';
        return '';
      })
    );

    this.homeLink$ = this.role$.pipe(
      map(role => role === UserRole.VENDEDOR ? '/vendedor' : '/')
    );
  }
}

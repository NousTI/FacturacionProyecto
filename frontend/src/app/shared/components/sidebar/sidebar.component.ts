import { Component } from '@angular/core';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UserRole } from '../../../domain/enums/role.enum';
import { Observable, map } from 'rxjs';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="h-100 d-flex flex-column sidebar-inner" [class.is-collapsed]="sidebarService.isCollapsed$ | async">
      <div class="sidebar-header px-4 d-flex align-items-center border-bottom">
        <div class="logo-text d-flex align-items-center">
            <div class="logo-icon me-2">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px;">
                    <path d="M7 14L12 9L17 14" stroke="#161d35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 18L12 13L17 18" stroke="#161d35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
                </svg>
            </div>
            <span class="fw-bold fs-5 text-corporate menu-text">NousTI</span>
        </div>
      </div>

      <div class="flex-grow-1 overflow-auto px-3 py-4 custom-scrollbar">
        <div class="menu-section mb-3">
          <span class="menu-label px-3 text-muted mb-2 d-block text-uppercase">General</span>
          <div class="list-group list-group-flush border-0">
            <!-- SuperAdmin Home -->
            <a *ngIf="isSuperadmin$ | async" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1" title="Dashboard">
              <i class="bi bi-grid-fill"></i> <span class="menu-text ms-3">Dashboard</span>
            </a>

            <!-- Vendedor Home -->
            <a *ngIf="isVendedor$ | async" routerLink="/vendedor" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1" title="Dashboard">
              <i class="bi bi-grid-fill"></i> <span class="menu-text ms-3">Dashboard</span>
            </a>
            
            <ng-container *ngIf="isSuperadmin$ | async">
              <a routerLink="/empresas" routerLinkActive="active" class="menu-item px-3 mb-1" title="Empresas">
                <i class="bi bi-building"></i> <span class="menu-text ms-3">Empresas</span>
              </a>
              <a routerLink="/clientes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Clientes">
                <i class="bi bi-person-badge"></i> <span class="menu-text ms-3">Clientes</span>
              </a>
              <a routerLink="/vendedores" routerLinkActive="active" class="menu-item px-3 mb-1" title="Vendedores">
                <i class="bi bi-people"></i> <span class="menu-text ms-3">Vendedores</span>
              </a>
              <a routerLink="/suscripciones" routerLinkActive="active" class="menu-item px-3 mb-1" title="Suscripciones">
                <i class="bi bi-credit-card"></i> <span class="menu-text ms-3">Suscripciones</span>
              </a>
              <a routerLink="/renovaciones" routerLinkActive="active" class="menu-item px-3 mb-1" title="Renovaciones">
                <i class="bi bi-arrow-repeat"></i> <span class="menu-text ms-3">Renovaciones</span>
              </a>
            </ng-container>

            <!-- Vendedor Menu -->
            <ng-container *ngIf="isVendedor$ | async">
               <a *appHasPermission="['acceder_empresas', 'crear_empresas']" routerLink="/vendedor/empresas" routerLinkActive="active" class="menu-item px-3 mb-1" title="Empresas">
                 <i class="bi bi-building"></i> <span class="menu-text ms-3">Empresas</span>
               </a>
                <a routerLink="/vendedor/pagos" routerLinkActive="active" class="menu-item px-3 mb-1" title="Pagos">
                  <i class="bi bi-credit-card"></i> <span class="menu-text ms-3">Pagos</span>
                </a>
                <a routerLink="/vendedor/clientes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Clientes">
                  <i class="bi bi-person-badge"></i> <span class="menu-text ms-3">Clientes</span>
                </a>
               <a routerLink="/vendedor/comisiones" routerLinkActive="active" class="menu-item px-3 mb-1" title="Comisiones">
                 <i class="bi bi-percent"></i> <span class="menu-text ms-3">Comisiones</span>
               </a>
               <a routerLink="/vendedor/planes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Planes">
                 <i class="bi bi-tags"></i> <span class="menu-text ms-3">Planes</span>
               </a>
               <a *appHasPermission="'ver_reportes'" routerLink="/vendedor/reportes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Reportes">
                 <i class="bi bi-bar-chart"></i> <span class="menu-text ms-3">Reportes</span>
               </a>
               <a routerLink="/vendedor/renovaciones" routerLinkActive="active" class="menu-item px-3 mb-1" title="Renovaciones">
                 <i class="bi bi-arrow-repeat"></i> <span class="menu-text ms-3">Renovaciones</span>
               </a>
               <a routerLink="/vendedor/perfil" routerLinkActive="active" class="menu-item px-3 mb-1" title="Mi Perfil">
                 <i class="bi bi-person-circle"></i> <span class="menu-text ms-3">Mi Perfil</span>
               </a>
            </ng-container>

            <!-- Usuario Menu -->
            <ng-container *ngIf="isUsuario$ | async">
              <a *appHasPermission="'CONFIG_EMPRESA'" routerLink="/usuario/empresa" routerLinkActive="active" class="menu-item px-3 mb-1" title="Empresa">
                 <i class="bi bi-building"></i> <span class="menu-text ms-3">Empresa</span>
              </a>
              
              <ng-container *ngIf="isEmpresaActiva$ | async">
                <ng-container *ngIf="isSuscripcionActiva$ | async">
                  <a routerLink="/usuario/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="menu-item px-3 mb-1" title="Dashboard">
                    <i class="bi bi-grid-fill"></i> <span class="menu-text ms-3">Dashboard</span>
                  </a>
                  <a *appHasPermission="'CONFIG_USUARIOS'" routerLink="/usuario/usuarios" routerLinkActive="active" class="menu-item px-3 mb-1" title="Usuarios">
                    <i class="bi bi-person"></i> <span class="menu-text ms-3">Usuarios</span>
                  </a>
                  <a *appHasPermission="'CONFIG_ROLES'" routerLink="/usuario/roles" routerLinkActive="active" class="menu-item px-3 mb-1" title="Roles">
                    <i class="bi bi-shield-check"></i> <span class="menu-text ms-3">Roles</span>
                  </a>
                  <a *appHasPermission="'CLIENTES_VER'" routerLink="/usuario/clientes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Clientes">
                    <i class="bi bi-people"></i> <span class="menu-text ms-3">Clientes</span>
                  </a>
                  <a *appHasPermission="'PRODUCTOS_VER'" routerLink="/usuario/productos" routerLinkActive="active" class="menu-item px-3 mb-1" title="Productos">
                    <i class="bi bi-box-seam"></i> <span class="menu-text ms-3">Productos</span>
                  </a>
                  <a *appHasPermission="['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS', 'FACTURAS_CREAR']" routerLink="/usuario/facturacion" routerLinkActive="active" class="menu-item px-3 mb-1" title="Facturación">
                    <i class="bi bi-receipt"></i> <span class="menu-text ms-3">Facturación</span>
                  </a>
                  <a *appHasPermission="'CUENTA_COBRAR_VER'" routerLink="/usuario/cuentas-cobrar" routerLinkActive="active" class="menu-item px-3 mb-1" title="Cuentas por Cobrar">
                    <i class="bi bi-wallet2"></i> <span class="menu-text ms-3">Cuentas por Cobrar</span>
                  </a>
                  <a *appHasPermission="'FACTURA_PROGRAMADA_VER'" routerLink="/usuario/facturacion-recurrente" routerLinkActive="active" class="menu-item px-3 mb-1" title="Fac. Recurrente">
                    <i class="bi bi-arrow-repeat"></i> <span class="menu-text ms-3">Fac. Recurrente</span>
                  </a>
                  <a *appHasPermission="['REPORTES_VER', 'REPORTES_EXPORTAR']" routerLink="/usuario/reportes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Reportes">
                    <i class="bi bi-bar-chart"></i> <span class="menu-text ms-3">Reportes</span>
                  </a>
                  <a *appHasPermission="'CONFIG_ESTABLECIMIENTOS'" routerLink="/usuario/establecimientos" routerLinkActive="active" class="menu-item px-3 mb-1" title="Establecimientos">
                    <i class="bi bi-shop"></i> <span class="menu-text ms-3">Establecimientos</span>
                  </a>
                  <a *appHasPermission="'CONFIG_ESTABLECIMIENTOS'" routerLink="/usuario/puntos-emision" routerLinkActive="active" class="menu-item px-3 mb-1" title="Puntos Emisión">
                    <i class="bi bi-printer"></i> <span class="menu-text ms-3">Puntos Emisión</span>
                  </a>
                  <a *appHasPermission="'CONFIG_SRI'" routerLink="/usuario/certificado-sri" routerLinkActive="active" class="menu-item px-3 mb-1" title="Certificado SRI">
                    <i class="bi bi-shield-lock"></i> <span class="menu-text ms-3">Certificado SRI</span>
                  </a>
                </ng-container>
              </ng-container>

              <a routerLink="/usuario/perfil" routerLinkActive="active" class="menu-item px-3 mb-1" title="Mi Perfil">
                <i class="bi bi-person-circle"></i> <span class="menu-text ms-3">Mi Perfil</span>
              </a>
            </ng-container>
          </div>
        </div>

        <div class="menu-section mb-3" *ngIf="isSuperadmin$ | async">
          <span class="menu-label px-3 text-muted mb-2 d-block text-uppercase">Sistema</span>
          <div class="list-group list-group-flush border-0">
            <a routerLink="/comisiones" routerLinkActive="active" class="menu-item px-3 mb-1" title="Comisiones">
              <i class="bi bi-percent"></i> <span class="menu-text ms-3">Comisiones</span>
            </a>
            <a routerLink="/planes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Planes">
              <i class="bi bi-tags"></i> <span class="menu-text ms-3">Planes</span>
            </a>
            <a *appHasPermission="'CONFIG_SRI'" routerLink="/certificados-sri" routerLinkActive="active" class="menu-item px-3 mb-1" title="Certificados SRI">
              <i class="bi bi-shield-check"></i> <span class="menu-text ms-3">Certificados SRI</span>
            </a>
            <a routerLink="/reportes" routerLinkActive="active" class="menu-item px-3 mb-1" title="Reportes">
              <i class="bi bi-bar-chart"></i> <span class="menu-text ms-3">Reportes</span>
            </a>
            <a routerLink="/auditoria" routerLinkActive="active" class="menu-item px-3 mb-1" title="Auditoría">
              <i class="bi bi-shield-lock"></i> <span class="menu-text ms-3">Auditoría</span>
            </a>
            <a routerLink="/perfil" routerLinkActive="active" class="menu-item px-3 mb-1" title="Mi Perfil">
              <i class="bi bi-person-circle"></i> <span class="menu-text ms-3">Mi Perfil</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Footer Action: Collapse -->
      <div class="sidebar-footer p-3 border-top">
        <button (click)="sidebarService.toggle()" class="menu-item w-100 border-0 bg-transparent text-start" [title]="(sidebarService.isCollapsed$ | async) ? 'Expandir' : 'Colapsar'">
          <i class="bi" [class.bi-arrow-left-short]="!(sidebarService.isCollapsed$ | async)" [class.bi-arrow-right-short]="(sidebarService.isCollapsed$ | async)" style="font-size: 1.5rem;"></i>
          <span class="menu-text ms-2">Colapsar</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .sidebar-inner {
      overflow-x: hidden;
      background: white;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar-header {
      height: 80px;
      min-height: 80px;
      padding: 0 1.5rem !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .menu-label {
      font-size: 0.65rem;
      letter-spacing: 1px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .menu-item {
      display: flex;
      align-items: center;
      padding: 7px 14px;
      border-radius: 10px;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      font-size: 0.835rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      white-space: nowrap;
    }
    .menu-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .menu-item.active {
      background: #161d35;
      color: white;
    }
    .menu-item i {
      font-size: 1.1rem;
      min-width: 22px;
      text-align: center;
    }
    .menu-text {
      opacity: 1;
      visibility: visible;
      transition: opacity 0.2s ease, visibility 0.2s ease, width 0.2s ease;
      display: inline-block;
      overflow: hidden;
    }
    .logo-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border-radius: 8px;
        flex-shrink: 0;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    
    /* Collapsed Styles */
    .is-collapsed .menu-text {
      width: 0;
      opacity: 0;
      visibility: hidden;
      margin-left: 0 !important;
    }
    .is-collapsed .menu-label {
      opacity: 0;
      height: 0;
      margin-bottom: 0 !important;
    }
    .is-collapsed .sidebar-header {
      justify-content: center;
      padding: 0 !important;
    }
    .is-collapsed .sidebar-header .logo-icon {
      margin-right: 0 !important;
    }
    .is-collapsed .menu-item {
      justify-content: center;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .is-collapsed .sidebar-footer {
       padding: 1rem 0 !important;
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
  isSuscripcionActiva$: Observable<boolean>;
  isEmpresaActiva$: Observable<boolean>;
  homeLink$: Observable<string>;

  constructor(
    private authFacade: AuthFacade,
    public sidebarService: SidebarService
  ) {
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

    this.isSuscripcionActiva$ = this.authFacade.user$.pipe(
      map(user => user?.empresa_suscripcion_estado === 'ACTIVA' || user?.empresa_suscripcion_estado === 'PRUEBA')
    );

    this.isEmpresaActiva$ = this.authFacade.user$.pipe(
      map(user => {
        if (!user) return true;
        if (user.role === UserRole.SUPERADMIN || user.role === UserRole.VENDEDOR) return true;
        return user.empresa_activa !== false;
      })
    );
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../shared/services/ui.service';
import { ConfigEmpresaComponent } from './components/config-empresa/config-empresa.component';
import { ConfigSriComponent } from './components/config-sri/config-sri.component';
import { ConfigRolesComponent } from './components/config-roles/config-roles.component';
import { ConfigEstablecimientosComponent } from './components/config-establecimientos/config-establecimientos.component';
import { ConfigPuntosEmisionComponent } from './components/config-puntos-emision/config-puntos-emision.component';
import { ConfigProfileComponent } from './components/config-profile/config-profile.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { PermissionsService } from '../../../core/auth/permissions.service';

interface ConfigSection {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  permission?: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule, 
    ConfigEmpresaComponent, 
    ConfigSriComponent, 
    ConfigRolesComponent, 
    ConfigEstablecimientosComponent,
    ConfigPuntosEmisionComponent,
    ConfigProfileComponent,
    HasPermissionDirective
  ],
  template: `
    <div class="config-page animate__animated animate__fadeIn">
      <!-- SIDEBAR DE CONFIGURACIÓN -->
      <aside class="config-sidebar">
        <div class="sidebar-header">
           <h2 class="sidebar-title">Configuración</h2>
           <p class="sidebar-description">Gestiona los parámetros de tu empresa</p>
        </div>

        <nav class="sidebar-nav">
           <button 
             *ngFor="let section of filteredSections" 
             class="nav-tab" 
             [class.active]="activeSection().id === section.id"
             (click)="setSection(section)"
           >
             <div class="tab-icon">
               <i class="bi" [class]="section.icon"></i>
             </div>
             <div class="tab-text">
               <span class="tab-label">{{ section.label }}</span>
             </div>
             <div class="active-indicator" *ngIf="activeSection().id === section.id"></div>
           </button>
        </nav>
      </aside>

      <!-- ÁREA DE CONTENIDO -->
      <main class="config-content">
        <div class="content-pane animate__animated animate__fadeIn">
          <header class="content-header">
            <h1 class="section-display-title">{{ activeSection().label }}</h1>
            <p class="section-subtitle">{{ activeSection().subtitle }}</p>
          </header>

          <div class="content-body">
            <!-- SECCIÓN: EMPRESA -->
            <ng-container *ngIf="activeSection().id === 'empresa'">
              <div *hasPermission="'CONFIG_EMPRESA'; else restricted">
                <app-config-empresa></app-config-empresa>
              </div>
            </ng-container>

            <!-- SECCIÓN: DATOS SRI -->
            <ng-container *ngIf="activeSection().id === 'datos-sri'">
              <div *hasPermission="'CONFIG_SRI'; else restricted">
                <app-config-sri></app-config-sri>
              </div>
            </ng-container>

            <!-- SECCIÓN: ROLES Y PERMISOS -->
            <ng-container *ngIf="activeSection().id === 'roles-permisos'">
              <div *hasPermission="'CONFIG_ROLES'; else restricted">
                <app-config-roles></app-config-roles>
              </div>
            </ng-container>

            <!-- SECCIÓN: ESTABLECIMIENTOS -->
            <ng-container *ngIf="activeSection().id === 'establecimientos'">
              <div *hasPermission="'ESTABLECIMIENTO_GESTIONAR'; else restricted">
                <app-config-establecimientos></app-config-establecimientos>
              </div>
            </ng-container>

            <!-- SECCIÓN: PUNTOS DE EMISIÓN -->
            <ng-container *ngIf="activeSection().id === 'puntos-emision'">
              <div *hasPermission="'PUNTO_EMISION_GESTIONAR'; else restricted">
                <app-config-puntos-emision></app-config-puntos-emision>
              </div>
            </ng-container>

            <!-- SECCIÓN: PERFIL -->
            <ng-container *ngIf="activeSection().id === 'perfil'">
              <app-config-profile></app-config-profile>
            </ng-container>

            <!-- SECCIONES EN CONSTRUCCIÓN -->
            <ng-container *ngIf="activeSection().id === 'other'">
              <div class="empty-placeholder">
                <div class="placeholder-card">
                   <i class="bi" [class]="activeSection().icon"></i>
                   <span>Sección {{ activeSection().label }} en construcción</span>
                </div>
              </div>
            </ng-container>

            <!-- Template para Acceso Restringido -->
            <ng-template #restricted>
              <div class="restricted-info animate__animated animate__headShake">
                <div class="restricted-icon">
                  <i class="bi bi-shield-lock"></i>
                </div>
                <h3>Acceso Restringido</h3>
                <p>No tienes los permisos necesarios (<b>{{ activeSection().permission || 'N/A' }}</b>) para ver o gestionar esta sección.</p>
                <span class="contact-hint">Contacta con tu administrador para solicitar acceso.</span>
              </div>
            </ng-template>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .config-page {
      display: flex;
      min-height: calc(100vh - 80px); /* Ajuste según el navbar global */
      background: #ffffff;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    /* SIDEBAR */
    .config-sidebar {
      width: 320px;
      background: #fcfcfd;
      border-right: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      padding: 2.5rem 0;
    }

    .sidebar-header {
      padding: 0 2rem;
      margin-bottom: 2.5rem;
    }

    .sidebar-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }

    .sidebar-description {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 500;
      line-height: 1.4;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 1rem;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;
      text-align: left;
    }

    .nav-tab:hover {
      background: #f1f5f9;
    }

    .nav-tab.active {
      background: #f1f5f9;
    }

    .tab-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
      color: #64748b;
      transition: all 0.2s;
    }

    .nav-tab.active .tab-icon {
      background: #161d35;
      color: white;
      box-shadow: 0 4px 10px rgba(22, 29, 53, 0.2);
    }

    .tab-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.2s;
    }

    .nav-tab.active .tab-label {
      color: #0f172a;
    }

    .active-indicator {
      position: absolute;
      right: 0;
      top: 25%;
      height: 50%;
      width: 4px;
      background: #161d35;
      border-radius: 4px 0 0 4px;
    }

    /* CONTENT AREA */
    .config-content {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      background: white;
      display: flex;
      flex-direction: column;
    }

    .content-pane {
      width: 100%;
      padding: 2rem;
    }

    .content-header {
      margin-bottom: 3rem;
    }

    .section-display-title {
      font-size: 3rem;
      font-weight: 900;
      letter-spacing: -0.05em;
      color: #0f172a;
      margin-bottom: 0.75rem;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      font-weight: 500;
      max-width: 600px;
    }

    .empty-placeholder {
      border: 2px dashed #f1f5f9;
      border-radius: 20px;
      padding: 5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
    }

    .placeholder-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .placeholder-card i {
      font-size: 3rem;
    }

    .placeholder-card span {
      font-weight: 600;
      font-size: 1rem;
    }

    /* Restricted Access Style */
    .restricted-info {
      background: #fffafa;
      border: 1px solid #fee2e2;
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .restricted-icon {
      width: 64px;
      height: 64px;
      background: #fee2e2;
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .restricted-info h3 {
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }
    .restricted-info p {
      color: #64748b;
      max-width: 400px;
      margin: 0;
    }
    .contact-hint {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class ConfiguracionPage implements OnInit {
  private uiService = inject(UiService);
  private permissionsService = inject(PermissionsService);

  sections: ConfigSection[] = [
    { id: 'empresa', label: 'Empresa', icon: 'bi-building', subtitle: 'Información general y datos de contacto de tu negocio.', permission: 'CONFIG_EMPRESA' },
    { id: 'datos-sri', label: 'Datos SRI', icon: 'bi-shield-check', subtitle: 'Configuración de facturación electrónica y firma digital.', permission: 'CONFIG_SRI' },
    { id: 'roles-permisos', label: 'Roles y Permisos', icon: 'bi-person-badge', subtitle: 'Gestión de accesos y perfiles de usuario.', permission: 'CONFIG_ROLES' },
    { id: 'establecimientos', label: 'Establecimientos', icon: 'bi-shop', subtitle: 'Administración de locales físicos y sucursales.', permission: 'ESTABLECIMIENTO_GESTIONAR' },
    { id: 'puntos-emision', label: 'Puntos de Emisión', icon: 'bi-printer', subtitle: 'Configuración de cajas y terminales de facturación.', permission: 'PUNTO_EMISION_GESTIONAR' },
    { id: 'perfil', label: 'Perfil', icon: 'bi-person-circle', subtitle: 'Gestiona tu información personal y seguridad.' }
  ];

  activeSection = signal<ConfigSection>(this.sections[0]);

  get filteredSections(): ConfigSection[] {
    return this.sections.filter(s => !s.permission || this.permissionsService.hasPermission(s.permission));
  }

  ngOnInit() {
    this.uiService.setPageHeader('Configuración', 'Ajustes generales del sistema');
    
    // Establecer la primera sección disponible (con permisos) como activa
    const available = this.filteredSections;
    if (available.length > 0) {
      this.activeSection.set(available[0]);
    }
  }

  setSection(section: ConfigSection) {
    this.activeSection.set(section);
  }
}

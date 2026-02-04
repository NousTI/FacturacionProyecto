import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, Observable } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ProfileService } from './services/profile.service';
import { PerfilUsuario } from '../../../domain/models/perfil.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container animate__animated animate__fadeIn">
      
      <!-- Top Section: Minimalist Header -->
      <div class="row mb-4 align-items-center">
        <div class="col">
          <h1 class="page-title">Mi Perfil</h1>
          <p class="page-subtitle">Gestiona tu identidad personal y revisa tus atribuciones en el sistema.</p>
        </div>
        <div class="col-auto">
          <button (click)="refreshProfile()" class="btn-refresh" [class.spinning]="loading$ | async">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <ng-container *ngIf="perfil$ | async as perfil; else loadingTpl">
        <div class="row g-4">
          
          <!-- LEFT COLUMN: USER SUMMARY -->
          <div class="col-lg-4">
            <div class="card card-premium h-100 overflow-hidden">
              <div class="card-profile-header text-center">
                <div class="avatar-wrapper mb-3">
                  <div class="avatar-premium">
                    {{ getInitials(perfil) }}
                  </div>
                  <div class="status-indicator" [class.active]="perfil.activo"></div>
                </div>
                <h3 class="user-fullname">{{ perfil.nombres }} {{ perfil.apellidos }}</h3>
                <span class="badge-role">{{ perfil.rol_nombre }}</span>
                <p class="text-secondary mt-2 small">{{ perfil.email }}</p>
              </div>
              
              <div class="card-body px-4 pb-4">
                <div class="info-list">
                  <div class="info-item-minimal">
                    <div class="icon-box"><i class="bi bi-phone"></i></div>
                    <div class="item-content">
                      <span class="label">Teléfono</span>
                      <span class="value">{{ perfil.telefono || 'No registrado' }}</span>
                    </div>
                  </div>
                  <div class="info-item-minimal">
                    <div class="icon-box"><i class="bi bi-shield-check"></i></div>
                    <div class="item-content">
                      <span class="label">Estado en Empresa</span>
                      <span class="value" [class.text-success]="perfil.activo">
                        {{ perfil.activo ? 'Colaborador Activo' : 'Inactivo' }}
                      </span>
                    </div>
                  </div>
                  <div class="info-item-minimal">
                    <div class="icon-box"><i class="bi bi-cpu"></i></div>
                    <div class="item-content">
                      <span class="label">Rol de Sistema</span>
                      <span class="value text-primary fw-bold">{{ perfil.system_role }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-grid mt-5">
                  <button class="btn-logout" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión Segura
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: DETAILS -->
          <div class="col-lg-8">
            <div class="d-flex flex-column gap-4">
              
              <!-- SECTION: EMPRESA -->
              <div class="card card-detail">
                <div class="card-header-premium border-0 bg-transparent">
                  <i class="bi bi-building me-2"></i> Información de la Empresa
                </div>
                <div class="card-body p-4 pt-0">
                  <div class="row align-items-center">
                    <div class="col-auto" *ngIf="perfil.empresa.logo_url">
                      <img [src]="perfil.empresa.logo_url" class="empresa-logo-md" alt="Logo">
                    </div>
                    <div class="col">
                      <h4 class="empresa-name">{{ perfil.empresa.razon_social }}</h4>
                      <p class="text-muted small mb-0">{{ perfil.empresa.ruc }} | {{ perfil.empresa.nombre_comercial || 'Sin nombre comercial' }}</p>
                    </div>
                  </div>
                  <hr class="my-4 border-light opacity-50">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <span class="detail-label">Email Corporativo</span>
                      <p class="detail-value">{{ perfil.empresa.email }}</p>
                    </div>
                    <div class="col-md-6">
                      <span class="detail-label">Dirección Fiscal</span>
                      <p class="detail-value text-truncate">{{ perfil.empresa.direccion }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION: SEGURIDAD Y PERMISOS (ACORDEÓN) -->
              <div class="card card-detail">
                <div class="card-header-premium border-0 bg-transparent">
                  <div class="d-flex justify-content-between align-items-center w-100">
                    <span><i class="bi bi-shield-lock me-2"></i> Mis Atribuciones por Módulo</span>
                    <span class="text-muted small fw-normal">{{ perfil.permisos.length }} permisos totales</span>
                  </div>
                </div>
                
                <div class="card-body p-4 pt-0">
                  <div class="accordion-premium">
                    <div *ngFor="let entry of getGroupedKeys(perfil.permisos)" class="accordion-item-premium" [class.active]="activeModule === entry">
                      <div class="accordion-header-premium" (click)="toggleModule(entry)">
                        <div class="d-flex align-items-center">
                          <div class="module-icon"><i class="bi bi-folder2-open"></i></div>
                          <div>
                            <span class="module-name text-uppercase">{{ entry }}</span>
                            <span class="module-count">{{ getPermisosByModulo(perfil.permisos, entry).length }} permisos</span>
                          </div>
                        </div>
                        <i class="bi bi-chevron-down chevron-icon"></i>
                      </div>
                      
                      <div class="accordion-content-premium">
                        <div class="permisos-detail-list">
                          <div *ngFor="let perm of getPermisosByModulo(perfil.permisos, entry)" class="permiso-detail-item">
                            <div class="permiso-id-section">
                              <span class="permiso-code">{{ perm.codigo }}</span>
                              <span class="permiso-type-badge" [class]="perm.tipo.toLowerCase()">{{ perm.tipo }}</span>
                            </div>
                            <div class="permiso-info-section">
                              <h5 class="permiso-title">{{ perm.nombre }}</h5>
                              <p class="permiso-desc">{{ perm.descripcion || 'Sin descripción detallada disponible.' }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div *ngIf="perfil.permisos.length === 0" class="text-center py-5">
                      <i class="bi bi-info-circle fs-2 text-muted mb-2 d-block"></i>
                      <p class="text-muted">No tienes permisos especiales asignados en este momento.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION: AUDITORÍA -->
              <div class="card card-detail auditoria-card">
                <div class="card-body p-4">
                  <div class="row text-center text-md-start">
                    <div class="col-md-4 mb-3 mb-md-0 border-end-md">
                      <span class="audit-label">Último Acceso</span>
                      <p class="audit-value text-primary fw-bold">{{ (perfil.ultimo_acceso | date:'medium') || 'Primera sesión' }}</p>
                    </div>
                    <div class="col-md-4 mb-3 mb-md-0 border-end-md ps-md-4">
                      <span class="audit-label">Miembro Desde</span>
                      <p class="audit-value">{{ perfil.created_at | date:'longDate' }}</p>
                    </div>
                    <div class="col-md-4 ps-md-4">
                      <span class="audit-label">Estado Global del Sistema</span>
                      <div class="d-flex align-items-center justify-content-center justify-content-md-start mt-1">
                        <span class="dot-status me-2" [class.active]="perfil.system_estado === 'ACTIVA'"></span>
                        <span class="audit-value fw-semibold">{{ perfil.system_estado }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </ng-container>

      <!-- Loading and Error Templates -->
      <ng-template #loadingTpl>
        <div class="loading-state">
           <div class="spinner-premium mb-3"></div>
           <p class="text-secondary">Cargando perfil de usuario...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 900;
      color: #161d35;
      margin-bottom: 0.25rem;
    }
    .page-subtitle {
      color: #94a3b8;
      font-size: 1rem;
    }

    /* CARDS PREMIUM */
    .card-premium {
      background: white;
      border: 1px solid #eef2f6;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }
    .card-detail {
        background: white;
        border: 1px solid #eef2f6;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.01);
    }
    .card-header-premium {
      padding: 1.5rem 1.5rem 1rem;
      font-weight: 800;
      font-size: 1.1rem;
      color: #1e293b;
      display: flex;
      align-items: center;
    }

    /* PROFILE HEADER */
    .card-profile-header {
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
      padding: 3rem 1.5rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }
    .avatar-premium {
      width: 110px;
      height: 110px;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      font-size: 2.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 30px;
      box-shadow: 0 12px 24px rgba(30, 41, 59, 0.2);
    }
    .status-indicator {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 24px;
      height: 24px;
      background: #cbd5e1;
      border: 4px solid white;
      border-radius: 50%;
    }
    .status-indicator.active {
      background: #10b981;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }
    .user-fullname {
      font-size: 1.5rem;
      font-weight: 850;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .badge-role {
      background: #f1f5f9;
      color: #475569;
      padding: 0.4rem 1rem;
      border-radius: 100px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* INFO LIST */
    .info-list {
      margin-top: 2rem;
      display: flex;
      flex-column: 1rem;
      flex-direction: column;
      gap: 1.25rem;
    }
    .info-item-minimal {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .icon-box {
      width: 42px;
      height: 42px;
      background: #f8fafc;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 1.1rem;
      border: 1px solid #f1f5f9;
    }
    .item-content {
      display: flex;
      flex-direction: column;
    }
    .item-content .label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }
    .item-content .value {
      font-size: 0.95rem;
      color: #334155;
      font-weight: 700;
    }

    /* EMPRESA SECTION */
    .empresa-logo-md {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 12px;
      padding: 8px;
      border: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .empresa-name {
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0;
    }
    .detail-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .detail-value {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.95rem;
    }

    /* ACORDEÓN PREMIUM */
    .accordion-premium {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .accordion-item-premium {
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #ffffff;
    }
    .accordion-item-premium.active {
      border-color: #1e293b;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .accordion-header-premium {
      padding: 1.25rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      user-select: none;
    }
    .accordion-header-premium:hover {
      background: #f8fafc;
    }
    .module-icon {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      color: #1e293b;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      font-size: 1.2rem;
    }
    .module-name {
      display: block;
      font-weight: 850;
      font-size: 0.9rem;
      color: #1e293b;
      letter-spacing: 0.5px;
    }
    .module-count {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .chevron-icon {
      font-size: 1.2rem;
      color: #94a3b8;
      transition: transform 0.3s;
    }
    .active .chevron-icon {
      transform: rotate(180deg);
      color: #1e293b;
    }

    /* CONTENIDO DEL ACORDEÓN */
    .accordion-content-premium {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: #fbfcfd;
    }
    .active .accordion-content-premium {
      max-height: 1000px;
      border-top: 1px solid #f1f5f9;
    }
    .permisos-detail-list {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .permiso-detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-left: 1rem;
      border-left: 2px solid #e2e8f0;
    }
    .permiso-id-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .permiso-code {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.7rem;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      color: #475569;
      font-weight: 600;
    }
    .permiso-type-badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 10px;
      border-radius: 100px;
      letter-spacing: 0.5px;
    }
    .permiso-type-badge.lectura { background: #dcfce7; color: #166534; }
    .permiso-type-badge.escritura { background: #fef9c3; color: #854d0e; }
    .permiso-type-badge.admin { background: #fee2e2; color: #991b1b; }
    .permiso-type-badge.sistema { background: #e0e7ff; color: #3730a3; }

    .permiso-title {
      font-size: 0.95rem;
      font-weight: 750;
      color: #1e293b;
      margin: 0;
    }
    .permiso-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    /* AUDITORIA */
    .auditoria-card {
        background: #f8fafc;
        border-radius: 20px;
        border: 1px dashed #e2e8f0;
    }
    .audit-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        display: block;
    }
    .audit-value {
        font-size: 1rem;
        color: #1e293b;
        margin-top: 0.2rem;
        margin-bottom: 0;
    }
    .dot-status {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #cbd5e1;
    }
    .dot-status.active {
        background: #10b981;
    }

    /* INTERACCIONES */
    .btn-refresh {
        background: white;
        border: 1px solid #e2e8f0;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        color: #64748b;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .btn-refresh:hover {
        background: #f8fafc;
        color: #1e293b;
        border-color: #cbd5e1;
    }
    .btn-logout {
        background: white;
        color: #ef4444;
        border: 1.5px solid #fee2e2;
        padding: 1rem;
        border-radius: 16px;
        font-weight: 700;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    .btn-logout:hover {
        background: #fef2f2;
        border-color: #ef4444;
    }
    .spinning i {
        animation: spin 1s linear infinite;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .loading-state {
        height: 50vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .spinner-premium {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #1e293b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @media (min-width: 768px) {
        .border-end-md { border-right: 1px solid #e2e8f0; }
    }
  `]
})
export class ProfilePage implements OnInit, OnDestroy {
  activeModule: string | null = null;
  perfil$: Observable<PerfilUsuario | null>;
  loading$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private authFacade: AuthFacade
  ) {
    this.perfil$ = this.profileService.perfil$;
    this.loading$ = this.profileService.loading$;
  }

  ngOnInit() {
    // Load profile (handles caching logic in service)
    this.profileService.loadProfile();
  }

  toggleModule(moduleName: string) {
    this.activeModule = this.activeModule === moduleName ? null : moduleName;
  }

  getGroupedKeys(permisos: any[]): string[] {
    const modules = permisos.map(p => p.modulo);
    return [...new Set(modules)].sort();
  }

  getPermisosByModulo(permisos: any[], modulo: string) {
    return permisos.filter(p => p.modulo === modulo);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(perfil: PerfilUsuario): string {
    return (perfil.nombres?.charAt(0) || '') + (perfil.apellidos?.charAt(0) || '');
  }

  refreshProfile() {
    this.profileService.refresh();
  }

  logout() {
    this.profileService.clearCache();
    this.authFacade.logout();
  }
}

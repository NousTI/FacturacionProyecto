import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { Observable } from 'rxjs';
import { User } from '../../../domain/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="profile-card shadow-sm animate__animated animate__fadeIn" *ngIf="user$ | async as user">
            <!-- Header -->
            <div class="profile-header text-center p-5 bg-light rounded-top-4">
              <div class="avatar-large mx-auto mb-3">
                {{ getInitials(user) }}
              </div>
              <h2 class="fw-bold mb-1">{{ getFullName(user) }}</h2>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold">
                {{ user.role || 'Usuario' }}
              </span>
            </div>
            
            <!-- Body -->
            <div class="profile-body p-4 p-md-5">
              <!-- Renderizado específico para Superadmin -->
              <ng-container *ngIf="user.role === 'superadmin'; else defaultProfile">
                <div class="info-group mb-4">
                  <label class="text-muted small fw-bold text-uppercase mb-3 d-block">Datos del Administrador</label>
                  
                  <div class="info-item mb-3">
                    <span class="d-block text-muted small">Correo Electrónico</span>
                    <span class="fw-medium">{{ user.email }}</span>
                  </div>

                  <div class="info-item mb-3">
                    <span class="d-block text-muted small">Nombres</span>
                    <span class="fw-medium">{{ user.nombres }}</span>
                  </div>

                  <div class="info-item mb-3">
                    <span class="d-block text-muted small">Apellidos</span>
                    <span class="fw-medium">{{ user.apellidos }}</span>
                  </div>

                  <div class="info-item mb-3" *ngIf="user.last_login">
                    <span class="d-block text-muted small">Último Acceso</span>
                    <span class="fw-medium text-primary">{{ user.last_login | date:'medium' }}</span>
                  </div>
                </div>
              </ng-container>

              <!-- Renderizado por defecto para otros roles -->
              <ng-template #defaultProfile>
                <div class="info-group mb-4">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block">Información Básica</label>
                  <div class="d-flex align-items-center mb-3">
                    <div class="icon-box me-3">
                      <i class="bi bi-envelope text-primary"></i>
                    </div>
                    <div>
                      <span class="d-block text-muted small">Correo Electrónico</span>
                      <span class="fw-medium">{{ user.correo }}</span>
                    </div>
                  </div>
                  
                  <div class="d-flex align-items-center" *ngIf="user.telefono">
                    <div class="icon-box me-3">
                      <i class="bi bi-telephone text-primary"></i>
                    </div>
                    <div>
                      <span class="d-block text-muted small">Teléfono</span>
                      <span class="fw-medium">{{ user.telefono }}</span>
                    </div>
                  </div>
                </div>
              </ng-template>

              <hr class="my-4 opacity-10">

              <div class="d-grid">
                <button class="btn btn-outline-danger py-3 fw-bold rounded-3" (click)="logout()">
                  <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .avatar-large {
      width: 100px;
      height: 100px;
      background: #4facfe;
      color: white;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: bold;
      box-shadow: 0 8px 16px rgba(79, 172, 254, 0.2);
    }
    .icon-box {
      width: 40px;
      height: 40px;
      background: #f0f7ff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .bg-primary-subtle {
      background-color: #eef7ff !important;
    }
    .text-primary {
      color: #007bff !important;
    }
    .info-item {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.02);
    }
  `]
})
export class ProfilePage {
  user$: Observable<User | null>;

  constructor(private authFacade: AuthFacade) {
    this.user$ = this.authFacade.user$;
  }

  getInitials(user: User): string {
    if (user.role === 'superadmin') {
      return (user.nombres?.charAt(0) || '') + (user.apellidos?.charAt(0) || '');
    }
    return (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '');
  }

  getFullName(user: User): string {
    if (user.role === 'superadmin') {
      return `${user.nombres} ${user.apellidos}`;
    }
    return `${user.nombre} ${user.apellido}`;
  }

  logout() {
    this.authFacade.logout();
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-white">
      <div class="p-5" style="width: 100%; max-width: 600px; border-radius: 1px; background-color: #fff;">
        <h1 class="fw-bold mb-4" style="font-size: 2rem; border-bottom: 2px solid; display: inline-block;">Perfil de Superadmin</h1>
        
        @if (authService.currentUser(); as user) {
          <div class="mb-5">
            <h6 class="text-uppercase text-secondary small fw-bold mb-3">Información Personal</h6>
            
            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Nombres Completos</span>
              <span class="fw-bold text-dark">{{ user.nombres }} {{ user.apellidos }}</span>
            </div>
            
            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Correo Electrónico</span>
              <span class="text-dark">{{ user.email }}</span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">ID de Usuario</span>
              <span class="text-secondary small font-monospace">{{ user.id }}</span>
            </div>
          </div>

          <div class="mb-5">
             <h6 class="text-uppercase text-secondary small fw-bold mb-3">Estado y Actividad</h6>

             <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Estado de Cuenta</span>
              <span class="badge rounded-pill" [class.bg-success]="user.activo" [class.bg-danger]="!user.activo">
                {{ user.activo ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Último Acceso</span>
              <span class="text-dark">{{ user.last_login ? (user.last_login | date:'medium') : 'Nunca' }}</span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Última Actualización</span>
              <span class="text-dark">{{ user.updated_at | date:'medium' }}</span>
            </div>

            <div class="d-flex justify-content-between py-2 border-bottom">
              <span class="fw-medium text-secondary">Miembro Desde</span>
              <span class="text-dark">{{ user.created_at | date:'longDate' }}</span>
            </div>
          </div>
        }

        <button 
          (click)="logout()" 
          class="btn btn-outline-danger w-100 fw-bold"
          style="padding: 0.75rem;"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);

  logout() {
    this.feedback.showLoading('Cerrando sesión...');
    this.authService.logout().subscribe(() => {
      this.feedback.hideLoading();
      this.feedback.showSuccess('Has cerrado sesión correctamente');
    });
  }
}

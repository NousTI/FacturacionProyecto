import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-white">
      <div class="p-4" style="width: 100%; max-width: 400px; border-radius: 8px; border: 1px solid #ddd; background-color: #fff;">
        
        <h1 class="text-center fw-bold mb-4" style="font-size: 1.5rem;">Iniciar Sesión</h1>
        
        <form (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label fw-bold small">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              [(ngModel)]="email"
              required
              class="form-control"
              placeholder="ejemplo@correo.com"
              style="padding: 0.75rem; border-radius: 4px; border: 1px solid #ddd; background-color: #fff; color: #000;"
            >
          </div>

          <!-- Password -->
          <div class="mb-4 position-relative">
            <label for="password" class="form-label fw-bold small">Contraseña</label>
            <div class="position-relative">
              <input 
                [type]="showPassword() ? 'text' : 'password'"
                id="password" 
                name="password"
                [(ngModel)]="password"
                required
                class="form-control"
                placeholder="••••••••"
                style="padding: 0.75rem; padding-right: 2.5rem; border-radius: 4px; border: 1px solid #ddd; background-color: #fff; color: #000;"
              >
              <button 
                type="button"
                (click)="togglePassword()"
                class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none text-muted"
                style="padding: 0.25rem 0.5rem;"
              >
                <i [class]="showPassword() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          @if (error()) {
            <div class="alert alert-danger py-2 mb-3 small">
              {{ error() }}
            </div>
          }

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="btn w-100 text-white fw-bold"
            style="background-color: #000; padding: 0.75rem; border-radius: 4px;"
            [disabled]="!email || !password"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  `,
    styles: []
})
export class LoginComponent {
    authService = inject(AuthService);
    feedback = inject(FeedbackService);
    router = inject(Router);

    email = '';
    password = '';
    showPassword = signal(false);
    error = signal('');

    togglePassword() {
        this.showPassword.update(v => !v);
    }

    onSubmit() {
        this.error.set('');
        this.feedback.showLoading('Iniciando sesión...');

        this.authService.login({ email: this.email, password: this.password })
            .subscribe({
                next: () => {
                    this.feedback.hideLoading();
                    this.router.navigate(['/perfil']);
                },
                error: (err) => {
                    this.feedback.hideLoading();
                    const msg = err.message || 'Error al iniciar sesión';
                    this.error.set(msg);
                    this.feedback.showError(msg);
                }
            });
    }
}

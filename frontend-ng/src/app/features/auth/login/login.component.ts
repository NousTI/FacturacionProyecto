import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div class="card p-4 shadow-sm border-0" style="width: 100%; max-width: 400px;">
        
        <h1 class="text-center fw-bold mb-4">Bienvenido</h1>
        
        <!-- Role Tabs -->

        <form (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label fw-bold small text-muted">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              [(ngModel)]="email"
              required
              class="form-control"
              placeholder="nombre@ejemplo.com"
            >
          </div>

          <!-- Password -->
          <div class="mb-4 position-relative">
            <label for="password" class="form-label fw-bold small text-muted">Contraseña</label>
            <div class="input-group">
                <input 
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password" 
                    name="password"
                    [(ngModel)]="password"
                    required
                    class="form-control border-end-0"
                    placeholder="••••••••"
                >
                <button 
                    type="button"
                    (click)="togglePassword()"
                    class="btn btn-outline-secondary border-start-0"
                    style="background-color: white;"
                >
                    <i [class]="showPassword() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
            </div>
          </div>

          <!-- Error Message -->
          @if (error()) {
            <div class="alert alert-danger py-2 mb-3 small d-flex align-items-center">
              <i class="bi bi-exclamation-circle-fill me-2"></i>
              <div>{{ error() }}</div>
            </div>
          }

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="btn w-100 text-white fw-bold py-2 btn-primary"
            
            [disabled]="!email || !password"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
        :host {
            display: block;
            font-family: 'Inter', sans-serif;
        }
        .btn-primary {
            background-color: #000;
            border-color: #000;
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            background-color: #333;
            border-color: #333;
            transform: translateY(-1px);
        }
        .btn-primary:disabled {
            background-color: #000;
            border-color: #000;
            opacity: 0.6;
        }
        .form-control:focus {
            border-color: #000;
            box-shadow: 0 0 0 0.25rem rgba(0, 0, 0, 0.1);
        }
        .text-accent {
            color: #000;
        }
    `]
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
          this.router.navigate(['/dashboard']);
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

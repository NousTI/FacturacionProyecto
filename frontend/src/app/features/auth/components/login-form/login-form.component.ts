import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="login-card shadow-lg p-5">
      <div class="text-center mb-4">
        <h2 class="fw-bold mb-1">Bienvenido</h2>
        </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <input type="email" class="form-control custom-input" id="email" formControlName="email"
                 placeholder="Ingresa tu correo"
                 [ngClass]="{'is-invalid': isInvalid('email')}">
        </div>
        
        <div class="mb-4 position-relative">
          <input [type]="showPassword ? 'text' : 'password'" 
                 class="form-control custom-input pe-5" 
                 id="password" 
                 formControlName="password"
                 placeholder="••••••••"
                 [ngClass]="{'is-invalid': isInvalid('password')}">
          <button type="button" 
                  class="btn-toggle-password" 
                  (click)="togglePassword()">
            <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>

        <button type="submit" class="btn btn-dark w-100 py-2 fw-semibold" [disabled]="loginForm.invalid">
          Iniciar Sesión
        </button>
      </form>
    </div>
  `,
  styles: [`
    .login-card {
      background: white;
      border-radius: 32px;
      width: 100%;
      max-width: 440px;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .logo-circle {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #242424ff 0%, #00f2fe 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
    }
    .logo-circle svg {
      width: 32px;
      height: 32px;
    }
    .custom-input {
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      background-color: #fcfcfc;
      transition: all 0.2s ease;
    }
    .custom-input:focus {
      border-color: #4facfe;
      box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
      background-color: #fff;
    }
    .btn-toggle-password {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #9e9e9e;
      padding: 0;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
    }
    .btn-dark {
      border-radius: 12px;
      background-color: #1a1a1a;
      border: none;
      transition: transform 0.1s active;
    }
    .btn-dark:hover {
      background-color: #000;
    }
    .btn-dark:active {
      transform: scale(0.98);
    }
  `]
})
export class LoginFormComponent {
  @Output() login = new EventEmitter<{ email: string, password: string }>();
  loginForm: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.login.emit(this.loginForm.value);
    }
  }

  isInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

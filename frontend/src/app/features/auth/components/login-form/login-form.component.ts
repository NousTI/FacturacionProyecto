import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="vh-center animate-fade-in-scale">
      <div class="editorial-card">
        <h1 class="editorial-title" style="font-size: 3.5rem;">NousTI</h1>
        <p class="editorial-subtitle">Sistema de facturación.</p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="w-100 d-flex flex-column align-items-center">
        <div class="editorial-input-group">
          <label class="editorial-label">Correo electrónico</label>
          <input type="email" class="editorial-input" formControlName="email"
                 placeholder="nombre@ejemplo.com"
                 [ngClass]="{'is-invalid': isInvalid('email')}">
          <div *ngIf="isInvalid('email')" class="error-feedback-premium animate-fade-in">
            {{ getErrorMessage('email') }}
          </div>
        </div>
        
        <div class="editorial-input-group position-relative">
          <label class="editorial-label">Contraseña</label>
          <input [type]="showPassword ? 'text' : 'password'" 
                 class="editorial-input pe-5" 
                 formControlName="password"
                 placeholder="••••••••"
                 [ngClass]="{'is-invalid': isInvalid('password')}">
          <button type="button" 
                  class="btn-toggle-password" 
                  (click)="togglePassword()">
            <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
          <div *ngIf="isInvalid('password')" class="error-feedback-premium animate-fade-in">
            {{ getErrorMessage('password') }}
          </div>
        </div>

        <button type="submit" class="btn-editorial mt-4" [disabled]="loginForm.invalid || isLoading">
          <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ isLoading ? 'PROCESANDO...' : 'INICIAR SESIÓN' }}
        </button>
      </form>
    </div>
  </div>
  `,
  styles: [`
    .btn-toggle-password {
      position: absolute;
      right: 20px;
      top: 36px;
      background: none;
      border: none;
      color: #9e9e9e;
      padding: 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      z-index: 10;
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginFormComponent {
  @Input() isLoading = false;
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

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Ingrese un correo electrónico válido';
    
    return 'Campo inválido';
  }
}

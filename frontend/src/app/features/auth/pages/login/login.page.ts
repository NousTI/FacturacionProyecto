import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { AuthFacade } from '../../../../core/auth/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div class="d-flex align-items-center justify-content-center h-100 vh-100 bg-light">
      <div class="login-container animate__animated animate__fadeIn">
        <app-login-form (login)="onLogin($event)"></app-login-form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      width: 100%;
      max-width: 440px;
      padding: 20px;
    }
  `]
})
export class LoginPage {
  constructor(private authFacade: AuthFacade) { }

  onLogin(credentials: { email: string, password: string }) {
    this.authFacade.login(credentials.email, credentials.password).subscribe({
      next: () => {
        console.log('Login exitoso');
      },
      error: (err) => {
        console.error('Error en login:', err);
        // Aquí se podría mostrar un mensaje de error al usuario
      }
    });
  }
}

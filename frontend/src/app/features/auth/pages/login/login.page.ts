import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { AuthFacade } from '../../../../core/auth/auth.facade';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, ToastComponent],
  template: `
    <div class="d-flex align-items-center justify-content-center h-100 vh-100 bg-light">
      <div class="login-container animate__animated animate__fadeIn">
        <app-login-form [isLoading]="isLoading" (login)="onLogin($event)"></app-login-form>
      </div>
      <app-toast></app-toast>
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
  isLoading = false;

  constructor(
    private authFacade: AuthFacade,
    private cdr: ChangeDetectorRef,
    private uiService: UiService
  ) { }

  onLogin(credentials: { email: string, password: string }) {
    console.log(`[Login] Iniciando autenticación para: ${credentials.email}`);
    this.isLoading = true;

    this.authFacade.login(credentials.email, credentials.password).subscribe({
      next: (response) => {
        console.log('[Login] Respuesta exitosa recibida', response);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.uiService.showToast('¡Bienvenido!', 'success', 'Has iniciado sesión correctamente.');
      },
      error: (err) => {
        console.error('[Login] Error detectado:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.uiService.showError(err, 'Error de inicio de sesión');
      }
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';

@Component({
  selector: 'app-sin-permisos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center justify-content-center h-100 vh-100 bg-light">
      <div class="text-center" style="max-width: 500px; padding: 40px;">
        <div style="font-size: 64px; margin-bottom: 20px;">
          🔒
        </div>
        <h1 style="margin-bottom: 15px; color: #333;">Acceso Restringido</h1>
        <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
          No tienes permisos asignados para acceder a ningún módulo.
        </p>
        <p style="color: #999; margin-bottom: 40px;">
          Por favor, contacta con un administrador de tu empresa para que te asigne los permisos necesarios.
        </p>
        <button
          (click)="logout()"
          class="btn btn-danger"
          style="padding: 12px 30px; font-size: 16px; border-radius: 4px; border: none; cursor: pointer; background-color: #dc3545; color: white;">
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class SinPermisosPage {
  constructor(
    private authFacade: AuthFacade,
    private router: Router
  ) {}

  logout() {
    this.authFacade.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}

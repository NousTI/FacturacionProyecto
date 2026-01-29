import { Component, Input } from '@angular/core';
import { User } from '../../../domain/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="card-title">Bienvenido, {{ user?.nombre }}</h5>
        <p class="card-text text-muted">Rol: {{ user?.role }}</p>
        <p class="card-text">
          Has iniciado sesión exitosamente en el sistema de facturación electrónica.
        </p>
      </div>
    </div>
  `
})
export class WelcomeCardComponent {
  @Input() user: User | null = null;
}

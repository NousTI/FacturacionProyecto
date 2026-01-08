import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../../core/auth/auth.service';

@Component({
    selector: 'app-usuario-info',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (usuario) {
        <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">ID Empresa</span>
        <span class="text-dark font-monospace small">{{ usuario.empresa_id || 'N/A' }}</span>
        </div>

        <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Teléfono</span>
        <span class="text-dark">{{ usuario.telefono || 'No registrado' }}</span>
        </div>

        <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Rol ID</span>
        <span class="text-dark font-monospace small">{{ usuario.rol_id || 'N/A' }}</span>
        </div>

        <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Avatar URL</span>
        <div class="text-end" style="max-width: 50%;">
             <span class="text-muted small text-break">{{ usuario.avatar_url || 'No configurado' }}</span>
        </div>
        </div>

        <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Cambio Password</span>
        <span [class.text-danger]="usuario.requiere_cambio_password" [class.text-muted]="!usuario.requiere_cambio_password" class="fw-bold">
            {{ usuario.requiere_cambio_password ? 'Requerido' : 'No' }}
        </span>
        </div>
    }
  `
})
export class UsuarioInfoComponent {
    @Input() user!: any;

    get usuario(): Usuario {
        return this.user as Usuario;
    }
}

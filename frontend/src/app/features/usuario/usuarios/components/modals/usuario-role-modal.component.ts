import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../../domain/models/user.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuario-role-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-container shadow-lg" (click)="$event.stopPropagation()">

        <!-- Icon -->
        <div class="icon-wrapper">
          <i class="bi bi-shield-lock"></i>
        </div>

        <!-- Content -->
        <div class="modal-content-text">
          <h2 class="modal-title">Actualizar Rol Corporativo</h2>
          <p class="modal-desc">
            Asigne los permisos correspondientes para <strong>{{ usuario.nombre || usuario.nombres }}</strong>. Los cambios tendrán efecto en su próximo inicio de sesión.
          </p>

          <div class="roles-grid">
            <div *ngFor="let rol of availableRoles" 
                 class="role-card" 
                 [class.active]="selectedRoleId === rol.id"
                 (click)="selectedRoleId = rol.id">
              <div class="role-selector">
                <i class="bi" [ngClass]="selectedRoleId === rol.id ? 'bi-check-circle-fill' : 'bi-circle'"></i>
              </div>
              <div class="role-info">
                <span class="r-name">{{ rol.nombre }}</span>
                <span class="r-desc">{{ getRolDescription(rol.codigo) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-actions">
          <button (click)="close()" class="btn-cancel" [disabled]="loading">Cancelar</button>
          <button (click)="confirm()" 
                  class="btn-confirm" 
                  [disabled]="loading || !selectedRoleId || selectedRoleId === initialRoleId">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            Actualizar Rol
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10001; padding: 1rem; }
    .modal-container { background: white; width: 100%; max-width: 480px; border-radius: 28px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .icon-wrapper { width: 72px; height: 72px; border-radius: 22px; background: #f0f9ff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; }
    .modal-content-text { text-align: center; width: 100%; }
    .modal-title { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .modal-desc { font-size: 0.9rem; color: #64748b; font-weight: 500; line-height: 1.5; margin-bottom: 2rem; }
    .roles-grid { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
    .role-card { 
      background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 1rem; 
      display: flex; align-items: center; gap: 1rem; text-align: left; cursor: pointer; transition: all 0.2s;
    }
    .role-card:hover { border-color: #cbd5e1; background: #f1f5f9; }
    .role-card.active { border-color: #3b82f6; background: #eff6ff; }
    .role-selector { font-size: 1.25rem; color: #cbd5e1; }
    .active .role-selector { color: #3b82f6; }
    .role-info { display: flex; flex-direction: column; }
    .r-name { font-size: 0.95rem; font-weight: 800; color: #1e293b; }
    .r-desc { font-size: 0.75rem; color: #64748b; font-weight: 600; }
    .modal-actions { display: flex; gap: 0.75rem; width: 100%; margin-top: 1rem; }
    .btn-cancel { flex: 1; padding: 0.85rem; border-radius: 14px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 700; }
    .btn-confirm { flex: 1.5; padding: 0.85rem; border-radius: 14px; border: none; background: #1e293b; color: white; font-weight: 800; transition: all 0.2s; }
    .btn-confirm:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class UsuarioRoleModalComponent implements OnInit, OnDestroy {
  @Input() usuario!: User;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();

  availableRoles: any[] = [];
  selectedRoleId: string = '';
  initialRoleId: string = '';

  constructor(private usuariosService: UsuariosService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.initialRoleId = this.usuario.empresa_rol_id || '';
    this.selectedRoleId = this.initialRoleId;
    this.fetchRoles();
  }

  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  fetchRoles() {
    this.usuariosService.listarRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(r => r.codigo !== 'SUPERADMIN' && r.codigo !== 'VENDEDOR' && r.activo !== false);
        this.cd.detectChanges();
      }
    });
  }

  getRolDescription(code: string): string {
    switch (code) {
      case 'ADMIN': return 'Control total sobre la configuración de la empresa y facturación.';
      case 'USUARIO': return 'Acceso a procesos comerciales estándar y consultas.';
      case 'CONTADOR': return 'Acceso especializado a reportes y auditoría contable.';
      default: return 'Permisos personalizados según políticas de la empresa.';
    }
  }

  confirm() { if (this.selectedRoleId) this.onSave.emit(this.selectedRoleId); }
  close() { if (!this.loading) this.onClose.emit(); }
}

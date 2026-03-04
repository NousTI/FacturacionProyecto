import { Component, EventEmitter, Output, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../domain/models/user.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
    selector: 'app-usuario-role-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-role" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-role">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box-role shadow-sm">
              <i class="bi bi-person-badge-fill"></i>
            </div>
            <div>
              <h2 class="modal-title-role">Cambiar Rol de Usuario</h2>
              <p class="modal-subtitle-role">Actualizando perfil de: <strong class="text-white">{{ usuario.nombre || usuario.nombres }}</strong></p>
            </div>
          </div>
          <button (click)="close()" class="btn-close-role" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-role scroll-custom">
          
          <div *ngIf="isInitialLoading" class="text-center py-5">
            <div class="spinner-border text-info" role="status"></div>
            <p class="text-muted mt-2 text-white-50">Cargando roles disponibles...</p>
          </div>

          <div *ngIf="!isInitialLoading">
            <div class="role-grid">
              <div *ngFor="let role of availableRoles" 
                   class="role-card" 
                   [class.selected]="selectedRoleId === role.id"
                   (click)="selectedRoleId = role.id">
                <div class="d-flex align-items-center gap-3">
                  <div class="role-check">
                    <i class="bi" [ngClass]="selectedRoleId === role.id ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  </div>
                  <div class="role-info">
                    <span class="role-name">{{ role.nombre }}</span>
                    <p class="role-desc">{{ role.descripcion || 'Sin descripción disponible' }}</p>
                  </div>
                </div>
                <div class="role-badge" [ngClass]="role.codigo">
                  {{ role.codigo }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-role">
          <button (click)="close()" class="btn-cancel-role" [disabled]="loading">Cancelar</button>
          <button (click)="submit()" 
                  [disabled]="loading || isInitialLoading || !selectedRoleId || selectedRoleId === usuario.empresa_rol_id" 
                  class="btn-submit-role d-flex align-items-center gap-2">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Actualizando...' : 'Guardar' }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-container-role {
      background: #0f172a; width: 600px;
      max-width: 95vw; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header-role {
      padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .icon-box-role {
      width: 48px; height: 48px; background: #1e293b; color: #38bdf8; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .modal-title-role { font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 0; }
    .modal-subtitle-role { font-size: 0.85rem; color: #94a3b8; margin: 2px 0 0; }
    .btn-close-role { background: none; border: none; font-size: 2rem; color: #64748b; cursor: pointer; }
    
    .modal-body-role { padding: 2rem; overflow-y: auto; max-height: 60vh; }
    
    .role-grid { display: grid; gap: 1rem; }
    .role-card {
      background: rgba(255,255,255,0.02); border: 1.5px solid rgba(255,255,255,0.05);
      padding: 1.25rem; border-radius: 18px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s;
    }
    .role-card:hover { border-color: rgba(56, 189, 248, 0.3); background: rgba(255,255,255,0.04); }
    .role-card.selected { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
    
    .role-check { font-size: 1.25rem; color: #475569; }
    .selected .role-check { color: #38bdf8; }
    
    .role-name { display: block; font-size: 1rem; font-weight: 700; color: #f1f5f9; }
    .role-desc { font-size: 0.8rem; color: #64748b; margin: 4px 0 0; }
    
    .role-badge {
      font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
      background: rgba(255,255,255,0.05); color: #94a3b8;
    }
    .role-badge.ADMIN { background: rgba(239, 68, 68, 0.1); color: #f87171; }
    .role-badge.VENDEDOR { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
    
    .modal-footer-role {
      padding: 1.5rem 2rem; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.05);
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-submit-role { background: #38bdf8; color: #000000; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 800; transition: all 0.2s; }
    .btn-submit-role:hover:not(:disabled) { background: #7dd3fc; transform: translateY(-1px); }
    .btn-cancel-role { background: transparent; color: #94a3b8; border: 1.5px solid #334155; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  `]
})
export class UsuarioRoleModalComponent implements OnInit {
    @Input({ required: true }) usuario!: User;
    @Input() loading: boolean = false;
    @Output() onSave = new EventEmitter<string>();
    @Output() onClose = new EventEmitter<void>();

    availableRoles: any[] = [];
    selectedRoleId: string = '';
    isInitialLoading: boolean = true;

    constructor(
        private usuariosService: UsuariosService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        this.selectedRoleId = this.usuario.empresa_rol_id || '';
        this.fetchRoles();
    }

    fetchRoles() {
        this.usuariosService.listarRoles().subscribe({
            next: (roles) => {
                this.availableRoles = roles.filter(r =>
                    r.codigo !== 'SUPERADMIN' && r.codigo !== 'VENDEDOR'
                );
                this.isInitialLoading = false;
                this.cd.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching roles:', err);
                this.isInitialLoading = false;
                this.cd.detectChanges();
            }
        });
    }

    submit() {
        if (this.selectedRoleId) {
            this.onSave.emit(this.selectedRoleId);
        }
    }

    close() {
        if (!this.loading) {
            document.body.style.overflow = 'auto';
            this.onClose.emit();
        }
    }
}

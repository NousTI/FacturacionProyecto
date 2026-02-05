import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="header-card card-premium overflow-hidden mb-4">
      <div class="row g-0 align-items-center">
        <!-- Avatar Section -->
        <div class="col-md-auto p-4 text-center">
          <div class="avatar-container">
            <div class="avatar-lux shadow-sm">
                {{ getInitials(perfil) }}
            </div>
            <div class="status-badge" [class.online]="perfil.activo"></div>
          </div>
        </div>

        <!-- Name & Info Section -->
        <div class="col-md px-4 py-4 py-md-0 border-start-md">
          <div class="d-flex justify-content-between align-items-start">
            <div>
                <h1 class="user-name">{{ perfil.nombres }} {{ perfil.apellidos }}</h1>
                <div class="d-flex align-items-center gap-3 mt-1">
                    <span class="role-badge">{{ perfil.rol_nombre }}</span>
                    <span class="email-text"><i class="bi bi-envelope me-1"></i> {{ perfil.email }}</span>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button (click)="onRefresh.emit()" class="btn-action-header" [class.loading]="loading">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button (click)="onLogout.emit()" class="btn-logout-header">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card-premium {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 28px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.03);
    }
    
    .avatar-container { position: relative; display: inline-block; }
    .avatar-lux {
      width: 100px; height: 100px;
      background: linear-gradient(135deg, #161d35 0%, #2e3b62 100%);
      color: white; font-size: 2.25rem; font-weight: 850;
      display: flex; align-items: center; justify-content: center;
      border-radius: 32px;
    }
    .status-badge {
      position: absolute; bottom: 4px; right: 4px;
      width: 22px; height: 22px; border: 4px solid #fff;
      border-radius: 50%; background: #94a3b8;
    }
    .status-badge.online { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

    .user-name { font-size: 2rem; font-weight: 950; color: #161d35; margin: 0; letter-spacing: -0.5px; }
    .role-badge {
      background: #f1f5f9; color: #475569;
      padding: 0.4rem 1rem; border-radius: 12px;
      font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .email-text { font-size: 0.9rem; color: #94a3b8; font-weight: 600; }

    .btn-action-header, .btn-logout-header {
      width: 44px; height: 44px; border-radius: 14px; border: 1px solid #eef2f6;
      background: white; color: #64748b; transition: all 0.2s;
    }
    .btn-action-header:hover { background: #f8fafc; color: #161d35; }
    .btn-logout-header:hover { background: #fef2f2; color: #ef4444; border-color: #fee2e2; }

    .loading i { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (min-width: 768px) {
        .border-start-md { border-left: 1px solid #f1f5f9; }
    }
  `]
})
export class ProfileHeaderComponent {
    @Input() perfil!: PerfilUsuario;
    @Input() loading: boolean = false;
    @Output() onRefresh = new EventEmitter<void>();
    @Output() onLogout = new EventEmitter<void>();

    getInitials(perfil: PerfilUsuario): string {
        return (perfil.nombres?.charAt(0) || '') + (perfil.apellidos?.charAt(0) || '');
    }
}

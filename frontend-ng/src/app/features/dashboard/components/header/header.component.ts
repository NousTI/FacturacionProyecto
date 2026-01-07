import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="header d-flex justify-content-between align-items-center px-4 py-3 bg-light bg-opacity-50">
      <div>
        <h1 class="h4 fw-bold mb-1 text-dark">Sales Report</h1>
        <p class="text-secondary small mb-0">Friday, December 15th 2023</p>
      </div>

      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-light rounded-circle p-2 shadow-sm border-0">
          <i class="bi bi-search"></i>
        </button>
        <button class="btn btn-light rounded-circle p-2 shadow-sm border-0">
          <i class="bi bi-bell"></i>
        </button>

        <!-- Profile Dropdown -->
        <div class="dropdown position-relative">
          <div 
            class="d-flex align-items-center gap-2 cursor-pointer" 
            (click)="toggleProfile()"
          >
            <div class="avatar rounded-3 overflow-hidden border border-2 border-white shadow-sm" style="width: 40px; height: 40px;">
              <img 
                [src]="'https://ui-avatars.com/api/?name=' + (user()?.nombres || 'Admin') + '&background=0D8ABC&color=fff'" 
                alt="Profile" 
                class="w-100 h-100 object-fit-cover"
              >
            </div>
            <div class="d-flex flex-column d-none d-md-flex">
              <span class="fw-bold small text-dark">{{ user()?.nombres || 'Admin' }}</span>
              <span class="text-secondary" style="font-size: 0.75rem;">Superadmin</span>
            </div>
          </div>

          @if (isProfileOpen()) {
            <div class="profile-menu position-absolute end-0 mt-2 bg-white rounded-3 shadow-sm p-2" style="width: 200px; z-index: 1000;">
              <div 
                class="menu-item p-2 rounded d-flex align-items-center gap-2 text-dark cursor-pointer"
                (click)="navigateToProfile()"
              >
                <i class="bi bi-person"></i> Ver Perfil
              </div>
              <div 
                class="menu-item p-2 rounded d-flex align-items-center gap-2 text-danger cursor-pointer"
                (click)="logout()"
              >
                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .menu-item:hover { background-color: #f3f4f6; }
    .menu-item.text-danger:hover { background-color: #fef2f2; }
  `]
})
export class HeaderComponent {
    authService = inject(AuthService);
    feedback = inject(FeedbackService);
    router = inject(Router);

    isProfileOpen = signal(false);
    user = this.authService.currentUser;

    toggleProfile() {
        this.isProfileOpen.update(v => !v);
    }

    navigateToProfile() {
        this.router.navigate(['/perfil']);
    }

    logout() {
        this.feedback.showLoading('Cerrando sesión...');
        this.authService.logout().subscribe(() => {
            this.feedback.hideLoading();
            this.feedback.showSuccess('Has cerrado sesión correctamente');
        });
    }
}

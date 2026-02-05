import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ProfileService } from './services/profile.service';
import { PerfilUsuario } from '../../../domain/models/perfil.model';

// Components
import { ProfileHeaderComponent } from './components/profile-header.component';
import { ProfileInfoCardsComponent } from './components/profile-info-cards.component';
import { ProfileEmpresaComponent } from './components/profile-empresa.component';
import { ProfilePermissionsComponent } from './components/profile-permissions.component';
import { ProfileAuditComponent } from './components/profile-audit.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    ProfileInfoCardsComponent,
    ProfileEmpresaComponent,
    ProfilePermissionsComponent,
    ProfileAuditComponent
  ],
  template: `
    <div class="profile-container animate-fade-in">
      
      <!-- HEADER & MAIN DATA -->
      <ng-container *ngIf="perfil$ | async as perfil; else loadingTpl">
        
        <app-profile-header 
            [perfil]="perfil"
            [loading]="(loading$ | async) || false"
            (onRefresh)="refreshProfile()"
            (onLogout)="logout()">
        </app-profile-header>

        <div class="row g-4">
          <!-- LEFT: Info Summary -->
          <div class="col-lg-12">
            <app-profile-info-cards [perfil]="perfil"></app-profile-info-cards>
          </div>

          <!-- BOTTOM LEFT: Empresa & Audit -->
          <div class="col-lg-5">
            <app-profile-empresa [perfil]="perfil"></app-profile-empresa>
            <app-profile-audit [perfil]="perfil"></app-profile-audit>
          </div>

          <!-- RIGHT: Permissions Accordion -->
          <div class="col-lg-7">
            <app-profile-permissions [permisos]="perfil.permisos"></app-profile-permissions>
          </div>
        </div>

      </ng-container>

      <!-- Loading Template -->
      <ng-template #loadingTpl>
        <div class="loading-full">
           <div class="lux-spinner"></div>
           <p class="mt-3 fs-5 fw-bold text-muted">Cargando identidad del usuario...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .loading-full {
        height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .lux-spinner {
      width: 50px; height: 50px;
      border: 4px solid #f1f5f9;
      border-top-color: #161d35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-fade-in { animation: fadeIn 0.5s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfilePage implements OnInit, OnDestroy {
  perfil$: Observable<PerfilUsuario | null>;
  loading$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private authFacade: AuthFacade
  ) {
    this.perfil$ = this.profileService.perfil$;
    this.loading$ = this.profileService.loading$;
  }

  ngOnInit() {
    this.profileService.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshProfile() {
    this.profileService.refresh();
  }

  logout() {
    this.profileService.clearCache();
    this.authFacade.logout();
  }
}

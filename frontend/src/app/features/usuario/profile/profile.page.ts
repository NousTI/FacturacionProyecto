import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, tap } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ProfileService } from './services/profile.service';
import { PerfilUsuario } from '../../../domain/models/perfil.model';
import { UiService } from '../../../shared/services/ui.service';

// New Modular Components
import { ProfileInfoCardComponent } from './components/profile-info-card.component';
import { ProfilePersonalDataCardComponent } from './components/profile-personal-data-card.component';
import { ProfileSecurityCardComponent } from './components/profile-security-card.component';
import { ProfileBusinessCardComponent } from './components/profile-business-card.component';
import { ProfilePermissionsListCardComponent } from './components/profile-permissions-list-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ProfileInfoCardComponent,
    ProfilePersonalDataCardComponent,
    ProfileSecurityCardComponent,
    ProfileBusinessCardComponent,
    ProfilePermissionsListCardComponent
  ],
  template: `
    <div class="profile-page-wrapper">
      
      <!-- LOADING STATE -->
      <ng-container *ngIf="perfil$ | async as perfil; else loadingTpl">
        
        <div class="profile-main-layout animate-fade-in">
          
          <!-- ALERT: CHANGE PASSWORD REQUIRED -->
          <div *ngIf="perfil.requiere_cambio_password" class="editorial-alert-notice shadow-sm mb-4">
            <div class="d-flex align-items-center gap-3">
              <div class="alert-icon-wrapper warning">
                <i class="bi bi-shield-lock-fill"></i>
              </div>
              <div class="flex-grow-1">
                <h6 class="mb-1 fw-bold">Seguridad: Cambio de contraseña requerido</h6>
                <p class="mb-0 small opacity-75">Por motivos de seguridad, el sistema solicita que actualices tu contraseña de acceso.</p>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <!-- COLUMN 1 (LEFT) - Información básica y Empresa -->
            <div class="col-lg-3 d-flex flex-column gap-4">
              <app-profile-info-card 
                [perfil]="perfil">
              </app-profile-info-card>

              <app-profile-business-card 
                [perfil]="perfil">
              </app-profile-business-card>
            </div>

            <!-- COLUMN 2 (CENTER) - Edición y Seguridad -->
            <div class="col-lg-5 d-flex flex-column gap-4">
              <app-profile-personal-data-card
                #personalDataCard
                [perfil]="perfil"
                [isSaving]="isSaving"
                (onSave)="saveProfileUpdate($event)">
              </app-profile-personal-data-card>

              <app-profile-security-card
                #securityCard
                [isSaving]="isSaving"
                (onChangePassword)="savePasswordUpdate($event)">
              </app-profile-security-card>

              <!-- AUDIT SUMMARY -->
              <div class="editorial-card audit-mini-card p-3">
                 <div class="d-flex justify-content-between align-items-center opacity-75">
                    <div class="d-flex align-items-center gap-2">
                       <i class="bi bi-clock-history"></i>
                       <span class="smallest-text">Registro: {{ perfil.created_at | date:'mediumDate' }}</span>
                    </div>
                    <div class="smallest-text">Estado: <strong>{{ perfil.activo ? 'ACTIVO' : 'INACTIVO' }}</strong></div>
                 </div>
              </div>
            </div>

            <!-- COLUMN 3 (RIGHT) - Alcance de Permisos -->
            <div class="col-lg-4">
              <app-profile-permissions-list-card
                [permisos]="perfil.permisos || []">
              </app-profile-permissions-list-card>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- Loading Template -->
      <ng-template #loadingTpl>
        <div class="profile-loading-overlay">
           <div class="editorial-spinner"></div>
           <p class="mt-3 fs-6 fw-bold text-muted">Sincronizando identidad...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .editorial-alert-notice {
      background: #fffbeb; border: 1px solid #fef3c7; padding: 1.5rem; border-radius: 20px; color: #92400e;
    }
    .alert-icon-wrapper {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      background: #fdf2f8; color: #db2777; border-radius: 14px; font-size: 1.25rem;
      &.warning { background: #fef3c7; color: #d97706; }
    }

    .profile-loading-overlay { height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .editorial-spinner {
      width: 44px; height: 44px; border: 3.5px solid #f1f5f9; border-top-color: var(--primary-color); border-radius: 50%;
      animation: spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .audit-mini-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; min-height: auto !important; }
    .smallest-text { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    @media (max-width: 768px) { .profile-page-wrapper { padding: 1rem; } }
  `]
})
export class ProfilePage implements OnInit, OnDestroy {
  @ViewChild('personalDataCard') personalDataCard!: ProfilePersonalDataCardComponent;
  @ViewChild('securityCard') securityCard!: ProfileSecurityCardComponent;

  perfil$: Observable<PerfilUsuario | null>;
  loading$: Observable<boolean>;
  isSaving = false;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private authFacade: AuthFacade,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {
    this.perfil$ = this.profileService.perfil$.pipe(
      tap(() => {
        this.cdr.markForCheck();
      })
    );
    this.loading$ = this.profileService.loading$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Configuración de Perfil', 'Gestione su información personal y seguridad de la cuenta');
    this.profileService.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveProfileUpdate(datos: { nombres: string, apellidos: string, telefono: string }) {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.profileService.updateProfile(datos).subscribe({
      next: () => {
        this.isSaving = false;
        this.uiService.showToast('Perfil actualizado correctamente', 'success');
        this.personalDataCard.closeEdit();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar perfil');
        this.cdr.markForCheck();
      }
    });
  }

  savePasswordUpdate(password: string) {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.profileService.updatePassword(password).subscribe({
      next: () => {
        this.isSaving = false;
        this.uiService.showToast('Contraseña actualizada correctamente', 'success');
        this.securityCard.closeChange();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al cambiar contraseña');
        this.cdr.markForCheck();
      }
    });
  }
}


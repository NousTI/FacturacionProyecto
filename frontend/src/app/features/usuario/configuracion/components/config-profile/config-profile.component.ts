import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, tap } from 'rxjs';

import { AuthFacade } from '../../../../../core/auth/auth.facade';
import { ProfileService } from '../../../profile/services/profile.service';
import { PerfilUsuario } from '../../../../../domain/models/perfil.model';
import { UiService } from '../../../../../shared/services/ui.service';

// Modular Components reused from original Profile module
import { ProfileInfoCardComponent } from '../../../profile/components/profile-info-card.component';
import { ProfilePersonalDataCardComponent } from '../../../profile/components/profile-personal-data-card.component';
import { ProfileSecurityCardComponent } from '../../../profile/components/profile-security-card.component';
import { ProfileBusinessCardComponent } from '../../../profile/components/profile-business-card.component';
import { ProfilePermissionsListCardComponent } from '../../../profile/components/profile-permissions-list-card.component';

@Component({
  selector: 'app-config-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoCardComponent,
    ProfilePersonalDataCardComponent,
    ProfileSecurityCardComponent,
    ProfileBusinessCardComponent,
    ProfilePermissionsListCardComponent
  ],
  template: `
    <div class="config-profile-wrapper">
      
      <!-- LOADING STATE -->
      <ng-container *ngIf="perfil$ | async as perfil; else loadingTpl">
        
        <div class="profile-layout animate__animated animate__fadeIn">
          
          <!-- ALERT: CHANGE PASSWORD REQUIRED -->
          <div *ngIf="perfil.requiere_cambio_password" class="auth-alert mb-4">
            <div class="d-flex align-items-center gap-3">
              <div class="alert-icon">
                <i class="bi bi-shield-lock-fill"></i>
              </div>
              <div class="alert-text">
                <h6 class="mb-1 fw-bold">Seguridad: Cambio de contraseña requerido</h6>
                <p class="mb-0 small">Por motivos de seguridad, el sistema solicita que actualices tu contraseña de acceso.</p>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <!-- COLUMN 1 (LEFT) - Información básica y Empresa -->
            <div class="col-lg-3 d-flex flex-column gap-4">
              <app-profile-info-card [perfil]="perfil"></app-profile-info-card>
              <app-profile-business-card [perfil]="perfil"></app-profile-business-card>
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
              <div class="audit-badge p-3">
                 <div class="d-flex justify-content-between align-items-center opacity-75">
                    <div class="d-flex align-items-center gap-2">
                       <i class="bi bi-clock-history"></i>
                       <span class="badge-text">Registro: {{ perfil.created_at | date:'mediumDate' }}</span>
                    </div>
                    <div class="badge-text">Estado: <strong>{{ perfil.activo ? 'ACTIVO' : 'INACTIVO' }}</strong></div>
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

      <ng-template #loadingTpl>
        <div class="profile-loader">
           <div class="premium-spinner"></div>
           <p class="mt-3 fs-6 fw-bold">Sincronizando identidad...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .config-profile-wrapper { width: 100%; padding: 4px; }
    
    .auth-alert {
      background: #fffbeb; border: 1px solid #fef3c7; padding: 1rem; border-radius: 16px; color: #92400e;
    }
    .alert-icon { font-size: 1.5rem; color: #d97706; }
    
    .audit-badge { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; }
    .badge-text { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .profile-loader { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .premium-spinner {
      width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: black;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ConfigProfileComponent implements OnInit, OnDestroy {
  @ViewChild('personalDataCard') personalDataCard!: ProfilePersonalDataCardComponent;
  @ViewChild('securityCard') securityCard!: ProfileSecurityCardComponent;

  perfil$: Observable<PerfilUsuario | null>;
  isSaving = false;
  private destroy$ = new Subject<void>();

  private profileService = inject(ProfileService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.perfil$ = this.profileService.perfil$.pipe(
      tap(() => this.cdr.markForCheck())
    );
  }

  ngOnInit() {
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



import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorPerfilService, VendedorPerfil } from './services/perfil-vendedor.service';
import { UiService } from '../../../shared/services/ui.service';

// New Components
import { ProfileInfoCardComponent } from './components/profile-info-card.component';
import { BusinessSummaryCardComponent } from './components/business-summary-card.component';
import { PersonalDataCardComponent } from './components/personal-data-card.component';
import { PermissionsListCardComponent } from './components/permissions-list-card.component';
import { AccountSecurityCardComponent } from './components/account-security-card.component';

@Component({
  selector: 'app-vendedor-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    ProfileInfoCardComponent,
    BusinessSummaryCardComponent,
    PersonalDataCardComponent,
    PermissionsListCardComponent,
    AccountSecurityCardComponent
  ],
  template: `
    <div class="perfil-container animate__animated animate__fadeIn">
      
      <!-- Loading State -->
      <div *ngIf="loading" class="d-flex justify-content-center align-items-center my-5 py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger mx-auto mt-4 shadow-sm" style="max-width: 600px; border-radius: 12px;">
        <i class="bi bi-exclamation-triangle me-2"></i> {{ error }}
      </div>

      <!-- Content -->
      <div *ngIf="perfil && !loading" class="animate-fade-in content-wrapper">
        
        <!-- ALERT: CHANGE PASSWORD REQUIRED -->
        <div *ngIf="perfil.requiere_cambio_password" class="alert-cambio-password mb-4 shadow-sm animate-fade-in">
          <div class="d-flex align-items-center gap-3">
            <div class="alert-icon">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div class="flex-grow-1">
              <h6 class="mb-1 fw-bold text-dark">Cambio de contraseña requerido</h6>
              <p class="mb-0 text-muted small">Por motivos de seguridad, se ha solicitado que actualices tu contraseña de acceso.</p>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Columna Izquierda -->
          <div class="col-lg-4">
            <app-profile-info-card
              class="d-block mb-4"
              [nombres]="perfil.nombres"
              [apellidos]="perfil.apellidos"
              [activo]="perfil.activo"
              [tipoComision]="perfil.tipo_comision"
              [identificacion]="perfil.identificacion"
            ></app-profile-info-card>

            <app-business-summary-card
              class="d-block mb-4"
              [empresasAsignadas]="perfil.empresas_asignadas"
              [ingresosGenerados]="perfil.ingresos_generados"
              [fechaRegistro]="perfil.fecha_registro"
            ></app-business-summary-card>
          </div>

          <!-- Columna Derecha -->
          <div class="col-lg-8">
            <app-personal-data-card
              #personalDataCard
              class="d-block mb-4"
              [nombres]="perfil.nombres"
              [apellidos]="perfil.apellidos"
              [email]="perfil.email"
              [telefono]="perfil.telefono"
              [isSaving]="isSaving"
              (onSave)="saveEdit($event)"
            ></app-personal-data-card>

            <app-permissions-list-card
              class="d-block mb-4"
              [perfil]="perfil"
            ></app-permissions-list-card>

            <app-account-security-card
              #securityCard
              class="d-block mb-4"
              [isSaving]="isSaving"
              (onChangePassword)="savePassword($event)"
            ></app-account-security-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-container { padding: 1rem; font-family: var(--font-main); }
    
    .alert-cambio-password {
      background: #fff9db; border-left: 6px solid var(--status-warning);
      padding: 1rem; border-radius: 18px;
    }
    
    .alert-icon {
      width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
      background: var(--status-warning); color: #fff; border-radius: 12px; font-size: 1.1rem;
    }

    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class VendedorPerfilPage implements OnInit {
  @ViewChild('securityCard') securityCard!: AccountSecurityCardComponent;
  @ViewChild('personalDataCard') personalDataCard!: PersonalDataCardComponent;

  perfil: VendedorPerfil | null = null;
  loading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;

  constructor(
    private perfilService: VendedorPerfilService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.uiService.setPageHeader('Mi Perfil', 'Información personal y configuración de la cuenta');
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.loading = true;
    this.perfilService.obtenerPerfil().subscribe({
      next: (data) => {
        this.perfil = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudo cargar la información del perfil.';
        this.loading = false;
        this.uiService.showError(err, 'Error de conexión');
        this.cdr.detectChanges();
      }
    });
  }

  saveEdit(datos: any) {
    this.isSaving = true;
    this.perfilService.actualizarPerfil(datos).subscribe({
      next: (perfilActualizado) => {
        this.perfil = { ...this.perfil, ...perfilActualizado } as VendedorPerfil;
        this.isSaving = false;
        this.uiService.showToast('Perfil actualizado correctamente', 'success');
        this.personalDataCard.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar perfil');
        this.cdr.detectChanges();
      }
    });
  }

  savePassword(nuevaPassword: string) {
    this.isSaving = true;
    this.perfilService.updatePassword(nuevaPassword).subscribe({
      next: () => {
        this.isSaving = false;
        this.uiService.showToast('Contraseña actualizada correctamente', 'success');
        
        if (this.perfil) {
          this.perfil.requiere_cambio_password = false;
        }

        this.securityCard.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar contraseña');
        this.cdr.detectChanges();
      }
    });
  }
}

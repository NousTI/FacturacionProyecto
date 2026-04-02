import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorPerfilService, VendedorPerfil } from './services/perfil-vendedor.service';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { PermissionsCardComponent } from './components/permissions-card/permissions-card.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-vendedor-perfil',
  standalone: true,
  imports: [CommonModule, ProfileCardComponent, PermissionsCardComponent],
  template: `
    <div class="container-fluid py-3 min-vh-100 bg-light-subtle">
      <!-- Loading State -->
      <div *ngIf="loading" class="d-flex justify-content-center align-items-center vh-50">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando perfil...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger mx-auto mt-4" style="max-width: 600px;">
        <div class="d-flex align-items-center">
            <i class="bi bi-exclamation-octagon-fill fs-4 me-3"></i>
            <div>
                <h5 class="alert-heading fw-bold mb-1">Error al cargar perfil</h5>
                <p class="mb-0">{{ error }}</p>
            </div>
        </div>
      </div>

      <!-- Content -->
      <div *ngIf="perfil && !loading">
        <!-- ALERT: CHANGE PASSWORD REQUIRED -->
        <div *ngIf="perfil?.requiere_cambio_password" class="alert-cambio-password mb-3 animate-fade-in shadow-sm">
          <div class="d-flex align-items-center gap-3">
            <div class="alert-icon">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div class="flex-grow-1">
              <h6 class="mb-1 fw-bold text-dark">Cambio de contraseña requerido</h6>
              <p class="mb-0 text-muted small">Por motivos de seguridad, se requiere que actualices tu contraseña de acceso.</p>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <!-- Profile Info Card -->
          <div class="col-lg-5 col-xl-4">
            <app-profile-card
              [nombres]="perfil.nombres"
              [apellidos]="perfil.apellidos"
              [email]="perfil.email"
              [activo]="perfil.activo"
              [documento_identidad]="perfil.documento_identidad"
              [telefono]="perfil.telefono"
              [tipo_comision]="perfil.tipo_comision"
              [fecha_registro]="perfil.fecha_registro"
              [empresas_asignadas]="perfil.empresas_asignadas"
              [ingresos_generados]="perfil.ingresos_generados"
              [isSaving]="isSaving"
              (onUpdate)="guardarPerfil($event)"
              (onChangePassword)="cambiarPassword($event)"
            ></app-profile-card>
          </div>

          <!-- Permissions & Stats -->
          <div class="col-lg-7 col-xl-8">
             <div class="row g-3">
                <div class="col-12">
                    <app-permissions-card
                        [canCreateCompanies]="perfil.puede_crear_empresas"
                        [canManagePlans]="perfil.puede_gestionar_planes"
                        [canAccessCompanies]="perfil.puede_acceder_empresas"
                        [canViewReports]="perfil.puede_ver_reportes"
                    ></app-permissions-card>
                </div>
                <!-- Additional stats or content can go here -->
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vh-50 { height: 50vh; }

    .alert-cambio-password {
      background: #fff9db;
      border-left: 5px solid #fab005;
      padding: 0.85rem 1.15rem;
      border-radius: 14px;
    }
    
    .alert-icon {
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      background: #fab005; color: #fff;
      border-radius: 10px; font-size: 1rem;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class VendedorPerfilPage implements OnInit {
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
    this.uiService.setPageHeader('Mi Perfil', 'Información personal y permisos del vendedor');
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.loading = true;
    this.perfilService.obtenerPerfil().subscribe({
      next: (data) => {
        console.log('Datos recibidos en el componente:', data);
        this.perfil = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.error = 'No se pudo cargar la información del perfil. Intente nuevamente.';
        this.loading = false;
        this.uiService.showError(err, 'Error de conexión');
        this.cdr.detectChanges();
      }
    });
  }

  guardarPerfil(datos: { nombres: string, apellidos: string, telefono: string }) {
    this.isSaving = true;
    this.perfilService.actualizarPerfil({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono
    }).subscribe({
      next: (perfilActualizado) => {
        this.perfil = { ...this.perfil, ...perfilActualizado } as VendedorPerfil;
        this.isSaving = false;
        this.uiService.showToast('Perfil actualizado correctamente', 'success');
        this.cargarPerfil();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar perfil');
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPassword(nueva_password: string) {
    this.isSaving = true;
    this.perfilService.updatePassword(nueva_password).subscribe({
      next: () => {
        this.isSaving = false;
        this.uiService.showToast('Contraseña actualizada correctamente', 'success');
        this.cargarPerfil(); // Recargar para limpiar el flag
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar contraseña');
        this.cdr.detectChanges();
      }
    });
  }
}

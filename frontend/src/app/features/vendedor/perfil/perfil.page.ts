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
    <div class="empresas-page-container">
      <div class="container-fluid px-lg-4 py-4">
        <!-- Loading State -->
        <div *ngIf="loading" class="d-flex justify-content-center align-items-center my-5">
          <div class="spinner-border text-primary spinner-border-sm" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="alert alert-danger mx-auto mt-4" style="max-width: 600px; border-radius: 12px;">
          <small class="mb-0 fw-medium d-flex align-items-center gap-2">
             <i class="bi bi-exclamation-triangle"></i> {{ error }}
          </small>
        </div>

        <!-- Content -->
        <div *ngIf="perfil && !loading" class="animate-fade-in">
          
          <!-- CHANGE PASSWORD REQUIRED -->
          <div *ngIf="perfil.requiere_cambio_password" class="alert-cambio-password p-3 mb-4 d-flex align-items-start gap-3">
              <i class="bi bi-shield-exclamation fs-4 text-warning mt-1"></i>
              <div>
                <p class="mb-1 fw-bold text-dark">Actualización de Seguridad Requerida</p>
                <p class="mb-0 text-secondary small">Por favor modifica tu contraseña actual para continuar navegando de forma segura.</p>
              </div>
          </div>

          <div class="row g-4">
            <div class="col-lg-5 col-xl-4 z-index-1">
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

            <div class="col-lg-7 col-xl-8 z-index-1">
                <app-permissions-card
                    [canCreateCompanies]="perfil.puede_crear_empresas"
                    [canManagePlans]="perfil.puede_gestionar_planes"
                    [canAccessCompanies]="perfil.puede_acceder_empresas"
                    [canViewReports]="perfil.puede_ver_reportes"
                ></app-permissions-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empresas-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: #161d35;
        letter-spacing: -0.5px;
        margin-bottom: 0.25rem;
    }
    
    .alert-cambio-password {
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 16px;
        border-left: 5px solid #f59e0b;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }

    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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

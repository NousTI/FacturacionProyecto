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
    <div class="container-fluid py-4 min-vh-100 bg-light-subtle">
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
      <div *ngIf="perfil && !loading" class="animate__animated animate__fadeIn">
        <h2 class="fw-bold mb-4 text-dark px-2">Mi Perfil</h2>
        
        <div class="row g-4">
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
            ></app-profile-card>
          </div>

          <!-- Permissions & Stats -->
          <div class="col-lg-7 col-xl-8">
             <div class="row g-4">
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
  `]
})
export class VendedorPerfilPage implements OnInit {
  perfil: VendedorPerfil | null = null;
  loading: boolean = true;
  error: string | null = null;

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
}

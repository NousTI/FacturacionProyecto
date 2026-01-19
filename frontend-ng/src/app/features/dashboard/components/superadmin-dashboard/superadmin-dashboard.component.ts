import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosSuscripcionListComponent } from '../pagos-suscripcion-list/pagos-suscripcion-list.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

import { EmpresasListComponent } from '../empresas-list/empresas-list.component';
import { VendedoresListComponent } from '../vendedores-list/vendedores-list.component';
import { ComisionesListComponent } from '../comisiones-list/comisiones-list.component';
import { ResumenGeneralComponent } from '../resumen-general/resumen-general.component';
import { PlanesListComponent } from '../planes-list/planes-list.component';
import { DashboardModuleShellComponent } from '../widgets/dashboard-module-shell/dashboard-module-shell.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, EmpresasListComponent, PagosSuscripcionListComponent, VendedoresListComponent, ComisionesListComponent, PlanesListComponent, ResumenGeneralComponent, DashboardModuleShellComponent],
  template: `
    <div class="d-flex min-vh-100" style="background-color: #f8f9fa; font-family: 'Inter', system-ui, sans-serif;">
      
      <!-- Fixed Sidebar -->
      <app-sidebar 
        [activeView]="currentView()" 
        (navigate)="onNavigate($event)">
      </app-sidebar>
      
      <!-- Main Content Container with Fixed Margin for Sidebar -->
      <div 
        class="flex-grow-1 d-flex flex-column h-100 main-content" 
        style="margin-left: 250px;"
      >
        <app-header 
          [title]="headerInfo().title" 
          [subtitle]="headerInfo().subtitle">
        </app-header>
        
        <app-dashboard-module-shell>
            <!-- Access Control Wrapper -->
            @if (authService.isSuperadmin()) {
                <!-- Dashboard Content -->
                @if (currentView() === 'resumen') {
                    <app-resumen-general></app-resumen-general>
                } @else if (currentView() === 'empresas') {
                    <app-empresas-list></app-empresas-list>
                } @else if (currentView() === 'vendedores') {
                    <app-vendedores-list></app-vendedores-list>
                } @else if (currentView() === 'pagos') {
                    <app-pagos-suscripcion-list></app-pagos-suscripcion-list>
                } @else if (currentView() === 'comisiones') {
                    <app-comisiones-list></app-comisiones-list>
                } @else if (currentView() === 'planes') {
                    <app-planes-list></app-planes-list>
                } @else {
                    <!-- Placeholders for new modules -->
                    <div class="card border-0 rounded-4 p-5 text-center shadow-sm">
                        <div class="fs-1 mb-3">🛠️</div>
                        <h2 class="fw-bold">Módulo en Desarrollo</h2>
                        <p class="text-secondary">El módulo de <strong>{{ currentView() | titlecase }}</strong> está siendo implementado.</p>
                        <button class="btn btn-primary mt-3 rounded-pill px-4" (click)="onNavigate('resumen')">
                            Volver al Dashboard
                        </button>
                    </div>
                }
            } @else {
                <!-- Unauthorized Message -->
                <div class="d-flex align-items-center justify-content-center h-100">
                    <div class="text-center p-5">
                        <div class="fs-1 mb-3">🚫</div>
                        <h2 class="fw-bold">Acceso Denegado</h2>
                        <p class="text-secondary">No tienes permisos para acceder a esta sección.</p>
                        <button class="btn btn-dark mt-3 rounded-pill px-4" (click)="authService.logout().subscribe()">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            }
        </app-dashboard-module-shell>
      </div>
    </div>
  `,
  styles: [`
    .main-content {
        transition: padding 0.3s ease-in-out;
    }
  `]
})
export class SuperadminDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentView = signal<string>('resumen');

  headerInfo = computed(() => {
    const view = this.currentView();
    switch (view) {
      case 'resumen':
        return {
          title: 'Resumen General',
          subtitle: 'Métricas clave y rendimiento del ecosistema SaaS.'
        };
      case 'empresas':
        return {
          title: 'Gestión de Empresas',
          subtitle: 'Administración, control y seguimiento de clientes.'
        };
      case 'vendedores':
        return {
          title: 'Equipo de Ventas',
          subtitle: 'Gestión de comisionistas y rendimiento comercial.'
        };
      case 'pagos':
        return {
          title: 'Historial de Pagos',
          subtitle: 'Control de suscripciones, pagos y transacciones.'
        };
      case 'planes':
        return {
          title: 'Gestión de Planes',
          subtitle: 'Definición de reglas de negocio, límites y precios.'
        };
      case 'comisiones':
        return {
          title: 'Finanzas del SaaS',
          subtitle: 'Cálculo de comisiones, ingresos y conciliaciones bancarias.'
        };
      case 'certificados':
        return {
          title: 'Certificados SRI',
          subtitle: 'Gestión de firmas electrónicas y vigencia de certificados.'
        };
      case 'reportes':
        return {
          title: 'Análisis y Reportes',
          subtitle: 'Generación de informes estratégicos y operativos.'
        };
      case 'auditoria':
        return {
          title: 'Auditoría de Actividad',
          subtitle: 'Registro histórico de acciones y seguridad del sistema.'
        };
      case 'configuracion':
        return {
          title: 'Configuración de Sistema',
          subtitle: 'Ajustes globales, parámetros técnicos y seguridad.'
        };
      default:
        return {
          title: 'Panel de Control',
          subtitle: 'Gestión y monitoreo del sistema facturación.'
        };
    }
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['view']) {
        this.currentView.set(params['view']);
      } else {
        // Redirect to resumen view if no view is specified
        this.onNavigate('resumen');
      }
    });
  }

  onNavigate(view: string) {
    this.currentView.set(view);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge'
    });
  }
}

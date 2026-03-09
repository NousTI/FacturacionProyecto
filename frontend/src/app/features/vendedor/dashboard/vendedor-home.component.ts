import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorHomeService, VendedorHomeData } from './services/vendedor-home.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { finalize } from 'rxjs/operators';

// Nuevos componentes de sección
import { DashboardStatsComponent } from './componentes/dashboard-stats.component';
import { DashboardAlertasComponent } from './componentes/dashboard-alertas.component';
import { DashboardAccionesComponent } from './componentes/dashboard-acciones.component';
import { DashboardEmpresasComponent } from './componentes/dashboard-empresas.component';

@Component({
  selector: 'app-vendedor-home',
  standalone: true,
  imports: [
    CommonModule, 
    ToastComponent,
    DashboardStatsComponent,
    DashboardAlertasComponent,
    DashboardAccionesComponent,
    DashboardEmpresasComponent
  ],
  template: `
    <div class="dash-wrap">
      
      <!-- Fila 1: KPIs -->
      <app-dashboard-stats [stats]="data?.stats"></app-dashboard-stats>

      <div class="row g-3 mb-4">
        <!-- Fila 2: Alertas -->
        <div class="col-lg-8">
          <app-dashboard-alertas 
            [alertas]="data?.alertas || []" 
            [isLoading]="isLoading">
          </app-dashboard-alertas>
        </div>

        <!-- Fila 2: Acciones Rápidas -->
        <div class="col-lg-4">
          <app-dashboard-acciones></app-dashboard-acciones>
        </div>
      </div>

      <!-- Fila 3: Empresas -->
      <app-dashboard-empresas 
        [empresas]="data?.empresas || []" 
        [isLoading]="isLoading">
      </app-dashboard-empresas>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .dash-wrap { min-height: 100vh; padding-bottom: 2rem; }
  `]
})
export class VendedorHomeComponent implements OnInit {
  data: VendedorHomeData | null = null;
  isLoading = false;

  constructor(
    private homeService: VendedorHomeService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    this.homeService.getHomeData()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          console.log('[VendedorHome] Datos recibidos del dashboard:', res);
          this.data = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar panel de inicio');
          this.cdr.detectChanges();
        }
      });
  }
}
